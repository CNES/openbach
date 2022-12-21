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


"""OpenBACH's agent API"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Joaquin MUGUERZA <joaquin.muguerza@toulouse.viveris.com>
 * Mathias ETTINGER <mathias.ettinger@toulouse.viveris.com>
 * David PRADAS <david.pradas@viveris.fr>
'''


import sys
import time
import argparse
from datetime import datetime
from functools import partial
from pprint import pprint as print

from conductor import errors
from conductor.openbach_communicator import OpenBachBaton


DATE_FORMAT = '%Y-%m-%d %H:%M:%S.%f'
COLLECTOR_DEFAULTS = {
        'logs_port': 10514,
        'logs_query': 9200,
        'stats_port': 2222,
        'stats_query': 8086,
        'stats_database': 'openbach',
        'stats_precision': 'ms',
}


def build_parser():
    date_help = DATE_FORMAT.replace('%', '%%')

    # Set up parser
    parser = argparse.ArgumentParser(
            description=__doc__,
            formatter_class=argparse.ArgumentDefaultsHelpFormatter)

    # Global arguments
    parser.add_argument('agent', help='IP address of the agent')
    parser.add_argument(
            '-p', '--port', type=int, default=1112,
            help='port of the agent')
    subparsers = parser.add_subparsers(
            dest='action', metavar='action',
            help='the action to run on the agent')
    subparsers.required = True

    # Start Job subparser
    sub_parser = subparsers.add_parser(
            'start_job',
            help='start a job instance')
    sub_parser.add_argument('job_name', help='name of the job to start')
    sub_parser.add_argument(
            '-i', '--job_id', '--job_instance_id', type=int, default=-1,
            help='a specific job instance ID to use')
    sub_parser.add_argument(
            '-d', '--date', metavar=('DATE', 'TIME'), nargs=2,
            help='date of the execution (format: {})'.format(date_help))
    sub_parser.add_argument(
            '-t', '--interval', type=int,
            help='interval of the execution in seconds')
    sub_parser.add_argument(
            'arguments', nargs=argparse.REMAINDER,
            help='extra arguments will be provided as-is for the job')
    sub_parser.set_defaults(scenario_id=0, owner_id=0)

    # Stop Job subparser
    sub_parser = subparsers.add_parser(
            'stop_job',
            help='stop a job instance')
    sub_parser.add_argument('job_name', help='name of the job to stop')
    sub_parser.add_argument(
            'job_id', type=int,
            help='the job instance ID to stop')
    sub_parser.add_argument(
            '-d', '--date', metavar=('DATE', 'TIME'), nargs=2,
            help='date to stop the job at (format: {})'.format(date_help))

    # Restart Job subparser
    sub_parser = subparsers.add_parser(
            'restart_job',
            help='restart a job instance')
    sub_parser.add_argument('job_name', help='name of the job to restart')
    sub_parser.add_argument(
            'job_id', type=int,
            help='the job instance ID to restart')
    sub_parser.add_argument(
            '-d', '--date', metavar=('DATE', 'TIME'), nargs=2,
            help='date of the execution (format: {})'.format(date_help))
    sub_parser.add_argument(
            '-t', '--interval', type=int,
            help='interval of the execution in seconds')
    sub_parser.add_argument(
            'arguments', nargs=argparse.REMAINDER,
            help='extra arguments will be provided as-is for the job')
    sub_parser.set_defaults(scenario_id=0, owner_id=0)

    # Job Status subparser
    sub_parser = subparsers.add_parser(
            'job_status',
            help='get the status of a job instance')
    sub_parser.add_argument('job_name', help='name of the job to query')
    sub_parser.add_argument(
            'job_id', type=int,
            help='the job instance ID to query')

    # List Jobs subparser
    subparsers.add_parser('list_jobs', help='list the installed jobs')

    # Restart Agent subparser
    subparsers.add_parser('restart_agent', help='restart the agent')

    # Check Connection subparser
    subparsers.add_parser('check_connection', help='check the agent is alive')

    # Change Collector subparser
    sub_parser = subparsers.add_parser(
            'assign_collector',
            help='change the collector an agent is sending stats to')
    sub_parser.add_argument('address', help='address of the new collector')
    sub_parser.add_argument(
            '-l', '--logs-port', type=int,
            help='the port on the collector to send logs to')
    sub_parser.add_argument(
            '-L', '--logs-query', type=int,
            help='the port on the collector to query logs from')
    sub_parser.add_argument(
            '-s', '--stats-port', type=int,
            help='the port on the collector to send stats to')
    sub_parser.add_argument(
            '-S', '--stats-query', type=int,
            help='the port on the collector to query stats from')
    sub_parser.add_argument(
            '-d', '--stats-database',
            help='name of the database on the collector to store stats into')
    sub_parser.add_argument(
            '-p', '--stats-precision',
            help='timestamp precision of stats sent to the collector')
    sub_parser.set_defaults(**COLLECTOR_DEFAULTS)

    # Dump into Collector subparser
    sub_parser = subparsers.add_parser(
            'dump_into_collector',
            help='send stats and logs from an agent to a collector')
    sub_parser.add_argument('address', help='address of the chosen collector')
    sub_parser.add_argument(
            '-l', '--logs-port', type=int,
            help='the port on the collector to send logs to')
    sub_parser.add_argument(
            '-L', '--logs-query', type=int,
            help='the port on the collector to query logs from')
    sub_parser.add_argument(
            '-s', '--stats-port', type=int,
            help='the port on the collector to send stats to')
    sub_parser.add_argument(
            '-S', '--stats-query', type=int,
            help='the port on the collector to query stats from')
    sub_parser.add_argument(
            '-d', '--stats-database',
            help='name of the database on the collector to store stats into')
    sub_parser.add_argument(
            '-p', '--stats-precision',
            help='timestamp precision of stats sent to the collector')
    sub_parser.add_argument(
            '-c', '--last-collector', default='127.0.0.1',
            help='change the collector the agent is sending stats to after the dump (default: 127.0.0.1)')
    sub_parser.add_argument(
            'date', nargs=2,
            help='date and time from which to re-send stats and logs')
    sub_parser.set_defaults(**COLLECTOR_DEFAULTS)

    return parser


def convert_date(date_argument):
    if not date_argument:
        return
    date, time = date_argument
    date = datetime.strptime('{} {}'.format(date, time), DATE_FORMAT)
    return int(date.timestamp() * 1000)


def dump_into_collector(
        baton, address, date, logs_port,
        logs_query, stats_port, stats_query,
        stats_database, stats_precision, last_collector):
    baton.change_collector(
            address, logs_port, logs_query, stats_port,
            stats_query, stats_database, stats_precision)

    jobs = set(baton.refresh().list_jobs())
    arguments = datetime.fromtimestamp(date / 1000).strftime(DATE_FORMAT).split()
    statuses = {
            'send_stats': 'Not installed',
            'send_logs': 'Not installed',
    }
    print('The send_stats and send_logs jobs will be launched to dump '
          'collected data from Agent to Collector {}'.format(address))
    for job in statuses:
        if job in jobs:
            status = 'Not Started'

            job_id = baton.refresh().start_job_instance(job, -1, 0, 0, arguments, 'now')
            while True:
                status = baton.refresh().status_job_instance(job, job_id)
                print('Job {} is {}'.format(job, status))
                if status not in ('Running', 'Scheduled'):
                    break
                time.sleep(2)
            statuses[job] = status
    baton.refresh().change_collector(last_collector, **COLLECTOR_DEFAULTS)
    return statuses


def main(baton, agent, port, action, **kwargs):
    contact_agent = {
            'start_job': baton.start_job_instance,
            'stop_job': baton.stop_job_instance,
            'restart_job': baton.restart_job_instance,
            'job_status': baton.status_job_instance,
            'list_jobs': baton.list_jobs,
            'restart_agent': baton.restart_agent,
            'check_connection': baton.check_connection,
            'assign_collector': baton.change_collector,
            'dump_into_collector': partial(dump_into_collector, baton),
    }[action]
    try:
        response = contact_agent(**kwargs)
    except errors.ConductorError as e:
        print(e.json)
        sys.exit(e.ERROR_CODE)
    else:
        print(response)


if __name__ == '__main__':
    parser = build_parser()
    args = parser.parse_args()

    try:
        date = args.date
    except AttributeError:
        pass
    else:
        try:
            args.date = convert_date(date)
        except ValueError:
            parser.error(
                    'argument -d: invalid {} date: \'{}\''
                    .format(DATE_FORMAT, args.date))

    try:
        baton = OpenBachBaton(args.agent, args.port)
    except errors.ConductorError:
        parser.error(
                'unable to communicate with agent on {}:{}'
                .format(args.agent, args.port))

    main(baton, **vars(args))
