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
from pathlib import Path
from datetime import datetime
from contextlib import suppress
try:
    import simplejson as json
except ImportError:
    import json

import collect_agent


DATE_FORMAT = '%Y-%m-%d %H:%M:%S.%f'
STATS_FOLDER = Path('/var/openbach_stats/')


def forward_statistics(stats):
    metadata = stats.pop('_metadata')
    timestamp = metadata.pop('time')
    suffix = metadata.pop('suffix', None)
    collect_agent.send_stat(timestamp, suffix=suffix, metadatas=metadata, **stats)


def main(origin, jobs=None):
    if jobs is not None:
        jobs = set(jobs)
    origin_timestamp = origin.timestamp()

    for job_folder in STATS_FOLDER.iterdir():
        if (jobs and job_folder.name not in jobs) or not job_folder.is_dir():
            continue
   
        for file_path in sorted(job_folder.iterdir()):
            file_timestamp = file_path.lstat().st_mtime
            if file_timestamp >= origin_timestamp:
                with file_path.open() as statistics:
                    for line in statistics:
                        try:
                            statistic = json.loads(line)
                        except ValueError:
                            pass
                        else:
                            forward_statistics(statistic)


if __name__ == "__main__":
    with collect_agent.register_collect('/opt/openbach/agent/jobs/send_stats/send_stats_rstats_filter.conf'):
        date_usage = DATE_FORMAT.replace('%', '%%')  # Somehow argparse still uses %-formatting for its help message

        # Define Usage
        parser = argparse.ArgumentParser(
                description=__doc__,
                formatter_class=argparse.ArgumentDefaultsHelpFormatter)
        parser.add_argument(
                'date', nargs=2,
                help='date and time from which to re-send stats (accepted format: {})'.format(date_usage))
        parser.add_argument(
                '-j', '--job-name',
                action='append',
                help='name of a Job to send stats from (leave blank to send stats from all jobs)')

        # get args
        args = parser.parse_args()
        try:
            date = datetime.strptime('{} {}'.format(*args.date), DATE_FORMAT)
        except ValueError:
            parser.error('date and time are not in the expected ({}) format'.format(DATE_FORMAT))
        else:
            main(date, args.job_name)
