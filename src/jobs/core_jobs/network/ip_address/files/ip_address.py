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


"""Sources of the Job ip_address"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Aurélien DELRIEU <aurelien.delrieu.fr>
'''

import os
import sys
import syslog
import argparse
import traceback
import ipaddress
import contextlib
from enum import Enum

import subprocess

import collect_agent


class Operations(Enum):
    ADD='add'
    DELETE='delete'
    FLUSH='flush'


def main(operation, iface, address_mask=None):
    command = ['ip', 'address', operation]
    if address_mask is not None:
        command.append(str(address_mask))
    command.extend([ 'dev', str(iface)])
    
    try:
        p = subprocess.run(command, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError as ex:
        message = 'ERROR: {}'.format(ex)
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)
    if p.returncode:
        error = p.stderr.decode()
        if any(
                err in error
                for err in {'File exists', 'No such process'}
                ):
            message = 'WARNING: {} exited with non-zero return value ({}): {}'.format(
                command, p.returncode, error)
            collect_agent.send_log(syslog.LOG_WARNING, message)
            sys.exit(0)
        else:
            message = 'ERROR: {} exited with non-zero return value ({})'.format(
                command, p.returncode)
            collect_agent.send_log(syslog.LOG_ERR, message)
            sys.exit(message)
    else:
        collect_agent.send_log(
                syslog.LOG_DEBUG,
                '{} address {} to iface {}'.format(operation, address_mask, iface))


def ip_address_mask(text):
    addr_net = ipaddress.ip_network(text, False)
    return text


if __name__ == '__main__':
    with collect_agent.use_configuration('/opt/openbach/agent/jobs/ip_address/ip_address_rstats_filter.conf'):
        # Define Usage
        parser = argparse.ArgumentParser(
                 description=__doc__,
                 formatter_class=argparse.ArgumentDefaultsHelpFormatter)

        parser.add_argument(
                'interface',
                type=str,
                help='network interface to configure')

        operation_cmd = parser.add_subparsers(
                dest='operation', metavar='operation',
                help='choose the operation to apply')
        operation_cmd.required = True

        add_parser = operation_cmd.add_parser(
                Operations.ADD.value,
                help='add an IP address to an interface')
        delete_parser = operation_cmd.add_parser(
                Operations.DELETE.value,
                help='remove an IP address from an interface')
        flush_parser = operation_cmd.add_parser(
                Operations.FLUSH.value,
                help='flush IP addresses of an interface')

        for p in [add_parser, delete_parser]:
            p.add_argument(
                    'address_mask',
                    type=ip_address_mask,
                    help='ip address/mask to set to the network interface')
   
        # get args
        args = parser.parse_args()
        operation = Operations(args.operation)
        main(args.operation, args.interface, args.address_mask if operation is Operation.FLUSH else None)
