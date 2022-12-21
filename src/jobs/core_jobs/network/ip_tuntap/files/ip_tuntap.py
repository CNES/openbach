#!/usr/bin/env python3

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


"""Sources of the Job ip_tuntap"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * David FERNANDES <david.fernandes@viveris.fr>
'''

import sys
import shlex
import syslog
import argparse
import subprocess

import collect_agent


def main(command, mode, name):
    cmd = ['ip', 'tuntap', command, 'mode', mode, name]
    try:
        subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.DEVNULL, check=True)
    except subprocess.CalledProcessError as p:
        message = 'Error when executing command {}: {}'.format(shlex.join(cmd), p.stderr.decode())
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)


if __name__ == '__main__':
    with use_configuration('/opt/openbach/agent/jobs/ip_tuntap/ip_tuntap_rstats_filter.conf'):
        #Define Usage
        parser = argparse.ArgumentParser(
                description=__doc__,
                formatter_class=argparse.ArgumentDefaultsHelpFormatter)
        parser.add_argument(
                'command', choices=['add', 'delete'],
                help='the action to perform')
        parser.add_argument(
                'mode', choices=['tun','tap'],
                help='the mode of the interface')
        parser.add_argument(
                'name', type=str,
                help='the name of the interface')

        args = parser.parse_args()
        main(args.command, args.mode, args.name)
