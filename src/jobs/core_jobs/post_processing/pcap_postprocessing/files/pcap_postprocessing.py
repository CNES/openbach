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


"""Sources of the Job pcap_postprocessing"""

__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Joaquin MUGUERZA <joaquin.muguerza@viveris.fr>
 * Francklin SIMO <francklin.simo@viveris.fr>
 * David FERNANDES <david.fernandes@viveris.fr>
 * Bastien TAURAN <bastien.tauran@viveris.fr>
'''

import sys
import syslog
import pathlib
import argparse
import itertools
from contextlib import closing

import pyshark

import collect_agent


ETHERNET_HEADER_SIZE = 14


def _store_filename(namespace, file_argument):
    f = namespace.get(file_argument)
    if f is None:
        return

    with f:
        namespace[file_argument] = f.name


def build_display_filter(src_ip, dst_ip, src_port, dst_port, proto):
    """Build a display filter"""

    def format_display_filter():
        if src_ip is not None:
            yield 'ip.src=={}'.format(src_ip)

        if dst_ip is not None:
            yield 'ip.dst=={}'.format(dst_ip)

        if proto is not None:
            proto = proto.lower()
            yield 'ip.proto=={}'.format(6 if proto == 'tcp' else 17)

        if src_port is not None:
            if proto is not None:
                yield '{}.srcport=={}'.format(proto, src_port)
            else:
                yield '(tcp.srcport=={0} or udp.srcport=={0})'.format(src_port)

        if dst_port is not None:
            if proto is not None:
                yield '{}.dstport=={}'.format(proto, dst_port)
            else:
                yield '(tcp.dstport=={0} or udp.dstport=={0})'.format(dst_port)

    return ' and '.join(format_display_filter()) or None


def pairwise(iterable):
    """Generate successive pairs of elements in iterable"""
    first, second = itertools.tee(iterable)
    next(second, None)
    return zip(first, second)


def suffix(flow_number):
    return 'Flow' + str(flow_number)


def sort_and_group(iterable, key=None):
    """Group sorted `iterable` on `key`."""
    return itertools.groupby(sorted(iterable, key=key), key=key)


def packets_length(packets):
    return sum((int(packet.captured_length) - ETHERNET_HEADER_SIZE) for packet in packets)


def packet_time(packet):
    return float(packet.sniff_timestamp) * 1000

    
def compute_and_send_statistics(packets, t0, metrics_interval, suffix, stat_time):
    statistics = {'bit_rate': 0.0, 'packet_rate': 0}

    # Check if it is the last sample for this flow
    if packet_time(packets[-1]) <= t0 + metrics_interval:
        flow_duration = packet_time(packets[-1]) - packet_time(packets[0])
        statistics['flow_duration'] = int(flow_duration)

    # Cumalative metrics
    cum_packets = [p for p in packets if packet_time(p) < t0 + metrics_interval]
    if cum_packets:
        packets_count = len(cum_packets)
        bytes_count = packets_length(cum_packets)
        statistics.update(
                packets_count=packets_count,
                bytes_count=bytes_count,
                avg_packet_length=bytes_count / packets_count)

    # Instantanous metrics
    packets_in_window = [p for p in cum_packets if packet_time(p) > t0]
    if packets_in_window:
        if metrics_interval > 0:
           total_packets_length = packets_length(packets_in_window)
           bit_rate = (total_packets_length * 8/1024) * 1000 / metrics_interval
           packet_rate = int(1000 * len(packets_in_window) / metrics_interval)
           statistics.update(bit_rate=bit_rate, packet_rate=packet_rate)
        delay = sum(
                packet_time(packet) - packet_time(previous)
                for previous, packet in pairwise(packets_in_window)
        )

        packets_count = len(packets_in_window)
        if packets_count > 1:
            statistics['avg_inter_packets_delay'] = delay / (packets_count - 1)

    collect_agent.send_stat(stat_time, suffix=suffix, **statistics)


def _packets(packets, *, only_id=False):
    for packet in packets:
        if 'IP' in str(packet.layers) and packet.transport_layer is not None:
            yield packet.ip.id if only_id else packet


def gilbert_elliot(capture_file, second_capture_file, src_ip, dst_ip, src_port, dst_port, proto):
    display_filter = build_display_filter(src_ip, dst_ip, src_port, dst_port, proto)

    with closing(pyshark.FileCapture(capture_file, display_filter=display_filter)) as cap_file_sent,\
         closing(pyshark.FileCapture(second_capture_file, display_filter=display_filter)) as cap_file_received:
        goods = []
        bad = []
        total_good = 0
        total_bad = 0

        sent_packets = _packets(cap_file_sent, only_id=True)
        for packet in _packets(cap_file_received, only_id=True):
            for sent_packet in sent_packets:
                if packet == sent_packet:
                    total_good += 1
                    if total_bad:
                        bads.append(total_bad)
                        total_bad = 0
                    break
                total_bad += 1
                if total_good:
                    goods.append(total_good)
                    total_good = 0

        if total_good:
            goods.append(total_good)
        if total_bad:
            bads.append(total_bad)

    total_good = sum(goods)
    total_bad = sum(bads)

    statistics = {
            'gilbert_elliot_sent': total_good + total_bad,
            'gilbert_elliot_received': total_good,
    }
    if goods or bads:
        statistics['gilbert_elliot_lost_rate'] = total_bad / (total_good + total_bad)

    if goods:
        g = total_good / len(goods)  # average number of steps when we stay in good state
        statistics['gilbert_elliot_p'] = 1 / g
    else:
        collect_agent.send_log(
                syslog.LOG_WARNING,
                "Cannot compute p parameter. Maybe the capture files are too short.")

    if bads:
        b = total_bad / len(bads) # average number of steps when we stay in bad state
        statistics['gilbert_elliot_r'] = 1 / b
    else:
        collect_agent.send_log(
                syslog.LOG_WARNING,
                "Cannot compute r parameter. Maybe the capture files are too short.")

    collect_agent.send_stat(collect_agent.now(), **statistics)


def _flow_id_funct(packet):
    protocol = packet.transport_layer
    return (packet.ip.src, pkt[protocol].srcport, packet.ip.dst, packet[protocol].dstport, protocol)


def _time_range(start, step):
    while True:
        yield start, start + step
        start += step


def one_file(capture_file, src_ip, dst_ip, src_port, dst_port, proto, metrics_interval):
    """Analyze packets from pcap file located at capture_file and comptute statistics.

    Only consider packets matching the specified fields.
    """
    display_filter = build_display_filter(src_ip, dst_ip, src_port, dst_port, proto)
    origin = collect_agent.now()
    with closing(pyshark.FileCapture(capture_file, display_filter=display_filter)) as cap_file:
        packets = list(_packets(cap_file))
        if not packets:
            return

        flow_id_to_flow = {
                (flow_id, sorted(flow, key=packet_time))
                for flow_id, flow in sort_and_group(packets, key=_flow_id_funct)
        }
        all_flows = []

        time_windows = _time_range(packet_time(packets[0]), metrics_interval)
        for samples_count, (t0, time) in enumerate(time_windows, start=1):
            stat_time = origin + samples_count * metrics_interval
            all_flows.extend(
                    flow_id
                    for flow_id, flow in flow_id_to_flow.items()
                    if flow_id not in all_flows and packet_time(flow[0]) < time
            )

            flows_count = 0
            total_flows_count = 0
            total_flow_duration = 0
            for flow_number, flow_id in enumerate(all_flows):
                flow = flow_id_to_flow[flow_id]
                # If the flow always exists
                if packet_time(flow[-1]) > t0:
                    compute_and_send_statistics(flow, t0, metrics_interval, suffix(flow_number), stat_time)
                    flows_count += 1
                total_flow_duration += packet_time(flow[-1]) - packet_time(flow[0])
                total_flows_count += 1 

            statistics = {'flows_count': flows_count}
            # Check if it the last sample
            if total_flows_count > 0 and packet_time(packets[-1]) <= time:
                collect_agent.send_stat(
                        stat_time, **statistics,
                        avg_flow_duration=total_flow_duration // total_flows_count,
                        total_packets=len(packets),
                        total_bytes=packets_length(packets),
                )
                break

            collect_agent.send_stat(stat_time, **statistics)


def get_packets_in_interval(it, packets_list, interval, first_packet = 0):
    if first_packet != 0:
        current_packet_sent = first_packet
        t0 = packet_time(current_packet_sent)
        packets_list.append((t0, current_packet_sent))
    else:
        current_packet_sent = next(_packets(it))
        t0 = packet_time(current_packet_sent)

    t = t0
    while t < t0 + interval:
        packets_list.append((t, current_packet_sent))
        current_packet_sent = next(_packets(it))
        t = packet_time(current_packet_sent)

    return current_packet_sent


def two_files(capture_file, second_capture_file, src_ip, dst_ip, src_port, dst_port, proto, metrics_interval):
    display_filter = build_display_filter(src_ip, dst_ip, src_port, dst_port, proto)

    packets_received_interval = []
    next_current_packet_sent = 0
    next_current_packet_received = 0

    with closing(pyshark.FileCapture(capture_file, display_filter=display_filter)) as cap_file_sent,\
         closing(pyshark.FileCapture(second_capture_file, display_filter=display_filter)) as cap_file_received:
        cap_file_sent_iter = iter(cap_file_sent)
        cap_file_received_iter = iter(cap_file_received)
        try:
            while True:
                packets_sent_interval = []
                next_current_packet_sent = get_packets_in_interval(cap_file_sent_iter, packets_sent_interval, metrics_interval, first_packet = next_current_packet_sent)

                get_packets_in_interval(cap_file_received_iter, packets_received_interval, 5000, first_packet = next_current_packet_received)

                if not packets_sent_interval:
                    continue

                start_time = packets_sent_interval[0][0]
                for t, pkt in packets_received_interval:
                    if t >= start_time:
                        next_current_packet_received = pkt
                        break

                delay_sum = 0
                last_delay = 0
                jitter_sum = 0
                packets_sent = 0
                packets_received = 0
                bytes_sent = 0
                bytes_received = 0
                first_iter = True
                for t1, pkt in packets_sent_interval:
                    packets_sent += 1
                    bytes_sent += int(pkt.length)
                    for t2, p in packets_received_interval:
                        if p.ip.id == pkt.ip.id:
                            break
                    else:
                        continue
                    packets_received += 1
                    bytes_received += int(pkt.length)
                    delay = t2 - t1
                    delay_sum += delay
                    if first_iter:
                        first_iter = False
                    else:
                        jitter_sum += abs(delay - last_delay)
                    last_delay = delay

                statistics = {
                        'two_files_throughput_sent': 1000 * bytes_sent / metrics_interval,
                        'two_files_throughput_received': 1000 * bytes_received / metrics_interval,
                }
                if packets_received != 0:
                    statistics['two_files_delay'] = delay_sum / packets_received
                if packets_received > 1:
                    statistics['two_files_jitter'] = jitter_sum / (packets_received - 1)
                if bytes_sent != 0:
                    statistics['two_files_loss_rate_bytes'] = 1 - bytes_received/bytes_sent
                if packets_sent != 0:
                    statistics['two_files_loss_rate_pkts'] = 1 - packets_received/packets_sent
                collect_agent.send_stat(int(start_time), **statistics, suffix=capture_file)
        except StopIteration:
            pass


if __name__ == '__main__':
    with collect_agent.use_configuration('/opt/openbach/agent/jobs/pcap_postprocessing/pcap_postprocessing_rstats_filter.conf'):
        # Define Usage
        parser = argparse.ArgumentParser(
              description='Analyze pcap file to get average packet '
              'length, average inter packets delay, bitrate, etc. '
              'If a filter is specified, only filtered packets will be considered.',
              formatter_class=argparse.ArgumentDefaultsHelpFormatter
        )
        parser.add_argument(
                'capture_file', type=argparse.FileType('r'),
                help='Path to the capture file (big files are not recommended: check .help of job)')
        parser.add_argument('-sa', '--src-ip', help='Source IP address')
        parser.add_argument('-da', '--dst-ip', help='Destination IP address')
        parser.add_argument('-sp', '--src-port', type=int, help='Source port number')
        parser.add_argument('-dp', '--dst-port', type=int, help='Destination port number')
        parser.add_argument('-p', '--proto', choices=['udp', 'tcp'], help='Transport protocol')

        subparsers = parser.add_subparsers(
            title='Subcommand mode',
            help='Choose which kind of statistics to compute')
        subparsers.required = True

        parser_one_file = subparsers.add_parser('stats_one_file', help='Get the metrics from one pcap')
        parser_one_file.add_argument(
                '-T', '--metrics-interval',
                type=int, default=500,
                help='Time period in ms to compute metrics')

        parser_two_files = subparsers.add_parser(
                'stats_two_files',
                help='Get the metrics from two pcaps (sender and receiver)')
        parser_two_files.add_argument(
                'second_capture_file', type=argparse.FileType('r'),
                help='The path of the second pcap file to analyze (must be traffic receiver)')
        parser_two_files.add_argument(
                '-T', '--metrics-interval',
                type=int, default=500,
                help='Time period in ms to compute metrics')

        parser_ge = subparsers.add_parser('gilbert_elliot', help='Compute Gilbert Elliot parameters from 2 files')
        parser_ge.add_argument(
                'second_capture_file', type=argparse.FileType('r'),
                help='Path to the second capture file')

        # Set subparsers options to automatically call the right
        # function depending on the chosen subcommand
        parser_one_file.set_defaults(function=one_file)
        parser_two_files.set_defaults(function=two_files)
        parser_ge.set_defaults(function=gilbert_elliot)

        # Get args and call the appropriate function
        args = vars(parser.parse_args())
        main = args.pop('function')
        _store_filename(args, 'capture_file')
        _store_filename(args, 'second_capture_file')
        main(**args)
        sys.exit(0)  # Explicitly exit properly. This is required by pyshark module
