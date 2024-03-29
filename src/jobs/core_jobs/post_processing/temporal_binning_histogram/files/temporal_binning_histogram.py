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
 * David FERNANDES <david.fernandes@viveris.fr>
'''
import stat
import sys
import syslog
import os.path
import argparse
import tempfile
import itertools

import pandas as pd
import matplotlib.pyplot as plt
from pkg_resources import parse_version as version

import collect_agent
from data_access.post_processing import Statistics, save, _Plot


AGGREGATION_OPTIONS = {'year', 'month', 'day', 'hour', 'minute', 'second'}
COLORMAP_OPTION = {
        'jet': 'jet',
        'dark': 'Dark2',
        'seismic': 'seismic',
        'copper': 'copper',
        'red2green': 'RdYlGn',
        'blue2red': 'bwr',
        'blue2green': 'brg',
        'paired': 'Paired',
}
UNIT_OPTION = {'s', 'ms' ,'bits/s', 'Kbits/s', 'Mbits/s','Gbits/s','Bytes' ,'KBytes', 'MBytes', 'GBytes'}

SET_AXIS_PARAMETERS = {'axis': 1}
if version(pd.__version__) < version('1.5.0'):
    SET_AXIS_PARAMETERS['inplace'] = False
else:
    SET_AXIS_PARAMETERS['copy'] = True


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


def main(
        job_instance_ids, statistics_names, aggregations_periods,
        bins_sizes, offset, maximum, stats_with_suffixes, axis_labels,
        figures_titles, legends_titles, stat_units, legend_units,
        use_legend, add_global, pickle, colormap):
    file_ext = 'pickle' if pickle else 'png'
    statistics = Statistics.from_default_collector()
    statistics.origin = 0
    with tempfile.TemporaryDirectory(prefix='openbach-temporal-binning-histogram-') as root:
        metadatas = itertools.zip_longest(
                job_instance_ids, statistics_names, aggregations_periods,
                bins_sizes, axis_labels, figures_titles, legends_titles,
                stat_units, legend_units, colormap, fillvalue=[])
        for job, fields, aggregations, bin_sizes, labels, titles, legend_titles, stat_units, legend_units, cms in metadatas:
            data_collection = statistics.fetch(
                    job_instances=job,
                    suffix = None if stats_with_suffixes else '',
                    fields=fields)

            # Drop multi-index columns to easily concatenate dataframes from their statistic names
            df = pd.concat([
                    plot.dataframe.set_axis(
                        plot.dataframe.columns.get_level_values('statistic'),
                        **SET_AXIS_PARAMETERS)
                    for plot in data_collection
            ])

            # Recreate a multi-indexed columns so the plot can function properly
            df.columns = pd.MultiIndex.from_tuples(
                    [('', '', '', '', stat) for stat in df.columns],
                    names=['job', 'scenario', 'agent', 'suffix', 'statistic'])

            plot = _Plot(df)
            if not fields:
                fields = list(df.columns.get_level_values('statistic'))

            metadata = itertools.zip_longest(
                    fields, labels, bin_sizes, aggregations,
                    legend_titles, stat_units, legend_units, titles, cms)

            for field, label, bin_size, aggregation, legend, stat_unit, legend_unit, title, cm in metadata:
                scale_factor = 1 if stat_unit is None else multiplier(stat_unit, legend_unit or stat_unit)
                cmap = COLORMAP_OPTION[cm or 'red2green']

                if field not in df.columns.get_level_values('statistic'):
                    collect_agent.send_log(
                            syslog.LOG_WARNING,
                            'job instances {} did not produce the statistic {}'.format(job, field))
                    continue

                if label is None:
                    collect_agent.send_log(
                            syslog.LOG_WARNING,
                            'no y-axis label provided for the {} statistic of job '
                            'instances {}: using the empty string instead'.format(field, job))
                    label = ''

                if aggregation is None:
                    collect_agent.send_log(
                            syslog.LOG_WARNING,
                            'invalid aggregation value of {} for the {} '
                            'statistic of job instances {}: choose from {}, using '
                            '"hour" instead'.format(aggregation, field, job, AGGREGATION_OPTIONS))
                    aggregation = 'hour'

                if legend is None and use_legend:
                    collect_agent.send_log(
                            syslog.LOG_WARNING,
                            'no legend title provided for the {} statistic of job '
                            'instances {}: using statistics name instead'.format(field, job))
                    legend = field

                if bin_size is None:
                    collect_agent.send_log(
                            syslog.LOG_WARNING,
                            'no bin size provided for the {} statistic of job '
                            'instances {}: using the default value 100 instead'.format(field, job))
                    bin_size = 100

                figure, axis = plt.subplots()

                axis = plot.plot_temporal_binning_histogram(
                        axis, label, field, None, bin_size, offset,
                        maximum, aggregation, add_global, use_legend,
                        legend, legend_unit, cmap, scale_factor)

                if title is not None:
                    axis.set_title(title)

                filepath = os.path.join(root, 'temporal_binning_histogram_{}.{}'.format(field, file_ext))
                save(figure, filepath, pickle, False)
                collect_agent.store_files(collect_agent.now(), figure=filepath)


if __name__ == '__main__':
    with collect_agent.use_configuration('/opt/openbach/agent/jobs/temporal_binning_histogram/temporal_binning_histogram_rstats_filter.conf'):
        parser = argparse.ArgumentParser(description=__doc__)
        parser.add_argument(
                '-j', '--jobs', metavar='ID', nargs='+', action='append',
                required=True, type=int, default=[],
                help='job instances to plot data from')
        parser.add_argument(
                '-s', '--stat', '--statistic', dest='statistics',
                metavar='STATISTIC', nargs='+', action='append', default=[],
                help='statistics names to plot')
        parser.add_argument(
                '-a', '--aggregation', dest='aggregations',
                choices=AGGREGATION_OPTIONS, nargs='+', action='append',
                help='Time criteria for values aggregation')
        parser.add_argument(
                '-b', '--bin-size', dest='bin_sizes', type=int,
                metavar='BIN_SIZE', nargs='+', action='append', default=[],
                help='Size of the bins in the desired legend unit')
        parser.add_argument(
                '-o', '--offset', type=int, default=0,
                help='Offset of the bins')
        parser.add_argument(
                '-m', '--maximum', type=int, default=None,
                help='Maximum value of the bins')
        parser.add_argument(
                '-w', '--no-suffix', action='store_true',
                help='Do not plot statistics with suffixes')
        parser.add_argument(
                '-y', '--ylabel', dest='ylabel', nargs='+',
                metavar='YLABEL', action='append', default=[],
                help='Label of y-axis')
        parser.add_argument(
                '-t', '--title', dest='title', nargs='+',
                metavar='TITLE', action='append', default=[],
                help='Title of the figure')
        parser.add_argument(
                '-l', '--legend-title', dest='legend_titles', nargs='+',
                metavar='LEGEND_TITLE', action='append', default=[],
                help='Title of the legend')
        parser.add_argument(
                '-u', '--stat-unit', dest='stat_units', nargs='+',choices=UNIT_OPTION,
                metavar='STAT_UNIT', action='append', default=[],
                help='Unit of the statistic')
        parser.add_argument(
                '-U', '--legend-unit', dest='legend_units', nargs='+',choices=UNIT_OPTION,
                metavar='LEGEND_UNIT', action='append', default=[],
                help='Unit of the legend')
        parser.add_argument(
                '-g', '--global', '--global-bin', dest='add_global', action='store_true',
                help='Add bin of global measurements')
        parser.add_argument(
                '-c', '--colormap', metavar='COLORMAP',action='append',dest='colormap',
                choices=COLORMAP_OPTION,nargs='+',default=[],
                help='Allows to choose colormap for graph ')
        parser.add_argument(
                '-p', '--pickle', action='store_true',
                help='Allows to export figures as pickle '
                '(by default figures are exported as image)')
        parser.add_argument(
                '-n', '--hide-legend', '--no-legend', action='store_true',
                help='Do not draw any legend on the graph')

        args = parser.parse_args()
        stats_with_suffixes = not args.no_suffix
        use_legend = not args.hide_legend

        main(
            args.jobs, args.statistics, args.aggregations, args.bin_sizes, args.offset,
            args.maximum, stats_with_suffixes, args.ylabel, args.title, args.legend_titles,
            args.stat_units, args.legend_units, use_legend, args.add_global, args.pickle, args.colormap)
