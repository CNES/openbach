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


"""Sources of the Job send_logs"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Adrien THIBAUD <adrien.thibaud@toulouse.viveris.com>
 * Mathias ETTINGER <mathias.ettinger@toulouse.viveris.com>
'''


import os
import socket
import syslog
import argparse
from datetime import datetime
from functools import partial
from contextlib import suppress
try:
    import simplejson as json
except ImportError:
    import json

import yaml

import collect_agent


# Configure logger
syslog.openlog('send_logs', syslog.LOG_PID, syslog.LOG_USER)
LOGS_DIR = '/var/log/openbach/'
DATE_FORMAT = '%Y-%m-%d %H:%M:%S.%f'


def get_collector_infos(
        collector_file='/opt/openbach/agent/collector.yml',
        rstats_file='/opt/openbach/agent/rstats/rstats.yml'):
    with open(collector_file) as stream:
        config = yaml.safe_load(stream)

    with open(rstats_file) as stream:
        config.update(yaml.safe_load(stream))

    return config


def build_socket_sender():
    try:
        collector = get_collector_infos()
    except yaml.YAMLError:
        collect_agent.send_log(
                syslog.LOG_NOTICE,
                'Collector configuration file is malformed')
        raise
    except FileNotFoundError:
        collect_agent.send_log(
                syslog.LOG_NOTICE,
                'Collector configuration file not found')
        raise

    try:
        address = collector['address']
        port = collector['logs']['port']
        sock_type = {
            'tcp': socket.SOCK_STREAM,
            'udp': socket.SOCK_DGRAM,
        }[collector['logstash']['mode']]
    except KeyError:
        collect_agent.send_log(
                syslog.LOG_NOTICE,
                'Collector configuration file is malformed')
        raise

    logstash = (address, int(port))
    try:
        sock = socket.socket(socket.AF_INET, sock_type)
    except socket.error:
        collect_agent.send_log(syslog.LOG_NOTICE, 'Failed to create socket')
        raise

    if sock_type == socket.SOCK_STREAM:
        sock.connect(logstash)
        sender = sock.send
    else:
        def sender(message):
            sock.sendto(message, logstash)

    return sock, sender


def send_logs(filename, send_log):
    with open(os.path.join(LOGS_DIR, filename)) as log:
        for line in log:
            message = (
                    '<{line[pri]}>{line[timestamp]} '
                    '{line[hostname]} {line[programname]}'
                    '[{line[procid]}]: {line[msg]}'
                    .format(line=json.loads(line))
            )
            try:
                send_log(message.encode())
            except socket.error as error:
                collect_agent.send_log(
                        syslog.LOG_NOTICE,
                        'Error code: {}, Message {}'.format(*error))
                raise


def main(origin, jobs=None):
    # We don't need to send stats so configure logs only
    collect_agent.register_collect('')
    sock, send_log = build_socket_sender()

    jobs = set(jobs) if jobs else set()
    origin_timestamp = datetime.timestamp(origin)

    with sock:
        for filename in os.listdir(LOGS_DIR):
            job_name, _ = filename.rsplit('_', 1)
            file_timestamp = os.path.getmtime(os.path.join(LOGS_DIR, filename))
            if job_name in jobs and file_timestamp >= origin_timestamp:
                with suppress(ValueError):
                    send_logs(filename, send_log)


if __name__ == '__main__':
    # Define Usage
    parser = argparse.ArgumentParser(
            description=__doc__,
            formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument(
            'date', nargs=2,
            help='date and time from which to re-send logs (accepted format: {})'.format(DATE_FORMAT))
    parser.add_argument(
            '-j', '--job_name',
            action='append',
            help='name of a Job to send logs from')

    # get args
    args = parser.parse_args()
    try:
        date = datetime.strptime('{} {}'.format(*args.date), DATE_FORMAT)
    except ValueError:
        parser.error('date and time are not in the expected ({}) format'.format(DATE_FORMAT))
    else:
        main(date, args.job_name)
