#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
   OpenBACH is a generic testbed able to control/configure multiple
   network/physical entities (under test) and collect data from them. It is
   composed of an Auditorium (HMIs), a Controller, a Collector and multiple
   Agents (one for each network entity that wants to be tested).


   Copyright © 2016 CNES


   This file is part of the OpenBACH testbed.


   OpenBACH is a free software : you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free
   Software Foundation, either version 3 of the License, or (at your option)
   any later version.

   This program is distributed in the hope that it will be useful, but WITHOUT
   ANY WARRANTY, without even the implied warranty of MERCHANTABILITY or
   FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
   more details.

   You should have received a copy of the GNU General Public License along with
   this program. If not, see http://www.gnu.org/licenses/.



   @file     openbach.py
   @brief    This script is used by the installer to install/uninstall OpenBACH
             (the Controller, the Collector and the Auditorium)
   @author   Mathias ETTINGER <mathias.ettinger@toulouse.viveris.com>
"""


import os
import sys
from argparse import ArgumentParser, Namespace
import tempfile
import subprocess
import textwrap
from functools import partial


CONFIG_DIR = os.path.join(os.path.dirname(__file__), 'configs')
INSTALL_DIR = os.path.join(os.path.dirname(__file__), 'install')


def set_default(self, name, value):
    if getattr(self, name, None) is None:
        setattr(self, name, value)


# Monkey patch argparse's return value for easier usage
Namespace.set_default = set_default


def build_parser(default_controller_ip):
    parser = ArgumentParser(description='OpenBach (un)installation script')
    parser.add_argument(
            '--controller-ip', metavar='ADDRESS', default=default_controller_ip,
            help='IP Address of the controller [default: {}]'.format(default_controller_ip))
    parser.add_argument(
            '--controller-username', metavar='NAME', default='openbach',
            help='username to connect to the controller [default: openbach]')
    parser.add_argument(
            '--controller-password', metavar='PASSWORD', default='openbach',
            help='plain-text password to connect to the controller [default: openbach]')
    parser.add_argument(
            '--controller-name', metavar='NAME', default='Controller',
            help='name given to the controller machine [default: Controller]')
    parser.add_argument(
            '--collector-ip', metavar='ADDRESS',
            help='IP Address of the collector [default to --controller-ip]')
    parser.add_argument(
            '--collector-username', metavar='NAME',
            help='username to connect to the collector [default to --controller-username]')
    parser.add_argument(
            '--collector-password', metavar='PASSWORD',
            help='plain-text password to connect to the collector [default to --controller-password]')
    parser.add_argument(
            '--collector-name', metavar='NAME',
            help='name given to the collector machine [default to --controller-name]')
    parser.add_argument(
            '--auditorium-ip', metavar='ADDRESS',
            help='IP Address of the auditorium [default to --controller-ip]')
    parser.add_argument(
            '--auditorium-username', metavar='NAME',
            help='username to connect to the auditorium [default to --controller-username]')
    parser.add_argument(
            '--auditorium-password', metavar='PASSWORD',
            help='plain-text password to connect to the auditorium [default to --controller-password]')
    parser.add_argument(
            '--auditorium-name', metavar='NAME',
            help='name given to the auditorium machine [default to --controller-name]')
    parser.add_argument('-p', '--proxy', metavar='ADDRESS',
                        help='set the proxy to use [default: None]')

    subparser = parser.add_subparsers(dest='action', metavar='action')
    subparser.add_parser('install', help='perform installation of OpenBACH machines')
    subparser.add_parser('uninstall', help='uninstall previously installed OpenBACH machines')
    subparser.add_parser('status', help='get the status of OpenBACH on the Controller and Auditorium')

    return parser


def parse_command_line(parser):
    args = parser.parse_args()

    if args.action is None:
        parser.error('missing action')

    return args


def run_command(extra_vars_name, proxy_vars_name, hosts_name, agent, args, skip=False):
    template = textwrap.dedent("""\
        ansible_ssh_user: {{a.{0}_username}}
        ansible_ssh_pass: {{a.{0}_password}}
        ansible_sudo_pass: {{a.{0}_password}}""").format(agent)
    with tempfile.NamedTemporaryFile('w') as extra_vars:
        print(template.format(a=args), file=extra_vars)
        print('collector_ip:', args.collector_ip, file=extra_vars)
        # Flush the file so ansible can read it
        print(file=extra_vars, flush=True)

        arguments = [
            'ansible-playbook', '-i', hosts_name,
            '-e', '@{}/ips'.format(CONFIG_DIR),
            '-e', '@{}/proxy'.format(CONFIG_DIR),
            '-e', '@{}/all'.format(CONFIG_DIR),
            '-e', '@{}'.format(extra_vars.name),
            '-e', '@{}'.format(proxy_vars_name),
        ]

        if extra_vars_name is not None:
            arguments.extend(['-e', '@{}'.format(extra_vars_name)])

        arguments.extend(['{}/{}.yml'.format(INSTALL_DIR, agent), '--tags', args.action])

        if skip:
            arguments.extend(['--skip-tag', 'only-controller'])

        subprocess.check_call(arguments)


def machine_ips():
    try:
        process_output = subprocess.check_output(
            ['hostname', '-I'], stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        process_output = subprocess.check_output(
            ['hostname', '-i'], stderr=subprocess.DEVNULL)
    return process_output.decode().split()


def populate_default_args(args):
    args.set_default('collector_ip', args.controller_ip)
    args.set_default('auditorium_ip', args.controller_ip)
    args.set_default('collector_username', args.controller_username)
    args.set_default('auditorium_username', args.controller_username)
    args.set_default('collector_password', args.controller_password)
    args.set_default('auditorium_password', args.controller_password)
    args.set_default('collector_name', args.controller_name)
    args.set_default('auditorium_name', args.controller_name)


def main(args, is_controller_local):
    if args.action == 'install':
        with tempfile.NamedTemporaryFile('w', delete=False) as extra_vars:
            print('---\n', file=extra_vars)

            template = ("controller:\n"
                        "  - {{ 'ip': '{a.controller_ip}',"
                        " 'username': '{a.controller_username}',"
                        " 'password': '{a.controller_password}',"
                        " 'name': '{a.controller_name}' }}")
            print(template.format(a=args), file=extra_vars)

            t = template.replace('controller', 'collector')
            print(t.format(a=args), file=extra_vars)
        extra_vars_name = extra_vars.name
    else:
        extra_vars_name = None

    with open('{}/proxy'.format(CONFIG_DIR), 'w') as proxy_vars:
        print('---\n', file=proxy_vars)
        print('proxy_env:', file=proxy_vars)
        if args.proxy is not None:
            print('  http_proxy:', args.proxy, file=proxy_vars)
            print('  https_proxy:', args.proxy, file=proxy_vars)
        else:
            print('  {}', file=proxy_vars)

    with tempfile.NamedTemporaryFile('w', delete=False) as hosts:
        print('[Controller]', file=hosts)
        print(args.controller_ip, file=hosts)
        print('[Auditorium]', file=hosts)
        print(args.auditorium_ip, file=hosts)

    with open('{}/ips'.format(CONFIG_DIR), 'w') as ips:
        print('---\n', file=ips)
        print('controller_ip:', "'{}'".format(args.controller_ip), file=ips)
        print('collector_ip:', "'{}'".format(args.collector_ip), file=ips)
        print('auditorium_ip:', "'{}'".format(args.auditorium_ip), file=ips)

    common_command = partial(run_command, extra_vars_name, proxy_vars.name, hosts.name)
    commands = [
        partial(common_command, 'controller', args, is_controller_local),
        partial(common_command, 'auditorium', args),
    ]
    if args.action == 'uninstall':
        commands = reversed(commands)

    try:
        for command in commands:
            command()
    finally:
        os.remove(ips.name)
        os.remove(proxy_vars.name)
        os.remove(hosts.name)
        if extra_vars_name:
            os.remove(extra_vars_name)


if __name__ == '__main__':
    # Check ansible and sshpass versions
    try:
        for program, version, flag in [('ansible', '2.2', '--version'), ('sshpass', '1', '-V')]:
            output = subprocess.run([program, flag], stdout=subprocess.PIPE)
            real_version = output.stdout.split()[1].decode()
            if real_version < version:
                sys.exit('[ERROR] {} should be at least version {}'.format(program, version))
    except FileNotFoundError:
        sys.exit('[ERROR] {} should be installed on the system to run the installer'.format(program))

    ips_list = machine_ips()
    # if controller IP is not specififed, take the first interface IP
    parser = build_parser(ips_list[0])
    args = parse_command_line(parser)
    populate_default_args(args)
    main(args, args.controller_ip in ips_list)
