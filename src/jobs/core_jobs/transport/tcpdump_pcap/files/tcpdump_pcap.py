#!/usr/bin/env python3


# OpenBACH is a generic testbed able to control/configure multiple
# network/physical entities (under test) and collect data from them. It is
# composed of an Auditorium (HMIs), a Controller, a Collector and multiple
# Agents (one for each network entity that wants to be tested).
#
#
# Copyright © 2016-2023 CNES
# Copyright © 2022 Eutelsat
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


"""Sources of the Job tcpdump_pcap"""

__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Joaquin MUGUERZA <joaquin.muguerza@viveris.fr>
 * Francklin SIMO <francklin.simo@viveris.fr>
 * David FERNANDES <david.fernandes@viveris.fr>
 * Bastien TAURAN <bastien.tauran@viveris.fr>
'''

import sys
import signal
import syslog
import pathlib
import argparse
import subprocess
from tempfile import mkstemp
from functools import partial

import collect_agent


def save_pcap(capture_file, copy, signum=None, frame=None):
    collect_agent.store_files(collect_agent.now(), pcap_file=capture_file, copy=copy)


def format_capture_filter(src_ip, dst_ip, src_port, dst_port, proto, ignore_ports=()):
    """Build a capture filter"""

    if src_ip is not None:
        yield 'ip src {}'.format(src_ip)

    if dst_ip is not None:
        yield 'ip dst {}'.format(dst_ip)

    if proto is not None:
        proto = proto.lower()
        yield proto

    if src_port is not None:
        if proto is not None:
            yield '{} src port {}'.format(proto, src_port)
        else:
            yield 'src port {}'.format(src_port)

    if dst_port is not None:
        if proto is not None:
            yield '{} dst port {}'.format(proto, dst_port)
        else:
            yield 'dst port {}'.format(dst_port)

    for p in ignore_ports:
        yield 'port not {}'.format(p)


def main(src_ip, dst_ip, src_port, dst_port, proto, ignore_ports, interface, capture_file, duration):
    """Capture packets on a live network interface. Only consider packets matching the specified fields."""

    do_save_pcap = partial(save_pcap, capture_file, False)
    if not capture_file:
        with mkstemp(prefix='openbach_tcpdump_', suffix='_capture.pcap') as f:
            capture_file = f.name
        do_save_pcap = partial(save_pcap, capture_file, True)
    signal.signal(signal.SIGTERM, do_save_pcap)
    signal.signal(signal.SIGINT, do_save_pcap)

    capture_file = pathlib.Path(capture_file)
    capture_filter = ' and '.join(format_capture_filter(src_ip, dst_ip, src_port, dst_port, proto, ignore_ports))
    cmd = ['tcpdump', '-i', interface, capture_filter, '-w', capture_file.as_posix(), '-Z', 'root']
    if duration:
        cmd += ['-G', str(duration), '-W', '1']

    try:
        capture_file.parent.mkdir(parents=True, exist_ok=True)
        capture_file.unlink(missing_ok=True)
        subprocess.run(cmd, capture_output=True, text=True, check=True)
    except subprocess.CalledProcessError as p:
        message = 'ERROR when launching tcpdump: {}'.format(p.stderr)
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)
    except Exception as ex:
        message = 'ERROR when capturing: {}'.format(ex)
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)
    else:
        do_save_pcap()


if __name__ == '__main__':
    with collect_agent.use_configuration('/opt/openbach/agent/jobs/tcpdump_pcap/tcpdump_pcap_rstats_filter.conf'):
        # Define Usage
        parser = argparse.ArgumentParser(
              description='Launch tcpdump tool in order to capture IP packets. '
              'If a filter is specified, only the filtered packets will be captured. '
              'The captured traffic is saved to an output file.',
              formatter_class=argparse.ArgumentDefaultsHelpFormatter)

        parser.add_argument(
                '-f', '--capture_file', type=argparse.FileType('w'),
                help='The path to the file to save captured file. Leave blank '
                'to let the collector determine location, and save it as a statistic')
        parser.add_argument('-i', '--interface', default='any', help='Network interface to sniff')
        parser.add_argument('-A', '--src-ip', help='Source IP address')
        parser.add_argument('-a', '--dst-ip', help='Destination IP address')
        parser.add_argument('-D', '--src-port', type=int, help='Source port number')
        parser.add_argument('-d', '--dst-port', type=int, help='Destination port number')
        parser.add_argument('-p', '--proto', choices=['udp', 'tcp'], help='Transport protocol')
        parser.add_argument('-t', '--duration', type=int, default=None, help='Duration of the capture in seconds')
        parser.add_argument(
                '-n', '--ignore-ports',
                type=int, nargs='+', default=[],
                help='Do not capture if one of the following ports is used')

        args = parser.parse_args()
        if args.capture_file:
            with args.capture_file as f:
                args.caputure_file = f.name

        main(**vars(args))
