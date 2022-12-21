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


"""Sources of the Job fping"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Adrien THIBAUD <adrien.thibaud@toulouse.viveris.com>
 * David PRADAS <david.pradas@toulouse.viveris.com>
 * Mathias ETTINGER <mathias.ettinger@toulouse.viveris.com>
 * Joaquin MUGUERZA <joaquin.muguerza@toulouse.viveris.com>
'''

import os
import re
import sys
import syslog
import argparse
import traceback
import contextlib
import subprocess
from statistics import mean

import collect_agent


def command_line_flag_for_argument(argument, flag):
    if argument is not None:
        yield flag
        yield str(argument)


def main(destination_ip, count, interval, interface, packetsize, ttl, n_mean):
    cmd = ['fping', destination_ip, '-e', '-D']
    if count == 0:
        cmd += ['-l']
    else:
        cmd += ['-c', str(count)]
    cmd.extend(command_line_flag_for_argument(interval, '-p'))
    cmd.extend(command_line_flag_for_argument(interface, '-I'))
    cmd.extend(command_line_flag_for_argument(packetsize, '-b'))
    cmd.extend(command_line_flag_for_argument(ttl, '-t'))

    pattern = re.compile(r'\[(\d+\.\d+)\] {} : \[\d+\], \d+ bytes, (\d+\.?\d*) '.format(destination_ip))
    measurements = []

    # launch command
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    while True:
        # read output
        output = p.stdout.readline().decode().rstrip()
        if not output:
            # this should be the blank line before summary
            if p.poll() is not None:
                # Process ended gracefully
                break
            continue

        match = re.match(pattern, output)
        
        if match is None:
            message = 'Unrecognised fping output: {}'.format(output)
            collect_agent.send_log(syslog.LOG_WARNING, message)
            continue

        try:
            timestamp, rtt_data = map(float, match.groups())
        except ValueError as exception:
            message = 'ERROR on line \'{}\': {}'.format(output, exception)
            collect_agent.send_log(syslog.LOG_ERR, message)
        else:
            measurements.append(rtt_data)
            if len(measurements) == n_mean:
                collect_agent.send_stat(int(timestamp * 1000), rtt=mean(measurements))
                measurements.clear()


if __name__ == "__main__":
    with collect_agent.use_configuration('/opt/openbach/agent/jobs/fping/fping_rstats_filter.conf'):
        # Define Usage
        parser = argparse.ArgumentParser(
                description=__doc__,
                formatter_class=argparse.ArgumentDefaultsHelpFormatter)
        parser.add_argument('destination_ip', help='')
        parser.add_argument('-c', '--count', type=int, default=0, help='')
        parser.add_argument('-i', '--interval', type=int, help='')
        parser.add_argument('-I', '--interface', type=str, help='')
        parser.add_argument('-s', '--packetsize', type=int, help='')
        parser.add_argument('-t', '--ttl', type=int, help='')
        parser.add_argument('-m', '--mean', type=int, default=1, help='')

        # get args
        args = parser.parse_args()
        destination_ip = args.destination_ip
        count = args.count
        interval = args.interval
        interface = args.interface
        packetsize = args.packetsize
        ttl = args.ttl
        n_mean = args.mean

        main(destination_ip, count, interval, interface, packetsize, ttl, n_mean)
