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


"""Sources of the Job tc_configure_link"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Joaquin MUGUERZA <joaquin.muguerza@viveris.fr>
 * David FERNANDES <david.fernandes@viveris.fr>
 * Francklin SIMO <francklin.simo@viveris.fr> 
 * Matthieu PETROU <matthieu.petrou@viveris.fr>
'''

import re
import sys
import syslog
import argparse
import subprocess

import collect_agent


HANDLE_INGRESS = 'ffff:'
IFB = 'ifb{}'


def run_command(cmd):
    """ Run a command, return return code """
    p = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE)
    if p.returncode:
        message = "Error when executing command '{}': '{}'".format(
                    ' '.join(cmd), p.stderr.decode())
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)
    return p.returncode, p.stdout.decode()


def clear_ingress(interfaces):
    for interface in interfaces.split(','):
        # Find ifbs that are associated to interface
        cmd = ['tc', 'filter', 'show', 'dev', interface, 'parent', HANDLE_INGRESS]
        _, output = run_command(cmd)
        ifbs = re.findall('Egress Redirect to device (\w+)', output)
        # Remove filter rule redirecting all incoming traffics from interface to ifb interface
        cmd = ['tc', 'filter', 'del', 'dev', interface, 'parent', HANDLE_INGRESS]
        # Check if an ingress qdisc exists, if so remove it on interface
        cmd = ['tc', 'qdisc', 'show', 'dev', interface, 'ingress']
        _, output = run_command(cmd)
        ingress_qdiscs = re.findall('qdisc ingress', output)
        if ingress_qdiscs: 
           delete_qdisc(interface, 'ingress')
        # Remove qdisc root on ifbs and set them down
        for ifb in ifbs:
            delete_qdisc(ifb, 'root')
            cmd = ['ip', 'link', 'set', 'dev', ifb, 'down']
            _, output = run_command(cmd)
    # Check if ifb module is not using, if so remove it
    cmd = ['tc', 'qdisc', 'show']
    _, output = run_command(cmd)
    ingress_qdiscs = re.findall('qdisc ingress', output)
    if not ingress_qdiscs: 
       cmd = ['modprobe', '-r', 'ifb']
       run_command(cmd)


def clear_egress(interfaces):
    for interface in interfaces.split(','):
        cmd = ['ip', 'link', 'set' , interface, 'qlen', '1000' ]
        run_command(cmd)
        cmd = ['tc', 'qdisc', 'show']
        _, output = run_command(cmd)
        ifaces = re.findall('qdisc netem 1: dev (\w+)', output)
        ifaces.extend(re.findall('qdisc netem 10: dev (\w+)', output))
        if interface in ifaces:
           delete_qdisc(interface, 'root')


def delete_qdisc(interface, qdisc):
    """ Delete the tc qdisc on an interface """
    cmd = ['tc', 'qdisc', 'del', 'dev', interface, qdisc]
    run_command(cmd)


def add_qdisc_ingress(interface, ifb, buffer_size):
    cmds = [
            ['ip', 'link', 'set', 'dev', ifb, 'up', 'qlen', str(buffer_size)],
            ['tc', 'qdisc', 'add', 'dev', interface, 'handle', HANDLE_INGRESS, 'ingress'], 
            [
                'tc', 'filter', 'add', 'dev', interface,
                'parent', HANDLE_INGRESS, 'u32', 'match',
                'u32', '0', '0', 'action', 'mirred',
                'egress', 'redirect', 'dev', ifb,
            ],
    ]
    for cmd in cmds:
        run_command(cmd)


def add_qdisc_bandwidth(interface, bandwidth):
    """ Add a qdisc to limit the bandwidth on interface """
    cmds = [
            ['tc', 'qdisc', 'add', 'dev', interface, 'root', 'handle', '1:', 'htb', 'default', '11'],
            [
                'tc', 'class', 'add', 'dev', interface, 'parent',
                '1:', 'classid', '1:1', 'htb', 'rate', '{}bps'.format(bandwidth),
                'burst', '1000b',
            ],
            [
                'tc', 'class', 'add', 'dev', interface, 'parent',
                '1:1', 'classid', '1:11', 'htb', 'rate', '{}bit'.format(bandwidth),
                'burst', '1000b',
            ],
    ]
    for cmd in cmds:
        run_command(cmd)


def add_qdisc_delay(interface, delay, jitter, delay_distribution, loss_model, loss_model_params, handle, buffer_size):
    """ Add a qdisc to set a delay, and jitter on interface """
    cmd = ['tc', 'qdisc', 'add', 'dev', interface]
    cmd.extend(handle)
    cmd.extend(['netem', 'limit', str(buffer_size)])
    if delay:
       cmd.extend(['delay', '{}ms'.format(str(delay))])
       if jitter and jitter > 0: 
          cmd.extend(['{}ms'.format(str(jitter)), 'distribution', delay_distribution])
    if loss_model and loss_model_params:
       cmd.extend(['loss', loss_model])
       for param in loss_model_params: 
           cmd.extend(['{}%'.format(str(param))])
    run_command(cmd)


def apply_conf(interfaces, mode, delay=None, jitter=None, delay_distribution=None, 
               bandwidth=None, loss_model=None, loss_model_params=None, buffer_size=None):
    collect_agent.send_log(syslog.LOG_DEBUG, 'Starting tc_configure_link job (apply {})'.format(mode))

    if mode == 'egress' or mode == 'all':
        for interface in interfaces.split(','):
            handle = ['root', 'handle', '1:']
            # Delete existing qdisc
            # Check if a root qdisc exists, if so remove it on interface
            cmd = ['tc', 'qdisc', 'show', 'dev', interface]
            _, output = run_command(cmd)
            output = re.findall('qdisc netem', output)
            if output:
               delete_qdisc(interface, 'root')
            # Add qlen
            run_command(['ip', 'link', 'set', interface, 'qlen', str(buffer_size)])
            # Add bandwidth if relevant
            if bandwidth:
                if not re.findall(r'^[0-9]+[KM]$', bandwidth):
                    collect_agent.send_log(syslog.LOG_ERR,
                            "Invalid format for bandwidth: expecting "
                            "'{}', found '{}'".format('{VALUE}{M|K}', bandwidth))
                    sys.exit(1)
                add_qdisc_bandwidth(interface, bandwidth)
                handle = ['parent', '1:11', 'handle', '10:']
            # Add delay
            add_qdisc_delay(interface, delay, jitter, delay_distribution, loss_model, loss_model_params, handle, buffer_size)
    if mode == 'ingress' or mode == 'all':
        # Ingress configuration
        clear_ingress(interfaces)
        run_command(['modprobe', '-r', 'ifb'])
        run_command(['modprobe', 'ifb', 'numifbs={}'.format(str(len(interfaces.split(','))))])
        for index, interface in enumerate(interfaces.split(',')):
            handle = ['root', 'handle', '1:']
            # Clear ingress configuration and add a new one
            add_qdisc_ingress(interface, IFB.format(str(index)), buffer_size)
            # Add bandwidth if relevant
            if bandwidth:
               if not re.findall(r'^[0-9]+[KM]$', bandwidth):
                  collect_agent.send_log(syslog.LOG_ERR,
                        "Invalid format for bandwidth: expecting "
                        "'{}', found '{}'".format('{VALUE}{M|K}', bandwidth))
                  sys.exit(1)
               add_qdisc_bandwidth(IFB.format(str(index)), bandwidth)
               handle = ['parent', '1:11', 'handle', '10:']
            # Add delay
            add_qdisc_delay(IFB.format(str(index)), delay, jitter, delay_distribution, loss_model, loss_model_params, handle, buffer_size)


def clear_conf(interfaces, mode):
    if mode in {'ingress', 'all'}:
        clear_ingress(interfaces)
    if mode in {'egress', 'all'}:
        clear_egress(interfaces)


if __name__ == '__main__':
    with collect_agent.use_configuration('/opt/openbach/agent/jobs/tc_configure_link/tc_configure_link_rstats_filter.conf'):
        # Define Usage
        parser = argparse.ArgumentParser(
                description=__doc__,
                formatter_class=argparse.ArgumentDefaultsHelpFormatter)

        parser.add_argument(
                'interfaces', type=str,
                help='Comma-separated list of interfaces to configure')

        subparsers = parser.add_subparsers(
                title='Subcommand operation',
                help='Choose apply: to add a new configuration, or clear: to delete existing ones')
        subparsers.required=True

        parser_apply = subparsers.add_parser('apply', help='Apply configuration')
        parser_apply.add_argument(
                '-m', '--mode',
                choices=['ingress', 'egress', 'all'], default='all',
                help='Targeted network traffic: ingress, egress, or all')
        parser_apply.add_argument(
                '-b', '--bandwidth',
                help='Bandwidth in Mbps or Kbps expressed as [value][M|K]')
        parser_apply.add_argument(
                '-D', '--delay_distribution',
                choices=['uniform', 'normal', 'pareto', 'paretonormal'], default='normal',
                help='Delay  distribution (default=normal)')
        parser_apply.add_argument(
                '-d', '--delay',
                type=int,
                help='Packet delay in ms')
        parser_apply.add_argument(
                '-j', '--jitter',
                type=int,
                help='Delay variation in ms. Warning : this may introduce packets disorder.')
        parser_apply.add_argument(
                '-L', '--loss_model',
                choices=['random', 'state', 'gemodel'], default='random',
                help='Packet loss model (default=random)')
        parser_apply.add_argument(
                '-l', '--loss_model_params',
                type=float, nargs='*',
                help='Parameters of the loss model')
        parser_apply.add_argument(
                '--buffer_size',
                type=int, default=10000,
                help='Size of the buffer for qlen and netem limit parameter (default=10000)')

        parser_clear = subparsers.add_parser('clear', help='Clear configuration')
        parser_clear.add_argument(
                '-m', '--mode',
                choices=['ingress', 'egress', 'all'], default='all',
                help='Targeted network traffic: ingress, egress, or all')

        parser_apply.set_defaults(function=apply_conf)
        parser_clear.set_defaults(function=clear_conf)

        # get args
        args = vars(parser.parse_args())
        main = args.pop('function')
        main(**args)
