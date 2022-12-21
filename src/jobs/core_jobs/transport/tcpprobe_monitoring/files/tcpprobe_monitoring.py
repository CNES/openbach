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


'''Sources of the Job tcpprobe_monitoring'''


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Adrien THIBAUD <adrien.thibaud@toulouse.viveris.com>
 * David PRADAS <david.pradas@toulouse.viveris.com>
 * Mathias ETTINGER <mathias.ettinger@toulouse.viveris.com>
 * Joaquin MUGUERZA <joaquin.muguerza@toulouse.viveris.com>
 * Matthieu PETROU <matthieu.petrou@viveris.fr>
'''

import os
import sys
import time
import signal
import syslog
import argparse
import subprocess

import collect_agent


PID_FILENAME = '/var/run/tcpprobe_monitoring.pid'


def signal_term_handler(signal, frame):
    with open(PID_FILENAME) as pid_file:
        pid = pid_file.read().strip()
    subprocess.run(['kill', '-TERM', pid])
    os.remove(PID_FILENAME)
    subprocess.run(['rmmod', 'tcp_probe'])
    sys.exit(0)


def watch(fn):
    with open(fn, 'r') as fp:
        while True:
            new = fp.readline()
            # (Improvement) Indicate the line that is being read
            # Once all lines are read this just returns ''
            # until the file changes and a new line appears
            if new:
                yield new
            else:
                # TODO: (Improvement2) Indicate to the script that it can stop it
                time.sleep(0.5)


def main(path, port, interval, readonly):
    # Build stat names
    stats_list = [
            'cwnd_monitoring',
            'ssthresh_monitoring',
            'sndwnd_monitoring',
            'rtt_monitoring',
            'rcvwnd_monitoring',
    ]

    collect_agent.send_log(
            syslog.LOG_DEBUG,
            'DEBUG: the following stats have been '
            'built --> {}'.format(stats_list))

    ## if in monitoring mode (listening on port(s)
    if not readonly:
        try:
            # Unload existing tcp_probe job and/or module (if exists)
            with open(PID_FILENAME) as pid_file:
                pid = pid_file.read().strip()
            subprocess.run(['kill', '-TERM', pid], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=True)
            os.remove(PID_FILENAME)
        except OSError as os_error:
            message = 'No previous tcp_probe job to kill before launching the job: {}'.format(os_error)
            collect_agent.send_log(syslog.LOG_ERROR, message)
            sys.exit(message)
        except subprocess.CalledProcessError as exe_error:
            message = 'No previous tcp_probe job to kill before launching the job: {}'.format(exe_error.stderr)
            collect_agent.send_log(syslog.LOG_ERROR, message)
            sys.exit(message)

        try:
            subprocess.run(['rmmod', 'tcp_probe'], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=True)
        except subprocess.CalledProcessError as p:
            collect_agent.send_log(syslog.LOG_ERROR, 'Existing tcp_probe cannot be unloaded: {}'.format(p.stderr))

        # The reference time
        with open('/tmp/tcpprobe_initTime.txt', 'w') as f:
            print(collect_agent.now(), file=f)
        
        try:
            # Monitoring setup
            subprocess.run(
                    ['modprobe', 'tcp_probe', 'port={}'.format(port), 'full=1'],
                    stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=True)
        except subprocess.CalledProcessError as exe_error:
            message = 'tcp_probe cannot be executed: {}'.format(exe_error.stderr)
            collect_agent.send_log(syslog.LOG_ERROR, message)
            sys.exit(message)

        os.chmod('/proc/net/tcpprobe', 0o444)
        p = subprocess.Popen('cat /proc/net/tcpprobe > ' + path, shell=True)
        with open(PID_FILENAME, 'w') as pid_file:
            print(p.pid, file=pid_file)
    #if readonly check if the file is pre-existing
    elif not os.path.isfile(path) :
        message = "file from argument 'path' does not exist, can not readonly a non existing file"
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)

    collect_agent.send_log(syslog.LOG_DEBUG, "Finished setting up probe")

    # Collect initial time only once
    with open('/tmp/tcpprobe_initTime.txt') as f:
        init_time = int(initTime_file.read())

    ## if monitoring or reading only one port
    ## when listening to all ports, do not send stats
    for i, row in enumerate(watch(path)):
        if not port or i % interval != 0:
            continue

        try:
            timestamp, _, address, _, _, _, cwnd, ssthreshold, sndwnd, rtt, rcvwnd = row.split()
            monitored_port = int(address.split(':')[1])
        except (ValueError, IndexError):
            continue

        if port == monitored_port:
            try:
                timestamp_sec, timestamp_nsec = timestamp.strip('\x00').split('.', 1)
                timestamp_real = init_time + int(timestamp_sec + timestamp_nsec[:3])
                collect_agent.send_stat(
                        timestamp_real,
                        cwnd_monitoring=cwnd,
                        ssthresh_monitoring=ssthreshold,
                        sndwnd_monitoring=sndwnd,
                        rtt_monitoring=rtt,
                        rcvwnd_monitoring=rcvwnd)
            except Exception as connection_err:
                message = 'ERROR: {}'.format(connection_err)
                collect_agent.send_log(syslog.LOG_ERR, message)
                sys.exit(message)


if __name__ == '__main__':
    with collect_agent.use_configuration('/opt/openbach/agent/jobs/tcpprobe_monitoring/tcpprobe_monitoring_rstats_filter.conf'):
        # Define Usage
        parser = argparse.ArgumentParser(
                description='Activate/Deactivate tcpprobe monitoring on outgoing traffic.',
                formatter_class=argparse.ArgumentDefaultsHelpFormatter)
        parser.add_argument('port', type=int, help='Port to monitor (dest or src)')
        parser.add_argument('--readonly', action='store_true',
                help='set the job in readonly mode or in monitoring(default monitoring)')
        parser.add_argument(
                '-p', '--path', default='/tmp/tcpprobe.out',
                help='path to result file')
        parser.add_argument(
                '-i', '--packet-sampling-interval', type=int, default=10,
                help='get the cwnd of 1/packet_sampling_interval packet')

        # get args
        args = parser.parse_args()
        port = args.port
        readonly = args.readonly
        path = args.path
        interval = args.packet_sampling_interval

        signal.signal(signal.SIGTERM, signal_term_handler)
        main(path, port, interval, readonly)
