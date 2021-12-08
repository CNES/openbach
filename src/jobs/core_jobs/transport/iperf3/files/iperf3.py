#!/usr/bin/env python3
# -*- coding: utf-8 -*-

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


"""Sources of the Job iperf3"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Joaquin MUGUERZA <joaquin.muguerza@viveris.fr>
 * Mathias ETTINGER <mathias.ettinger@viveris.fr>
 * David PRADAS <david.pradas@viveris.fr>
 * Bastien TAURAN <bastien.tauran@viveris.fr>

'''


import os
import re
import sys
import time
import syslog
import argparse
import traceback
import subprocess
import contextlib
from itertools import repeat
from collections import defaultdict

import collect_agent


BRACKETS = re.compile(r'[\[\]]')


class AutoIncrementFlowNumber:
    def __init__(self):
        self.count = 0

    def __call__(self):
        self.count += 1
        return 'Flow{0.count}'.format(self)


@contextlib.contextmanager
def use_configuration(filepath):
    success = collect_agent.register_collect(filepath)
    if not success:
        message = 'ERROR connecting to collect-agent'
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)
    collect_agent.send_log(
        syslog.LOG_DEBUG, 'Starting job ' + os.environ.get('JOB_NAME', '!'))
    try:
        yield
    except Exception:
        message = traceback.format_exc()
        collect_agent.send_log(syslog.LOG_CRIT, message)
        raise
    except SystemExit as e:
        if e.code != 0:
            collect_agent.send_log(
                syslog.LOG_CRIT, 'Abrupt program termination: ' + str(e.code))
        raise


def run_process(cmd):
    try:
        p = subprocess.Popen(cmd, stdout=subprocess.PIPE,
                             stderr=subprocess.PIPE)
    except Exception as ex:
        message = 'Error running {} : {}'.format(cmd, ex)
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)

    return p


def _parse_to_bytes(entry):
    if entry.isnumeric():
        return int(entry)
    value, unit = int(entry[:-1]), entry[-1]
    if unit == 'K':
        return value * 1024
    if unit == 'M':
        return value * 1024 * 1024
    if unit == 'G':
        return value * 1024 * 1024 * 1024


def multiplier(unit, base):
    if unit == base:
        return 1
    if unit.startswith('GBytes'):
        return 1024 * 1024 * 1024
    if unit.startswith('MBytes'):
        return 1024 * 1024
    if unit.startswith('KBytes'):
        return 1024
    if unit.startswith('m'):
        return 0.001
    if unit.startswith('Gbits'):
        return 1000 * 1000 * 1000
    if unit.startswith('Mbits'):
        return 1000 * 1000
    if unit.startswith('Kbits'):
        return 1000
    collect_agent.send_log(
        syslog.LOG_ERR, 'Units of iperf metrics are not available/correct')
    return 1


def _command_build_helper(flag, value):
    if value is not None:
        yield flag
        yield str(value)


def sender(cmd):
    p = run_process(cmd)
    flow_map = defaultdict(AutoIncrementFlowNumber())

    first_line = {}
    total_sent_data = {}

    for flow_number in repeat(None):
        line = p.stdout.readline().decode()
        tokens = BRACKETS.sub('', line).split()
        if not tokens:
            if p.poll() is not None:
                break
            continue

        timestamp = int(time.time() * 1000)
        try:
            try:
                # check if it is a line with total download time
                if len(tokens) < 2:
                    continue
                flow = tokens[0]
                interval_begin, interval_end = map(float, tokens[1].split("-"))
                try:
                    flow_number = flow_map[int(flow)]
                except ValueError:
                    if flow.upper() != "SUM":
                        continue
                if interval_begin == 0 and flow in first_line:
                    statistics = {'download_time': interval_end}
                    collect_agent.send_stat(
                        timestamp, suffix=flow_number, **statistics)
                    del first_line[flow]
                    continue

                # otherwise test if TCP or UDP traffic
                flow, duration, _, transfer, transfer_units, bandwidth, bandwidth_units, total_datagrams = tokens
                total_datagrams = int(total_datagrams)
            except ValueError:
                udp = False
                flow, duration, _, transfer, transfer_units, bandwidth, bandwidth_units, retries, cwnd, cwnd_units = tokens
                retries = int(retries)
                cwnd = float(cwnd)
            else:
                udp = True
            transfer = float(transfer)
            bandwidth = float(bandwidth)
            interval_begin, interval_end = map(float, duration.split('-'))
        except ValueError:
            # filter out non-stats lines
            continue

        try:
            flow_number = flow_map[int(flow)]
        except ValueError:
            if flow.upper() != "SUM":
                continue

        first_line[flow] = True
        if flow not in total_sent_data:
            total_sent_data[flow] = 0
        total_sent_data[flow] += transfer * multiplier(transfer_units, 'Bytes')

        statistics = {
            'sent_data': total_sent_data[flow],
            'throughput': bandwidth * multiplier(bandwidth_units, 'bits/sec'),
        }

        if udp:
            statistics['sent_pkts'] = total_datagrams
        else:
            statistics['cwnd'] = cwnd * multiplier(cwnd_units, 'Bytes')
            statistics['retransmissions'] = retries
        collect_agent.send_stat(timestamp, suffix=flow_number, **statistics)

    error_log = p.stderr.readline()
    if error_log:
        error_msg = 'Error when launching iperf3: {}'.format(error_log)
        collect_agent.send_log(syslog.LOG_ERR, error_msg)
        sys.exit(error_msg)
    p.wait()


def receiver(cmd):
    p = run_process(cmd)
    flow_map = defaultdict(AutoIncrementFlowNumber())

    first_line = {}
    total_sent_data = {}

    for flow_number in repeat(None):
        line = p.stdout.readline().decode()
        tokens = BRACKETS.sub('', line).split()
        if not tokens:
            if p.poll() is not None:
                break
            continue

        timestamp = int(time.time() * 1000)
        try:
            try:
                # check if it is a line with total download time
                if len(tokens) < 2:
                    continue
                flow = tokens[0]
                interval_begin, interval_end = map(float, tokens[1].split("-"))
                try:
                    flow_number = flow_map[int(flow)]
                except ValueError:
                    if flow.upper() != "SUM":
                        continue
                if interval_begin == 0 and flow in first_line:
                    statistics = {'download_time': interval_end}
                    collect_agent.send_stat(
                        timestamp, suffix=flow_number, **statistics)
                    del first_line[flow]
                    continue

                # otherwise test if TCP or UDP traffic
                flow, duration, _, transfer, transfer_units, bandwidth, bandwidth_units, jitter, jitter_units, packets_stats, datagrams = tokens
                jitter = float(jitter)
                datagrams = float(datagrams[1:-2])
                lost, total = map(int, packets_stats.split('/'))
            except ValueError:
                udp = False
                flow, duration, _, transfer, transfer_units, bandwidth, bandwidth_units = tokens
            else:
                udp = True
            transfer = float(transfer)
            bandwidth = float(bandwidth)
            interval_begin, interval_end = map(float, duration.split('-'))
        except ValueError:
            # filter out non-stats lines
            continue

        try:
            flow_number = flow_map[int(flow)]
        except ValueError:
            if flow.upper() != "SUM":
                continue

        first_line[flow] = True
        if flow not in total_sent_data:
            total_sent_data[flow] = 0
        total_sent_data[flow] += transfer * multiplier(transfer_units, 'Bytes')

        statistics = {
            'sent_data': total_sent_data[flow],
            'throughput': bandwidth * multiplier(bandwidth_units, 'bits/sec'),
        }
        if udp:
            statistics['jitter'] = jitter * multiplier(jitter_units, 's')
            statistics['lost_pkts'] = lost
            statistics['sent_pkts'] = total
            statistics['plr'] = datagrams
        collect_agent.send_stat(timestamp, suffix=flow_number, **statistics)

    error_log = p.stderr.readline()
    if error_log:
        error_msg = 'Error when launching iperf3: {}'.format(error_log)
        collect_agent.send_log(syslog.LOG_ERR, error_msg)
        sys.exit(error_msg)
    p.wait()


def client(
        metrics_interval, port, num_flows, server_ip, window_size,
        tos, time_duration, transmitted_size, protocol, recursive=True, bandwidth=None,
        cong_control=None, mss=None):

    cmd = ['stdbuf', '-oL', 'iperf3', '-c', server_ip, '-f', 'k']
    cmd.extend(_command_build_helper('-i', metrics_interval))
    cmd.extend(_command_build_helper('-w', window_size))
    cmd.extend(_command_build_helper('-p', port))
    cmd.extend(_command_build_helper('-R', recursive))
    if protocol == "udp":
        cmd.append('-u')
        cmd.extend(_command_build_helper('-b', bandwidth))
    else:
        cmd.extend(_command_build_helper('-C', cong_control))
        cmd.extend(_command_build_helper('-M', mss))

    cmd.extend(_command_build_helper('-t', time_duration))
    if time_duration is None:
        if transmitted_size is not None and _parse_to_bytes(transmitted_size) < 1024 * 1024:
            message = 'Error : the number of bytes to transmit is too low.'
            collect_agent.send_log(syslog.LOG_ERR, message)
            sys.exit(message)

        cmd.extend(_command_build_helper('-n', transmitted_size))

    cmd.extend(_command_build_helper('-P', num_flows))
    cmd.extend(_command_build_helper('-S', tos))

    receiver(cmd)


def server(exit, bind, metrics_interval, port, num_flows):
    cmd = ['stdbuf', '-oL', 'iperf3', '-s', '-f', 'k']
    if exit:
        cmd.append('-1')
    if bind:
        cmd.extend(_command_build_helper('-B', bind))
    cmd.extend(_command_build_helper('-i', metrics_interval))
    cmd.extend(_command_build_helper('-p', port))


if __name__ == "__main__":
    with use_configuration('/opt/openbach/agent/jobs/iperf3/iperf3_rstats_filter.conf'):
        # Define Usage
        parser = argparse.ArgumentParser(
            description=__doc__,
            formatter_class=argparse.ArgumentDefaultsHelpFormatter)
        parser.add_argument(
            '-i', '--metrics-interval', type=float, default=1,
            help='Pause *metrics_interval* seconds between '
            'periodic bandwidth reports (if specified, it must be given to '
            'server and client)')
        parser.add_argument(
            '-p', '--port', type=int,
            help='Set server port to listen on/connect to '
            'n (default 5201)')
        parser.add_argument(
            '-n', '--num-flows', type=int, default=1,
            help='For client/server, the number of parallel flows.')
        # Sub-commands functionnality to split server and client mode
        subparsers = parser.add_subparsers(
            title='Subcommand mode',
            help='Choose the iperf3 mode (server mode or client mode)')
        subparsers.required = True
        # Only server parameters
        parser_server = subparsers.add_parser(
            'server', help='Run in server mode')
        parser_server.add_argument(
            '-1', '--exit', action='store_true',
            help='Exit upon completion of one connection.')
        parser_server.add_argument(
            '-B', '--bind', type=str,
            help='The address to bind the server.')
        # Only client parameters
        parser_client = subparsers.add_parser(
            'client', help='Run in client mode')
        parser_client.add_argument(
            'server_ip', type=str,
            help='The server IP address')
        parser_client.add_argument(
            '-t', '--time_duration', type=float,
            help='The duration of the transmission (default 10 sec).')
        parser_client.add_argument(
            '-s', '--transmitted_size', type=str,
            help='The number of bytes to transmit (if set the time_duration parameter has more priority). You can '
            'use [K/M/G]: set 100M to send 100 MBytes. Needs to be more than 1 MB.')
        parser_client.add_argument(
            '-w', '--window-size', type=str,
            help='Socket buffer sizes. For TCP, this sets the TCP window size'
            '(specified only on client but shared to server)')
        parser_client.add_argument(
            '-S', '--tos', type=str,
            help='Set the IP type of service. The usual prefixes '
            'for octal and hex can be used, i.e. 52, 064 and 0x34 '
            'specify the same value..')
        # Second group of sub-commands to split the use of protocol
        # UDP or TCP (within client mode) "dest" is used within the
        # client function to indicate if udp or tcp has been selected.
        subparsers = parser_client.add_subparsers(
            title='Subcommands protocol', dest='protocol',
            help='Choose a transport protocol (UDP or TCP)')
        # Only TCP client parameters
        parser_client_tcp = subparsers.add_parser('tcp', help='TCP protocol')
        parser_client_tcp.add_argument(
            '-C', '--cong-control', type=str,
            help='The congestion control algorithm.')
        parser_client_tcp.add_argument(
            '-M', '--mss', type=str,
            help='Set the TCP/SCTP maximum segment size (MTU - 40 bytes)')
        # Only UDP client parameters
        parser_client_udp = subparsers.add_parser('udp', help='UDP protocol')
        parser_client_udp.add_argument(
            '-b', '--bandwidth', type=str,
            help='Set target bandwidth to n [M/K]bits/sec (default '
            '1M). This setting requires UDP (-u).')

        # Set subparsers options to automatically call the right
        # function depending on the chosen subcommand
        parser_server.set_defaults(function=server)
        parser_client.set_defaults(function=client)

        # Get args and call the appropriate function
        args = vars(parser.parse_args())
        main = args.pop('function')
        main(**args)

