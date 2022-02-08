##!/usr/bin/env python3


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


"""Sources of the Job pcap_postprocessing"""

__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Joaquin MUGUERZA <joaquin.muguerza@viveris.fr>
 * Francklin SIMO <francklin.simo@viveris.fr>
 * David FERNANDES <david.fernandes@viveris.fr>
 * Bastien TAURAN <bastien.tauran@viveris.fr>
'''

import os
import sys
import time
import syslog
import argparse
import itertools
import traceback
import contextlib
from contextlib import closing
import random
import subprocess

import pyshark
import pathlib

import collect_agent


ETHERNET_HEADER_SIZE = 14

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


def build_display_filter(src_ip, dst_ip, src_port, dst_port, proto):
    """Build a display filter
    """
    display_filter = []

    if src_ip is not None:
        display_filter.append('ip.src=={}'.format(src_ip))

    if dst_ip is not None:
        display_filter.append('ip.dst=={}'.format(dst_ip))

    if proto is not None:
        proto = proto.lower()
        proto_number = 6 if proto == 'tcp' else 17
        display_filter.append('ip.proto=={}'.format(proto_number))

    if src_port is not None:
        if proto is not None:
            display_filter.append('{}.srcport=={}'.format(proto, src_port))
        else:
            display_filter.append('(tcp.srcport=={0} or udp.srcport=={0})'.format(src_port))

    if dst_port is not None:
        if proto is not None:
            display_filter.append('{}.dstport=={}'.format(proto, dst_port))
        else:
            display_filter.append('(tcp.dstport=={0} or udp.dstport=={0})'.format(dst_port))

    return ' and '.join(display_filter) if display_filter else None


def pairwise(iterable):
    """Generate successive pairs of elements in iterable"""
    first, second = itertools.tee(iterable)
    next(second, None)
    return zip(first, second)


def now():
    return int(time.time() * 1000)


def suffix(flow_number):
    return 'Flow' + str(flow_number)


def sort_and_group(iterable, key=None):
    """Group sorted `iterable` on `key`."""
    return itertools.groupby(sorted(iterable, key=key), key=key)


def packets_length(packets):
    return sum((int(packet.captured_length) - ETHERNET_HEADER_SIZE) for packet in packets)

    
def compute_and_send_statistics(packets, to, metrics_interval, suffix, stat_time):
    packets_in_window = list(filter(lambda pkt: to < float(pkt.sniff_timestamp) * 1000 < to+metrics_interval, packets))
    bit_rate, packet_rate = 0.0, 0
    statistics = {'bit_rate': bit_rate, 'packet_rate':packet_rate}
    # Check if it is the last sample for this flow
    if (float(packets[-1].sniff_timestamp) * 1000 <= to+metrics_interval):
    	flow_duration = 1000 * (float(packets[-1].sniff_timestamp) - float(packets[0].sniff_timestamp))
    	statistics.update({'flow_duration':int(flow_duration)})
    # Cumalative metrics
    cum_packets = list(filter(lambda pkt: float(pkt.sniff_timestamp) * 1000 < to+metrics_interval, packets))
    if cum_packets:
       statistics.update({'packets_count':len(cum_packets), 
                          'bytes_count': packets_length(cum_packets)})
       statistics.update({'avg_packet_length': int(packets_length(cum_packets) / len(cum_packets))})
    # Instantanous metrics
    if packets_in_window:
        if metrics_interval > 0:
           total_packets_length = packets_length(packets_in_window)
           bit_rate = (total_packets_length * 8/1024) * 1000 / metrics_interval
           packet_rate = int(1000 * len(packets_in_window)/metrics_interval)
           statistics.update({'bit_rate': bit_rate})
           statistics.update({'packet_rate': packet_rate})
        delay = sum(
                float(packet.sniff_timestamp) - float(previous.sniff_timestamp)
                for previous, packet in pairwise(packets_in_window)
        )
        avg_inter_packets_delay = delay / (len(packets_in_window) - 1) if len(packets_in_window) > 1 else None
        if avg_inter_packets_delay is not None:
           statistics.update({'avg_inter_packets_delay': int(avg_inter_packets_delay*1000)})

    collect_agent.send_stat(stat_time, suffix=suffix, **statistics)


def gilbert_elliot(capture_file, second_capture_file, src_ip, dst_ip, src_port, dst_port, proto):
    # TODO is IP ID enough ?
    ips_sent = []
    display_filter = build_display_filter(src_ip, dst_ip, src_port, dst_port, proto)

    try:
        with closing(pyshark.FileCapture(capture_file, display_filter=display_filter)) as cap_file_sent:
            packets_sent = [packet.ip.id for packet in cap_file_sent if 'IP' in str(packet.layers) and packet.transport_layer is not None]
        n = len(packets_sent)
        index = 0
        goods = []
        bads = []
        with closing(pyshark.FileCapture(second_capture_file, display_filter=display_filter)) as cap_file_received:
            current_packet_sent = packets_sent[index]
            index = 1
            total_good = 0
            total_bad = 0
            try:
                for packet in cap_file_received:
                    if not ('IP' in str(packet.layers) and packet.transport_layer is not None):
                        continue
                    if packet.ip.id == current_packet_sent:
                        total_good += 1
                        if total_bad:
                            bads.append(total_bad)
                            total_bad = 0
                    while packet.ip.id != current_packet_sent:
                        if total_good:
                            goods.append(total_good)
                            total_good = 0
                        total_bad += 1
                        current_packet_sent = packets_sent[index]
                        index += 1
                        if index == n:
                            break
                    current_packet_sent = packets_sent[index]
                    index += 1
                    if index >= n:
                        break
                if total_good:
                    goods.append(total_good)
                if total_bad:
                    bads.append(total_bad)
            except Exception as ex:
                message = 'ERROR when parsing pcap: {}'.format(ex)
                collect_agent.send_log(syslog.LOG_ERR, message)
                sys.exit(message)


        statistics = {}
        if goods:
            g = sum(goods)/len(goods)
            statistics['gilbert_elliot_p'] = 1/g
        else:
            collect_agent.send_log(syslog.LOG_WARNING, "Cannot compute p parameter. Maybe the capture files are too short.")
        if bads:
            b = sum(bads)/len(bads)
            statistics['gilbert_elliot_r'] = 1/b
        else:
            collect_agent.send_log(syslog.LOG_WARNING, "Cannot compute r parameter. Maybe the capture files are too short.")

        collect_agent.send_stat(now(), **statistics)

    except Exception as ex:
        message = 'ERROR when analyzing: {}'.format(ex)
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)


    sys.exit(0)  # Explicitly exit properly. This is required by pyshark module

    
def one_file(capture_file, src_ip, dst_ip, src_port, dst_port, proto, metrics_interval):
    """Analyze packets from pcap file located at capture_file and comptute statistics.
    Only consider packets matching the specified fields.
    """
    display_filter = build_display_filter(src_ip, dst_ip, src_port, dst_port, proto)
    To = now()
    try:
        with closing(pyshark.FileCapture(capture_file, display_filter=display_filter)) as cap_file:
            flow_id_funct = lambda pkt: (pkt.ip.src, pkt[pkt.transport_layer].srcport, 
                                         pkt.ip.dst, pkt[pkt.transport_layer].dstport, 
                                         pkt.transport_layer)
            packets = [packet for packet in cap_file if 'IP' in str(packet.layers) and packet.transport_layer is not None]
            key_funct = lambda pkt : pkt.sniff_timestamp
            if(packets):
                grouped_packets = sort_and_group(packets, key=flow_id_funct)
                flow_id_to_flow = dict((flow_id, sorted(flow, key=key_funct)) for flow_id,flow in grouped_packets)
                all_flows = list()
                to = float(packets[0].sniff_timestamp) * 1000 
                samples_count = 1

                while to < float(packets[-1].sniff_timestamp) * 1000:
                    time = to + metrics_interval
                    ids_of_new_flows_at_time = [x[0] for x in
                                                list(filter(lambda item: (item[0] not in all_flows and
                                                float(item[1][0].sniff_timestamp)*1000 < time),
                                                flow_id_to_flow.items()))
                                              ]
                    all_flows.extend(ids_of_new_flows_at_time)
           
                    flows_count = 0
                    total_flows_count = 0
                    flow_number = 1
                    total_flow_duration = 0
                    for flow_id in all_flows:
                        flow = flow_id_to_flow[flow_id]
                        stat_time = To + samples_count * metrics_interval
                        # If the flow always exists
                        if (float(flow[-1].sniff_timestamp) * 1000 > to):
                        	compute_and_send_statistics(flow, to, metrics_interval, suffix(flow_number), stat_time)
                        	flow_duration = 1000 * (float(flow[-1].sniff_timestamp) - float(flow[0].sniff_timestamp))
                       		flows_count += 1
                        flow_number += 1
                        total_flow_duration += 1000 * (float(flow[-1].sniff_timestamp) - float(flow[0].sniff_timestamp))
                        total_flows_count += 1 
                     
                    statistics = {'flows_count':flows_count}
                    # Check if it the last sample
                    if total_flows_count > 0 and float(packets[-1].sniff_timestamp) * 1000 <= time:
                        statistics.update({'avg_flow_duration':int(total_flow_duration/total_flows_count)})
                        statistics.update({'total_packets':len(packets),
                                           'total_bytes':packets_length(packets)})
                    collect_agent.send_stat(stat_time, **statistics)
                    samples_count += 1   
                    to = time

    except Exception as ex:
        message = 'ERROR when analyzing: {}'.format(ex)
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)


    sys.exit(0)  # Explicitly exit properly. This is required by pyshark module



if __name__ == '__main__':
    with use_configuration('/opt/openbach/agent/jobs/pcap_postprocessing/pcap_postprocessing_rstats_filter.conf'):
        # Define Usage
        parser = argparse.ArgumentParser(
              description='Analyze pcap file to get average packet '
              'length, average inter packets delay, bitrate, etc. '
              'If a filter is specified, only filtered packets will be considered.',
              formatter_class=argparse.ArgumentDefaultsHelpFormatter
        )
        parser.add_argument('capture_file', type=argparse.FileType('r'), help='Path to the capture file (big files are not recommended: check .help of job)')
        parser.add_argument('-sa', '--src-ip', help='Source IP address')
        parser.add_argument('-da', '--dst-ip', help='Destination IP address')
        parser.add_argument('-sp', '--src-port', type=int, help='Source port number')
        parser.add_argument('-dp', '--dst-port', type=int, help='Destination port number')
        parser.add_argument('-p', '--proto', choices=['udp', 'tcp'], help='Transport protocol')

        subparsers = parser.add_subparsers(
            title='Subcommand mode',
            help='Choose the stat to compute (metrics from one pcap, or Gilbert Elliot parameters from 2 files)')
        subparsers.required = True

        parser_one_file = subparsers.add_parser('stats_one_file', help='Get the metrics from one pcap')
        parser_one_file.add_argument('-T', '--metrics-interval', type=int, default=500, help='Time period in ms to compute metrics')

        parser_ge = subparsers.add_parser('gilbert_elliot', help='Compute Gilbert Elliot parameters from 2 files')
        parser_ge.add_argument('second_capture_file', type=str, help='Path to the second capture file')

        # Set subparsers options to automatically call the right
        # function depending on the chosen subcommand
        parser_one_file.set_defaults(function=one_file)
        parser_ge.set_defaults(function=gilbert_elliot)

        # Get args and call the appropriate function
        args = vars(parser.parse_args())
        main = args.pop('function')
        main(**args)