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


"""Sources of the Job send_stats"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Adrien THIBAUD <adrien.thibaud@toulouse.viveris.com>
 * Mathias ETTINGER <mathias.ettinger@toulouse.viveris.com>
'''


import os
import time
import syslog
import argparse
from datetime import datetime
from contextlib import suppress
try:
    import simplejson as json
except ImportError:
    import json

import collect_agent


CONF_FILE = '/opt/openbach/agent/jobs/send_stats/send_stats_rstats_filter.conf'
DATE_FORMAT = '%Y-%m-%d %H:%M:%S.%f'
ENVIRON_METADATA = (
        'job_name',
        'job_instance_id',
        'scenario_instance_id',
        'owner_scenario_instance_id',
)


def send_stats(filename):
    with open(filename) as statistics:
        try:
            # Parse the first line independently
            # so we can update os.ENVIRON
            statistic = json.loads(next(statistics))
        except StopIteration:
            return  # File was empty

        # Setup os.ENVIRON for register_collect to work properly
        metadata = statistic.pop('_metadata')
        timestamp = metadata['time']
        suffix = metadata.get('suffix')
        for name in ENVIRON_METADATA:
            # This way rstats will be aware and will not locally store the
            # stats again
            if name == 'job_name':
                metadata[name] = 'send_stats-' + str(metadata[name])

            os.environ[name.upper()] = str(metadata[name])

        # Recreate connection with rstats
        success = collect_agent.register_collect(CONF_FILE, new=True)
        if not success:
            message = 'Cannot communicate with rstats'
            collect_agent.send_log(syslog.LOG_ERR, message)
            raise ConnectionError(message)
        collect_agent.send_stat(timestamp, suffix=suffix, **statistic)
        for line in statistics:
            statistic = json.loads(line)
            metadata = statistic.pop('_metadata')
            timestamp = metadata['time']
            suffix = metadata.get('suffix')
            collect_agent.send_stat(timestamp, suffix=suffix, **statistic)


def main(origin, jobs=None, stats_folder='/var/openbach_stats/'):
    jobs = set(jobs) if jobs else set()
    origin_timestamp = datetime.timestamp(origin)

    connected = False
    for job_name in os.listdir(stats_folder):
        job_folder = os.path.join(stats_folder, job_name)
        if job_name not in jobs or not os.path.isdir(job_folder):
            continue
   
        for filename in sorted(os.listdir(job_folder)):
            file_timestamp = os.path.getmtime(os.path.join(job_folder, filename))
            if file_timestamp >= origin_timestamp:
                with suppress(ValueError):
                    send_stats(os.path.join(stats_folder, job_name, filename))
                    connected = True

    if connected:
        collect_agent.remove_stat()


if __name__ == "__main__":
    # Define Usage
    parser = argparse.ArgumentParser(
            description=__doc__,
            formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument(
            'date', nargs=2,
            help='date and time from which to re-send stats (accepted format: {})'.format(DATE_FORMAT))
    parser.add_argument(
            '-j', '--job_name',
            action='append',
            help='name of a Job to send stats from')

    # get args
    args = parser.parse_args()
    try:
        date = datetime.strptime('{} {}'.format(*args.date), DATE_FORMAT)
    except ValueError:
        parser.error('date and time are not in the expected ({}) format'.format(DATE_FORMAT))
    else:
        main(date, args.job_name)
