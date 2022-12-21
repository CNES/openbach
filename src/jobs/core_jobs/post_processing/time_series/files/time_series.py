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


"""Provide time series of data generated by OpenBACH jobs"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Mathias ETTINGER <mathias.ettinger@toulouse.viveris.com>
'''

import syslog
import os.path
import argparse
import tempfile
import itertools

import matplotlib.pyplot as plt

import collect_agent
from data_access.post_processing import Statistics, save


def main(
        job_instance_ids, statistics_names, stats_with_suffixes,
        labels, titles, use_legend, legend, pickle, filenames):
    file_ext = 'pickle' if pickle else 'png'
    legends = iter(legend)

    statistics = Statistics.from_default_collector()
    with tempfile.TemporaryDirectory(prefix='openbach-time-series-') as root:
        for fields, label, title, filename in itertools.zip_longest(statistics_names, labels, titles, filenames):
            figure, axis = plt.subplots()
            data = statistics.fetch_all(
                    job_instances=job_instance_ids,
                    suffix = None if stats_with_suffixes else '',
                    fields=fields, columns=legends)
            data.plot_time_series(axis, label, use_legend)
            if title is not None:
                axis.set_title(title)
            if filename is not None:
                filename = '{}.{}'.format(filename, file_ext)
            elif statistics_names is None:
                filename = 'time_series.{}'.format(file_ext)
            else:
                filename = 'time_series_{}.{}'.format('_'.join(fields), file_ext)
            filepath = os.path.join(root, filename)
            save(figure, filepath, pickle)
            collect_agent.store_files(collect_agent.now(), figure=filepath)


if __name__ == '__main__':
    with collect_agent.use_configuration('/opt/openbach/agent/jobs/time_series/time_series_rstats_filter.conf'):
        parser = argparse.ArgumentParser(description=__doc__)
    
        parser.add_argument(
                'jobs', type=int, nargs='+', metavar='job',
                help='job instances to plot data from')
        parser.add_argument(
                '-s', '--stat', '--statistic', dest='statistics',
                metavar='STATISTIC', nargs='+', action='append',
                help='statistics names to plot')
        parser.add_argument(
                '-w', '--no-suffix', action='store_true',
                help='do not plot statistics with suffixes')
        parser.add_argument(
                '-y', '--ylabel', dest='ylabel',
                metavar='YLABEL', action='append', default=[],
                help='the label of y-axis')
        parser.add_argument(
                '-t', '--title', dest='title',
                metavar='TITLE', action='append', default=[],
                help='the title of figure')
        parser.add_argument(
                '-p', '--pickle', action='store_true',
                help='allows to export figures as pickle '
                '(by default figures are exported as image)')
        parser.add_argument(
                '-n', '--hide-legend', '--no-legend', action='store_true',
                help='do not draw any legend on the graph')
        parser.add_argument(
                '-l', '--legend', action='append', default=[],
                help='text to display in the legend')
        parser.add_argument(
                '-f', '--filename', action='append', default=[],
                help='name of the generated file')
    
        args = parser.parse_args()
        stats = args.statistics or [None]
        stats_with_suffixes = not args.no_suffix
        use_legend = not args.hide_legend
        main(
            args.jobs, stats, stats_with_suffixes, args.ylabel, args.title,
            use_legend, args.legend, args.pickle, args.filename)
