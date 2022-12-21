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


"""Sources of the Job ip_route"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Oumaima ZERROUQ <oumaima.zerrouq@toulouse.viveris.com>
 * Mathias ETTINGER <mathias.ettinger@toulouse.viveris.com>
 * Joaquin MUGUERZA <joaquin.muguerza@toulouse.viveris.com>
 * Francklin SIMO <francklin.simo@viveris.fr>
 * Bastien TAURAN <bastien.tauran@viveris.fr>
'''

import os
import sys
import time
import syslog
import signal
import argparse
import traceback
import contextlib
from enum import Enum
from functools import partial
from ipaddress import ip_address, ip_network

import subprocess

import collect_agent


class Operations(Enum):
    ADD='add'
    CHANGE='change'
    REPLACE='replace'
    DELETE='delete'


def run_command(command):
    try:
        p = subprocess.run(command, stderr=subprocess.PIPE, stdout=subprocess.PIPE)
    except subprocess.CalledProcessError as ex:
        message = 'ERROR: {}'.format(ex)
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)

    if p.returncode:
        error = p.stderr.decode()
        if 'No such process' in error:
            message = 'WARNING: {} exited with non-zero return value ({}): {}'.format(
                command, p.returncode, error)
            collect_agent.send_log(syslog.LOG_WARNING, message)
            sys.exit(0)
        else:
            message = 'ERROR: {} exited with non-zero return value ({}): {}'.format(
                command, p.returncode, error)
            collect_agent.send_log(syslog.LOG_ERR, message)
            sys.exit(message)
    else:
        collect_agent.send_log(syslog.LOG_DEBUG, 'Applied successfully : ' + ' '.join(command))

    return p.stdout.decode()


def restore_route(old_route, destination, operation, signal, frame):
    if operation == Operations.ADD.value:
        # Delete added route
        cmd = ['ip', 'route', 'del', str(destination)]
    elif operation == Operations.DELETE.value:
        # Add deleted route
        cmd = ['ip', 'route', 'add'] + old_route
    else:
        # Restore previous route
        if old_route:
            cmd = ['ip', 'route', operation] + old_route
        else:
            cmd = ['ip', 'route', 'del', str(destination)]

    run_command(cmd)
    message = 'Stopped job ip_route. Previous route has been restored.'
    collect_agent.send_log(syslog.LOG_DEBUG, message)
    sys.exit(message)


def main(operation, destination, gateway_ip, device, initcwnd, initrwnd, restore):
    if restore:
        if destination != 'default' and destination.version == 6:
            old_route = run_command(['ip', '-6', 'r', 'show', str(destination)])
        else: 
            old_route = run_command(['ip', '-4', 'r', 'show', str(destination)])

    if destination == 'default':
        command = ['ip', 'route', str(operation), str(destination)]
    else:
        command = ['ip', '-{}'.format(destination.version), 'route', str(operation), str(destination)]
    if gateway_ip:
       command.extend(['via', str(gateway_ip)])
    if device:
       command.extend(['dev', device])
    if initcwnd:
       command.extend(['initcwnd', str(initcwnd)])
    if initrwnd:
       command.extend(['initrwnd', str(initrwnd)])
    
    run_command(command)

    if restore:
        # Manage SIGTERM and SIGINT signals behavior
        signal.signal(signal.SIGTERM, partial(restore_route, old_route.split(), destination, operation))
        signal.signal(signal.SIGINT, partial(restore_route, old_route.split(), destination, operation))
        # Sleep until a signal is received
        signal.pause()


if __name__ == '__main__':
    with collect_agent.use_configuration('/opt/openbach/agent/jobs/ip_route/ip_route_rstats_filter.conf'):
        # Define Usage
        parser = argparse.ArgumentParser(
                 description=__doc__,
                 formatter_class=argparse.ArgumentDefaultsHelpFormatter
        )

        parser.add_argument(
                'operation', help='choose the operation to apply',
                choices=[
                    Operations.ADD.value,
                    Operations.CHANGE.value,
                    Operations.REPLACE.value,
                    Operations.DELETE.value,
                ],
        )
   
        # Add common optional arguments
        parser.add_argument(
                '-gw', '--gateway_ip', type=ip_address,
                help='ip address of the gateway (this or output device '
                'is required when adding/changing/replacing route)')
        parser.add_argument(
                '-dev', '--device', type=str,
                help='the output device name (this or gateway '
                'is required when adding/changing/replacing route)')
        parser.add_argument(
                '-icwnd', '--initcwnd', type=int, default=0,
                help='initial congestion window size for connections to this destination')
        parser.add_argument(
                '-irwnd', '--initrwnd', type=int, default=0,
                help='initial receive window size for connections to this destination')
        parser.add_argument(
                '-r', '--restore', action='store_true',
                help='restore the previous configuration when the job finishes')
        
        # Sub-commands functionnality to split default route and a route to a network
        subparsers = parser.add_subparsers(
                title='destination',
                dest='destination',
                required=True,
                help='choose the destination')
        
        # Add arguments specific to the default route
        parser_default = subparsers.add_parser('default', help='default route')
        
        # Add arguments specific to a destination network
        parser_dest_ip = subparsers.add_parser('destination_ip', help='route to a destination')
        parser_dest_ip.add_argument(
                'network_ip', type=ip_network,
                help='ip address/mask of the destination network')
          
        # get args
        args = parser.parse_args()
        operation = args.operation
        destination = args.destination
        gateway_ip = args.gateway_ip
        device = args.device
        initcwnd = args.initcwnd
        initrwnd = args.initrwnd
        restore = args.restore
        
        if destination == 'destination_ip':
           destination = args.network_ip
        main(operation, destination, gateway_ip, device, initcwnd, initrwnd, restore)
