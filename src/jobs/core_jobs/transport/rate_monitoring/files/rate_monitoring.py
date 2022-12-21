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


"""Sources of the Job rate_monitoring"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Adrien THIBAUD <adrien.thibaud@toulouse.viveris.com>
 * Mathias ETTINGER <mathias.ettinger@toulouse.viveris.com>
 * Joaquin MUGUERZA <joaquin.muguerza@toulouse.viveris.com>
'''

import os
import sys
import time
import syslog
import signal
import argparse
import threading
from functools import partial

os.environ['XTABLES_LIBDIR'] = '$XTABLES_LIBDIR:/usr/lib/x86_64-linux-gnu/xtables' # Required for Ubuntu 20.04
import iptc
from apscheduler.schedulers.blocking import BlockingScheduler

import collect_agent


def signal_term_handler(chain, rule, signal, frame):
    chain.delete_rule(rule)
    sys.exit(0)


def monitor(chain, mutex, previous):
    # Refresh the table (allowing to update the stats)
    table = iptc.Table(iptc.Table.FILTER)
    table.refresh()

    # Get the rule (Attention, the rule shall be in first position)
    rule = chain.rules[0]

    # Get the stats
    timestamp = int(time.perf_counter() * 1000)
    bytes_count = rule.get_counters()[1]

    # Get previous stats and update them
    with mutex:
        previous_timestamp, previous_bytes_count = previous
        previous[:] = timestamp, bytes_count

    diff_timestamp = (timestamp - previous_timestamp) / 1000  # in seconds
    rate = (bytes_count - previous_bytes_count) * 8 / diff_timestamp

    # Send the stat to the Collector
    collect_agent.send_stat(collect_agent.now(), rate=rate)


def main(sampling_interval, chain_name, source_ip=None, destination_ip=None,
         protocol=None, in_interface=None, out_interface=None, dport=None, sport=None):
    table = iptc.Table(iptc.Table.FILTER)
    chains = [chain for chain in table.chains if chain.name == chain_name]
    try:
        chain, = chains
    except ValueError:
        message = 'ERROR: {} does not exist in FILTER table'.format(chain_name)
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)

    # Creation of the Rule
    rule = iptc.Rule(chain=chain)
    signal.signal(signal.SIGTERM, partial(signal_term_handler, chain, rule))

    # Add Matchs
    if source_ip is not None:
        rule.src = source_ip
    if destination_ip is not None:
        rule.dst = destination_ip
    if protocol is not None:
        rule.protocol = protocol
    if in_interface is not None:
        rule.in_interface = in_interface
    if out_interface is not None:
        rule.out_interface = out_interface
    if sport is not None:
        match = iptc.Match(rule, protocol)
        match.sport = sport
        rule.add_match(match)
    if dport is not None:
        match = iptc.Match(rule, protocol)
        match.dport = dport
        rule.add_match(match)

    # Add the Target
    rule.create_target('')
    chain.insert_rule(rule)
    
    collect_agent.send_log(syslog.LOG_DEBUG, "Added iptables rule for monitoring")

    # Save the first stats for computing the rate
    mutex = threading.Lock()
    previous = [int(time.perf_counter() * 1000), rule.get_counters()[1]]

    # Monitoring
    sched = BlockingScheduler()
    sched.add_job(
            monitor, 'interval',
            seconds=sampling_interval,
            args=(chain, mutex, previous))
    sched.start()


if __name__ == '__main__':
    with collect_agent.use_configuration('/opt/openbach/agent/jobs/rate_monitoring/rate_monitoring_rstats_filter.conf'):
        # Define Usage
        parser = argparse.ArgumentParser(
                description=__doc__,
                formatter_class=argparse.ArgumentDefaultsHelpFormatter)
        parser.add_argument(
                'sampling_interval', type=int,
                help='Time interval (in sec) used to calculate rate')
        parser.add_argument(
                'chain_name', choices=['INPUT','OUTPUT','FORWARD'],
                help='The iptables chain to monitor')
        parser.add_argument(
                '-s', '--source-ip',
                help='The source IPs to monitor (with or without mask[ip/mask])')
        parser.add_argument(
                '-d', '--destination-ip',
                help='The destination IPs to monitor(with or without mask [ip/mask])')
        parser.add_argument(
                '-i', '--in-interface',
                help='The incomming interface of the packets to monitor')
        parser.add_argument(
                '-o', '--out-interface',
                help='The outgoing interface of the packets to monitor')

        # Sub-commands functionnality to split server and client mode
        subparsers = parser.add_subparsers(
                title='Subcommand protocol type', dest='protocol',
                help='Choose the protocol type to monitor')
        parser_tcp = subparsers.add_parser('tcp', help='Monitor tcp flow')
        parser_tcp.add_argument(
                '--dport', type=str,
                help='The destination port to monitor')
        parser_tcp.add_argument(
                '--sport', type=str,
                help='The source port to monitor')
        parser_udp = subparsers.add_parser('udp', help='Monitor udp flow')
        parser_udp.add_argument(
                '--dport', type=str,
                help='The destination port to monitor')
        parser_udp.add_argument(
                '--sport', type=str,
                help='The source port to monitor')
        parser_tcp = subparsers.add_parser('icmp', help='Monitor icmp flow') 
    
        # get args
        args = vars(parser.parse_args())
        main(**args)
