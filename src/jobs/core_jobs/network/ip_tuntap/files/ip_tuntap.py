#!/usr/bin/env python3

# OpenBACH is a generic testbed able to control/configure multiple
# network/physical entities (under test) and collect data from them. It is
# composed of an Auditorium (HMIs), a Controller, a Collector and multiple
# Agents (one for each network entity that wants to be tested).
#
#
# Copyright © 2016-2020 CNES
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


"""Sources of the Job ip_tuntap"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * David FERNANDES <david.fernandes@viveris.fr>
'''

import os
import sys
import syslog
import argparse
import traceback
import contextlib
import subprocess

import collect_agent


def run_command(cmd):
    p = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE)
    if p.returncode:
        message = "Error when executing command '{}': '{}'".format(
                    ' '.join(cmd), p.stderr.decode())
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)
    return p.returncode, p.stdout.decode()

@contextlib.contextmanager
def use_configuration(filepath):
    success = collect_agent.register_collect(filepath)
    if not success:
        message = 'ERROR connecting to collect-agent'
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)
    collect_agent.send_log(syslog.LOG_DEBUG, 'Starting job ' + os.environ.get('JOB_NAME', '!'))
    try:
        yield
    except Exception:
        message = traceback.format_exc()
        collect_agent.send_log(syslog.LOG_CRIT, message)
        raise
    except SystemExit as e:
        if e.code != 0:
            collect_agent.send_log(syslog.LOG_CRIT, 'Abrupt program termination: ' + str(e.code))
        raise

def main(command, mode, name):
    cmd = ['ip', 'tuntap', command, 'mode', mode, name]
    run_command(cmd)


if __name__ == '__main__':
    with use_configuration('/opt/openbach/agent/jobs/ip_tuntap/ip_tuntap_rstats_filter.conf'):
        #Define Usage
        parser = argparse.ArgumentParser(
                description=__doc__,
                formatter_class=argparse.ArgumentDefaultsHelpFormatter)
        parser.add_argument('command', choices=['add', 'delete'],
                help='the action to perform')
        parser.add_argument('mode', choices=['tun','tap'],
                help='the mode of the interface')
        parser.add_argument('name', type=str,
                help='the name of the interface')

        args = parser.parse_args()
        main(args.command, args.mode, args.name)

