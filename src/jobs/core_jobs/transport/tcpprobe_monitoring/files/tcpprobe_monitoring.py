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
import time
import signal
import syslog
import argparse
import traceback
import contextlib
from sys import exit

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

def signal_term_handler(signal, frame):
    cmd = 'PID=`cat /var/run/tcpprobe_monitoring.pid`; kill -TERM $PID; rm '
    cmd += '/var/run/tcpprobe_monitoring.pid'
    os.system(cmd)
    cmd = 'rmmod tcp_probe > /dev/null 2>&1'
    os.system(cmd)
    exit(0)


signal.signal(signal.SIGTERM, signal_term_handler)


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
        # Unload existing tcp_probe job and/or module (if exists)
        cmd = 'PID=`cat /var/run/tcpprobe_monitoring.pid`; kill -TERM $PID; rm '
        cmd += '/var/run/tcpprobe_monitoring.pid'
        try:
            os.system(cmd)
        except Exception as exe_error:
            collect_agent.send_log(syslog.LOG_DEBUG, 'No previous tcp_probe job to kill before launching the job: %s' % exe_error)
            exit('No previous tcp_probe job to kill before launching the job')
        
        cmd = 'rmmod tcp_probe > /dev/null 2>&1'
        try:
            os.system(cmd)
        except Exception as exe_error:
            collect_agent.send_log(syslog.LOG_ERROR, 'Existing tcp_probe cannot be unloaded: %s' % exe_error)

        # Monitoring setup
        cmd = (
                'modprobe tcp_probe port={}'
                ' full=1 > /dev/null 2>&1'.format(port)
        )
    
        # The reference time
        init_time = int(time.time() * 1000)
        initTime_file = open('/tmp/tcpprobe_initTime.txt','w')
        initTime_file.write(str(init_time))
        initTime_file.close()
        
        try:
            os.system(cmd)
        except Exception as exe_error:
            collect_agent.send_log(syslog.LOG_ERROR, 'tcp_probe cannot be executed: %s' % exe_error)
            exit('tcp_probe cannot be executed')

        cmd = 'chmod 444 /proc/net/tcpprobe'
        os.system(cmd)
        cmd = 'PID=`cat /proc/net/tcpprobe > ' + path + ' & echo $!`; echo $PID >'
        cmd += ' /var/run/tcpprobe_monitoring.pid'
        os.system(cmd)
    #if readonly check if the file is pre-existing
    elif not os.path.isfile(path) :
        message = "file from argument 'path' does not exist, can not readonly a non existing file"
        collect_agent.send_log(syslog.LOG_ERR, message)
        exit(message)

    collect_agent.send_log(syslog.LOG_DEBUG, "Finished setting up probe")

    ## if monitoring or reading only one port
    ## when listening to all ports, do not send stats
    for i, row in enumerate(watch(path)):
        if i % interval == 0:
            data = row.split()
            if len(data) == 11 and port != 0:
                timestamp = data[0].strip('\x00')
                timestamp_sec, timestamp_nsec = timestamp.split('.', 1)
                initTime_file = open('/tmp/tcpprobe_initTime.txt','r')
                init_time = int(initTime_file.read())
                initTime_file.close()
                timestamp_real = init_time + int(timestamp_sec)*1000 + int(timestamp_nsec[:3])
                try:
                    # if the port in the monitoring file is the port
                    # we want to monitor
                    if str(data[2].split(":")[1]) == str(port):
                        collect_agent.send_stat(
                                timestamp_real,
                                cwnd_monitoring=data[6],
                                ssthresh_monitoring=data[7],
                                sndwnd_monitoring=data[8],
                                rtt_monitoring=data[9],
                                rcvwnd_monitoring=data[10],)
                except Exception as connection_err:
                    message = 'ERROR: {}'.format(connection_err)
                    collect_agent.send_log( syslog.LOG_ERR, message)
                    exit(message)


if __name__ == '__main__':
    with use_configuration('/opt/openbach/agent/jobs/tcpprobe_monitoring/tcpprobe_monitoring_rstats_filter.conf'):
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

        main(path, port, interval, readonly)
