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


"""Sources of the Job tcpdump_pcap"""

__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Joaquin MUGUERZA <joaquin.muguerza@viveris.fr>
 * Francklin SIMO <francklin.simo@viveris.fr>
 * David FERNANDES <david.fernandes@viveris.fr>
'''

import os
import sys
import syslog
import pathlib
import argparse
import itertools
import traceback
import subprocess
import contextlib

import collect_agent

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

def build_capture_filter(src_ip, dst_ip, src_port, dst_port, proto):
    """Build a capture filter
    """
    capture_filter = []

    if src_ip is not None:
       capture_filter.append('ip src {}'.format(src_ip))

    if dst_ip is not None:
        capture_filter.append('ip dst {}'.format(dst_ip))

    if proto is not None:
       capture_filter.append('{}'.format(proto.lower()))

    if src_port is not None:
       if proto is not None:
          capture_filter.append('{} src port {}'.format(proto, src_port))
       else:
          capture_filter.append('src port {}'.format(src_port))

    if dst_port is not None:
       if proto is not None:
          capture_filter.append('{} dst port {}'.format(proto, dst_port))
       else:
          capture_filter.append('dst port {}'.format(dst_port))

    return ' and '.join(capture_filter) if capture_filter else ''
    

def main(src_ip, dst_ip, src_port, dst_port, proto, interface, capture_file, duration):
    """Capture packets on a live network interface. Only consider packets matching the specified fields."""
    capture_filter = build_capture_filter(src_ip, dst_ip, src_port, dst_port, proto)
    try:
      parent = pathlib.Path(capture_file).parent
      pathlib.Path(parent).mkdir(parents=True, exist_ok=True)
      cmd = ['tcpdump', '-i', interface, capture_filter, '-w', capture_file, '-Z', 'root']
      if duration:
         cmd += ['-G', str(duration), '-W', str(1)]
      print(cmd)   
      p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
      if p.returncode != 0:
         message = 'ERROR when lauching tcpdump: {}'.format(p.stderr)
         collect_agent.send_log(syslog.LOG_ERR, message)
         sys.exit(message)

    except Exception as ex:
      message = 'ERROR when capturing: {}'.format(ex)
      print(message)
      collect_agent.send_log(syslog.LOG_ERR, message)
      sys.exit(message)
   


if __name__ == '__main__':
    with use_configuration('/opt/openbach/agent/jobs/tcpdump_pcap/tcpdump_pcap_rstats_filter.conf'):
        # Define Usage
        parser = argparse.ArgumentParser(
              description='Launch tcpdump tool in order to capture IP packets. '
              'If a filter is specified, only the filtered packets will be captured. '
              'The captured traffic is saved to an output file.',
              formatter_class=argparse.ArgumentDefaultsHelpFormatter)
        
        parser.add_argument('capture_file', type=str, help='Path to the file to save captured packets')
        parser.add_argument('-i', '--interface', type=str, default='any', help='Network interface to sniff')
        parser.add_argument('-A', '--src-ip', help='Source IP address')
        parser.add_argument('-a', '--dst-ip', help='Destination IP address')
        parser.add_argument('-D', '--src-port', type=int, help='Source port number')
        parser.add_argument('-d', '--dst-port', type=int, help='Destination port number')
        parser.add_argument('-p', '--proto', choices=['udp', 'tcp'], help='Transport protocol')
        parser.add_argument('-t', '--duration', type=int, default=None, help='Duration of the capture in seconds')

        args = vars(parser.parse_args())
        main(**args)


