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


"""Sources of the Job ip_link"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * David FERNANDES <david.fernandes@viveris.fr>
'''

import os
import sys
import syslog
import argparse
import traceback
import subprocess
import contextlib

import collect_agent


def run_command(cmd):
    p = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE)
    if p.returncode:
        message = "Error when executing command '{}': '{}'".format(
                    ' '.join(cmd), p.stderr.decode())
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)
    return p.returncode, p.stdout.decode()


def extend_arguments(cmd, name, argument):
    if argument is not None:
        cmd.extend([name, str(argument)])


def ip_link_add(name, link, txqueuelen, address, broadcast, mtu, type, **type_args):
    cmd = ['ip', 'link', 'add', 'name', name]
    extend_arguments(cmd, 'link', link)
    extend_arguments(cmd, 'txqueuelen', txqueuelen)
    extend_arguments(cmd, 'address', address)
    extend_arguments(cmd, 'broadcast', broadcast)
    extend_arguments(cmd, 'mtu', mtu)
    cmd.extend(['type', type])
    for name, value in type_args.items():
        cmd.extend([name, str(value)])
    run_command(cmd)


def ip_link_del(dev, group):
    cmd = ['ip', 'link', 'delete']
    extend_arguments(cmd, 'dev', dev)
    extend_arguments(cmd, 'group', group)
    run_command(cmd)


def ip_link_set(dev, group, state, arp, dynamic, multicast, txqueuelen, address, broadcast, mtu, netns, master, nomaster):
    cmd = ['ip', 'link', 'set']
    extend_arguments(cmd, 'dev', dev)
    extend_arguments(cmd, 'group', group)
    if state is not None:
        cmd.extend([state])
    extend_arguments(cmd, 'arp', arp)
    extend_arguments(cmd, 'dynamic', dynamic)
    extend_arguments(cmd, 'multicast', multicast)
    extend_arguments(cmd, 'txqueuelen', txqueuelen)
    extend_arguments(cmd, 'address', address)
    extend_arguments(cmd, 'broadcast', broadcast)
    extend_arguments(cmd, 'mtu', mtu)
    extend_arguments(cmd, 'netns', netns)
    extend_arguments(cmd, 'master', master)
    if nomaster:
        cmd.extend(['nomaster'])
    run_command(cmd)


if __name__ == '__main__':
    with collect_agent.use_configuration('/opt/openbach/agent/jobs/ip_link/ip_link_rstats_filter.conf'):
        # Define Usage
        parser = argparse.ArgumentParser(
                description=__doc__,
                formatter_class=argparse.ArgumentDefaultsHelpFormatter)

        subparsers_command = parser.add_subparsers(title='ip-link command operation')
        subparsers_command.required=True

        #ip link add
        parser_add = subparsers_command.add_parser('add', help='ip link add')
        parser_add.add_argument('name', type=str,
                help='the name of the new virtual device')
        parser_add.add_argument('--link', type=str, metavar='DEVICE',
                help='the physical device to act operate on')
        parser_add.add_argument('--txqueuelen', type=int, metavar='NUMBER',
                help='the transmit queue length of the device')
        parser_add.add_argument('--address', type=str, metavar='LLADDRESS',
                help='the link layer address of the interface')
        parser_add.add_argument('--broadcast', type=str, metavar='LLADDRESS',
                help='the link layer broadcast address of the interface')
        parser_add.add_argument('--mtu', type=int,
                help='the mtu of the device')
        subparsers_add_type = parser_add.add_subparsers(
                title='Type of the new device', dest='type',
                help='specifies the type of the new device.')
        subparsers_add_type.required=True
        parser_add_type_bridge = subparsers_add_type.add_parser('bridge', help='Ethernet Bridge device')
        parser_add_type_dummy = subparsers_add_type.add_parser('dummy', help='Dummy network interface')

        #ip link delete
        parser_del = subparsers_command.add_parser('delete', help='ip link delete')
        parser_del.add_argument('--dev', type=str, help='network device to delete')
        parser_del.add_argument('--group', type=str, help='group of devices to delete (at least "dev" or "group" is required)')

        #ip link set
        parser_set = subparsers_command.add_parser('set', help='ip link set')
        parser_set.add_argument('--dev', type=str, help='network device to operate on')
        parser_set.add_argument('--group', type=str, help='group to operate on (at least "dev" or "group" is required)')
        parser_set.add_argument('--state', choices=['up', 'down'], help='set the state of the device to UP or DOWN')
        parser_set.add_argument('--arp', choices=['on', 'off'],
                help='change the NOARP flag on the device')
        parser_set.add_argument('--dynamic', choices=['on', 'off'],
                help='change the DYNAMIC flag on the device')
        parser_set.add_argument('--multicast', choices=['on', 'off'],
                help='change the MULTICAST flag on the device')
        parser_set.add_argument('--txqueuelen', type=int, metavar='NUMBER',
                help='the transmit queue length of the device')
        parser_set.add_argument('--address', type=str, metavar='LLADDRESS',
                help='the link layer address of the interface')
        parser_set.add_argument('--broadcast', type=str, metavar='LLADDRESS',
                help='the link layer broadcast address of the interface')
        parser_set.add_argument('--mtu', type=int,
                help='the mtu of the device')
        parser_set.add_argument('--netns', type=str, metavar='NETNSNAME_OR_PID',
                help='move the device to the network namespace associated with name NETNSNAME or process PID')
        parser_set.add_argument('--master', type=str, help='set master device of the device (enslave device)')
        parser_set.add_argument('--nomaster', action='store_true', help='unset master device of the device (release device)')

        parser_del.set_defaults(function=ip_link_del)
        parser_add.set_defaults(function=ip_link_add)
        parser_set.set_defaults(function=ip_link_set)
        args = vars(parser.parse_args())
        main = args.pop('function')
        main(**args)
