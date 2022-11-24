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


"""Provide time period summary of data generated by OpenBACH jobs"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Aichatou Garba Abdou <aichatou.garba-abdou@viveris.fr>
'''


import os
import syslog
import argparse
import tempfile
import itertools
from datetime import datetime,timedelta

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from dateutil.parser import parse

import collect_agent
from data_access.post_processing import Statistics, save, _Plot


COLUMN_NUMBER = 4
FUNCTIONS = {
        'mean': 'Moyenne',
        'median': 'Médiane',
        'min': 'Minimum',
        'max': 'Maximum',
}
UNIT_OPTION = {'s', 'ms' ,'bits/s', 'Kbits/s', 'Mbits/s','Gbits/s','Bytes' ,'KBytes', 'MBytes', 'GBytes'}


def multiplier(base, unit):
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
        if unit.startswith('s'):
                return 1000
        if unit.startswith('Gbits'):
                return 1000 * 1000 * 1000
        if unit.startswith('Mbits'):
                return 1000 * 1000
        if unit.startswith('Kbits'):
                return 1000
        return 1


def plot_summary_agent_comparison(axis, function_result, reference, agent, num_bars, filled_box):
    axs = iter(axes)
    header = next(axs)
    header.axis([0, 10, 0, 10])
    header.text(.1, .5, agent, fontsize=10, transform=header.transAxes)

    step = 100 // num_bars
    for ax, value in zip(axs, function_result):
        if reference is None:
            ax.axis([0, 10, 0, 10])
            ax.text(3, 5, f'{value:.02f}', fontsize=10)
            continue

        if filled_box:
            percentage = value * 100 / reference
            ax.set(ylim=(0, 10))
            ax.barh([3], [100], height=3, align='center', color=(.1, .1, .1, .2))
            ax.barh([3], [percentage], height=3, align='center', color='black')
            ax.text(1, 8, f'{value:.02f} ({percentage:.02f}%)', fontsize=8)
        else:
            background = [step * (i+1) for i in range(num_bars)]
            foreground = [height for i, height in enumerate(background) if value > reference * i / num_bars]
            ax.bar(np.arange(num_bars), background, width=0.7, color=(.1, .1, .1, .2))
            ax.bar(np.arange(len(foreground)), foreground, width=0.7, color='black')
            ax.text(-.3, 80, f'{value:.02f}', fontsize=7)


def main(
        agents_name, job_name, statistic_name, timestamp_boundaries,
        function, reference, num_bars, start_day, start_evening, start_night,
        stat_unit, table_unit, agents_title, stat_title,
        figure_title, stats_with_suffixes, filled_box):
    statistics = Statistics.from_default_collector()
    statistics.origin = 0
    with tempfile.TemporaryDirectory(prefix='openbach-summary_agent_comparison-') as root_folder:
        if not timestamp_boundaries:
            timestamp = None
        else:
            begin_date, end_date = map(parse, timestamp_boundaries)
            timestamp = [int(begin_date.timestamp() * 1000), int(end_date.timestamp() * 1000)]

        if function not in FUNCTIONS:
            function = 'mean'

        if start_day is None:
            start_day = 7
        if start_evening is None:
            start_evening = 18
        if start_night is None:
            start_night = 0 

        scale_factor = 1 if stat_unit is None else multiplier(stat_unit, table_unit or stat_unit)

        figure, axis = plt.subplots(
                len(agents_name) + 1,  # Account for header + 1 line per agent
                4)  # [Agent name, day, evening, night]
        plt.subplots_adjust(hspace=0,wspace=0)
        for ax in axis.flat:
            ax.tick_params(which='both', bottom=False, left=False, top=False, labelleft=False, labelbottom=False)

        headers = [
                f' {FUNCTIONS[function]} \n {stat_title or statistic_name} \n {table_unit or ""}',
                f'Journée ({start_day}h − {start_evening}h)',
                f'Soirée ({start_evening}h − {start_night}h)',
                f'Nuit ({start_night}h − {start_day}h)',
        ]

        axs = iter(axis)
        for header, ax in zip(headers, next(axs)):
            ax.axis([0, 10, 0, 10])
            ax.text(.5, 3, header, fontsize=10)

        names = itertools.chain(agents_title, itertools.repeat(None))
        for agent, name, axes in zip(agents_name, names, axs):
            data_collection = statistics.fetch_all(
                    job=job_name, agent=agent,
                    suffix=None if stats_with_suffixes else '',
                    fields=[statistic_name], timestamp=timestamp)

            result = data_collection.compute_function(
                    function, scale_factor,
                    start_day, start_evening, start_night)

            plot_summary_agent_comparison(axes, result, reference, name or agent, num_bars, filled_box)

        if figure_title:
            figure.suptitle(figure_title)
        filepath = os.path.join(root_folder, 'summary_agent_comparison_{}.png'.format(statistic_name, file_ext))
        save(figure, filepath, set_legend=False)
        collect_agent.store_files(collect_agent.now(), figure=filepath)


if __name__ == '__main__':
   with collect_agent.use_configuration('/opt/openbach/agent/jobs/summary_agent_comparison/summary_agent_comparison_rstats_filter.conf'):
        parser = argparse.ArgumentParser(description=__doc__)
        parser.add_argument(
                'agents', metavar='AGENT_NAME', nargs='+',
                help='Agent names to fetch data from')
        parser.add_argument(
                'job', metavar='JOB_NAME',
                help='Job name to fetch data from')
        parser.add_argument(
                'statistic', metavar='STAT_NAME',
                help='Statistic name to be analysed')
        parser.add_argument(
                '-d', '--timestamp-boundaries',
                metavar=('BEGIN_DATE', 'END_DATE'), nargs=2,
                help='Start and End date in format YYYY:MM:DD hh:mm:ss')
        parser.add_argument(
                '-f', '--function', choices=list(FUNCTIONS),
                help='Mathematical function to compute')
        parser.add_argument(
                '-r', '--reference', type=int,
                help='Reference value for comparison')
        parser.add_argument(
                '-n', '--num-bars',
                type=int, default=5,
                help='Number of reception bars')
        parser.add_argument(
                '-D', '--start-day', metavar='START_DAY',
                help='Starting time of the day')
        parser.add_argument(
                '-E', '--start-evening', metavar='START_EVENING',
                help='Starting time of the evening')
        parser.add_argument(
                '-N', '--start-night', metavar='START_NIGHT',
                help='starting time of the night')
        parser.add_argument(
                '-u', '--stat-unit', metavar='UNIT', choices=UNIT_OPTION,
                help='Unit of the statistic')
        parser.add_argument(
                '-U', '--table-unit', metavar='UNIT', choices=UNIT_OPTION,
                help='Desired unit to show on the figure')
        parser.add_argument(
                '-a', '--agent-title', default=[],
                metavar='AGENT_TITLE ', nargs='+', dest='agents_title',
                help='Agent name to display on the table')
        parser.add_argument(
                '-s', '--stat-title',
                help='Statistic name to display on the figure')
        parser.add_argument(
                '-t', '--figure-title', '--title',
                help='The title of the generated figure')
        parser.add_argument(
                '-w', '--no-suffix', action='store_true',
                help='Do not plot statistics with suffixes')
        parser.add_argument(
                '-g', '--filled-box', action='store_true',
                help='Display stats value in a filled box instead of "network bars"')

        args = parser.parse_args()
        stats_with_suffixes = not args.no_suffix

        main(
            args.agents, args.job, args.statistic, args.timestamp_boundaries,
            args.function, args.reference, args.num_bars,
            args.start_day, args.start_evening, args.start_night,
            args.stat_unit, args.table_unit, args.agents_title,
            args.stat_title, args.figure_title, stats_with_suffixes, args.filled_box)
