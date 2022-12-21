#!/usr/bin/python

# OpenBACH is a generic testbed able to control/configure multiple
# network/physical entities (under test) and collect data from them. It is
# composed of an Auditorium (HMIs), a Controller, a Collector and multiple
# Agents (one for each network entity that wants to be tested).
#
#
# Copyright © 2016-2023 CNES
#
#
# This file is part of the OpenBACH testbed.
#
#
# OpenBACH is a free software : you can redistribute it and/or modify it under
# the terms of the GNU General Public License as published by the Free Software
# Foundation, either version 3 of the License, or (at your option) any later
# version.
#
# This program is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY, without even the implied warranty of MERCHANTABILITY or FITNESS
# FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
# details.
#
# You should have received a copy of the GNU General Public License along with
# this program. If not, see http://www.gnu.org/licenses/.


"""OpenBACH Job synchronization

Verify ntp agents synchronization and force a re-synchronization if necessary.
"""

__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Adrien THIBAUD <adrien.thibaud@toulouse.viveris.com>
 * Léa THIBOUT <lea.thibout@viveris.fr>
 * Mathias ETTINGER <mathias.ettinger@toulouse.viveris.com>
'''

import os
import sys
import math
import syslog
import argparse
import traceback
import subprocess
import contextlib
from time import perf_counter
from itertools import zip_longest

import collect_agent


def get_ntp_offset(retries=None, sleep_time=None):
    command = ['ntp-wait']
    if retries is not None:
        command.extend(['-n', str(retries)])
    if sleep_time is not None:
        command.extend(['-s', str(sleep_time)])

    try:
        subprocess.run(command, check=True)
    except subprocess.CalledProcessError:
        return math.inf

    ntp = subprocess.run(['ntpq', '-p'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    peers = {k: v for k, _, *v in zip_longest(*map(str.split, ntp.stdout.decode('utf-8').splitlines()))}
    for remote, offset in zip(peers['remote'], peers['offset']):
        if remote.startswith('*'):
            return float(offset)

    # This shouldn't be necessary, but just in case something
    # happen to the ntp process between the two `subprocess.run`...
    return math.inf


def check_timeout(start_time, timeout):
    elapsed = perf_counter() - start_time
    if elapsed >= timeout:
        message = 'Timeout: the agent is taking too long to synchronize '
        'or the offset is too demanding. Try increasing the timeout or '
        'the offset for this job.'
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)


def main(synchro_offset, timeout, retries=None, sleep_time=None):
    start_time = perf_counter()
    while abs(get_ntp_offset(retries, sleep_time)) > synchro_offset:
        check_timeout(start_time, timeout)

        try:
            subprocess.run(['systemctl', 'stop', 'ntp.service'], check=True)
            subprocess.run(['ntpd', '-gq'], check=True)
        except subprocess.CalledProcessError as e:
            message = 'Error when interacting with the NTP daemon: {}'.format(e)
            collect_agent.send_log(syslog.LOG_ERR, message)
            sys.exit(message)
        else:
            check_timeout(start_time, timeout)
        finally:
            subprocess.run(['systemctl', 'start', 'ntp.service'])


if __name__ == "__main__":
    with collect_agent.use_configuration('/opt/openbach/agent/jobs/synchronization/synchronization_rstats_filter.conf'):
        parser = argparse.ArgumentParser(
                description=__doc__,
                formatter_class=argparse.ArgumentDefaultsHelpFormatter)
        parser.add_argument(
                'synchro_offset', metavar='synchro_offset', type=float,
                help='Maximal offset difference where we have to do a resynchronization'
                'in milliseconds (float)')
        parser.add_argument(
                'timeout', metavar='timeout', type=float,
                help='Maximal job duration in seconds (float)')
        parser.add_argument(
                '-r', '--retries', type=int,
                help='Number of tries by ntp-wait, during the time we '
                'want to wait for ntp to be synchronized (int)')
        parser.add_argument(
                '-s', '--sleep_time', type=int,
                help='Sleep time during each ntp-wait tries in seconds (int)')

        args = parser.parse_args()
        main(args.synchro_offset, args.timeout, args.retries, args.sleep_time)
