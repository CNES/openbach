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

from __future__ import (absolute_import, division, print_function)
__metaclass__ = type

import sys
import tty
import errno
import termios
import textwrap
from os import isatty
from contextlib import contextmanager

from ansible.module_utils.six import PY3
from ansible.module_utils._text import to_text, to_bytes
from ansible.errors import AnsibleError
from ansible.plugins.action import ActionBase
from ansible.plugins.filter.core import from_yaml

try:
    from __main__ import display
except ImportError:
    from ansible.utils.display import Display
    display = Display()


def display_message(message, color=None):
    msg = to_bytes(message, encoding=display._output_encoding(stderr=False))
    if PY3:
        msg = to_text(msg, display._output_encoding(stderr=False), errors='replace')

    sys.stdout.write(msg)
    try:
        sys.stdout.flush()
    except IOError as e:
        if e.errno != errno.EPIPE:
            raise


@contextmanager
def terminal_context(stream):
    try:
        fd = stream.fileno()
    except (ValueError, AttributeError):
        raise AnsibleError('cannot ask user for credentials: stdin is closed!')

    if not isatty(fd):
        raise AnsibleError('cannot ask user for credentials: stdin is not a tty!')

    old_settings = None
    try:
        old_settings = termios.tcgetattr(fd)
        tty.setraw(fd)
        yield fd
    finally:
        if old_settings is not None:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)


def get_user_input(prompt, stream):
    user_input = b''
    display_message(prompt)
    termios.tcflush(stream, termios.TCIFLUSH)
    while True:
        try:
            key_pressed = stream.read(1)
            if key_pressed == b'\x03':
                raise KeyboardInterrupt
            if key_pressed in (b'\r', b'\n'):
                display_message('\r\n')
                return user_input
            else:
                user_input += key_pressed
        except KeyboardInterrupt:
            raise AnsibleError('user requested abort!')


class ActionModule(ActionBase):
    def run(self, tmp=None, task_vars=None):
        if PY3:
            stdin = self._connection._new_stdin.buffer
        else:
            stdin = self._connection._new_stdin

        if task_vars is None:
            task_vars = dict()

        result = super(ActionModule, self).run(tmp, task_vars)
        environment_string = self._compute_environment_string()

        args = self._task.args
        result['invocation'] = dict(module_args=args)
        try:
            cmd = '{} {} shell'.format(environment_string, args['manager'])
        except KeyError:
            result['failed'] = True
            result['changed'] = False
            result['msg'] = u'missing required arguments: manager'
            return result
        if 'extra_args' in args:
            cmd = '{} {}'.format(cmd, args['extra_args'])
        cacheable = bool(args.pop('cacheable', False))
        username = task_vars.get('openbach_backend_admin_name')

        # Retrieving the list of admin members
        # to check if we need to create it or not
        available_users = self.remote_shell(result, cmd, """\
                from django.contrib.auth.models import User
                users = User.objects.all().only('username').values_list('username')
                print([u for u, in users])""")

        if username is not None:
            user_provided_username = True
            create_superuser = username not in available_users
        else:
            user_provided_username = False
            create_superuser = not available_users

            if create_superuser:
                display_message(
                        'OpenBACH needs that an administrator is '
                        'created before further processing\r\n')
            else:
                display_message('Please select a user to become OpenBACH administrator\r\n')

            # Ask the user the name of the admin to use
            while True:
                with terminal_context(stdin) as fd:
                    settings = termios.tcgetattr(fd)
                    no_echo = settings[3]
                    settings[3] = (no_echo | termios.ECHO) & ~termios.ECHOCTL
                    termios.tcsetattr(fd, termios.TCSADRAIN, settings)
                    username = get_user_input('username: ', stdin)
                    username = to_text(username, errors='surrogate_or_strict')

                    if create_superuser or username in available_users:
                        break

                    settings[3] = no_echo
                    termios.tcsetattr(fd, termios.TCSADRAIN, settings)
                    display_message('This user does not exist, create it? [Y/n] \r\n')
                    termios.tcflush(stdin, termios.TCIFLUSH)
                    if stdin.read(1).lower() != b'n':
                        create_superuser = True
                        break

        # Ask the user the password for the provided user
        # if they didn't already provided it
        password = None
        if user_provided_username:
            password = task_vars.get('openbach_backend_admin_password')
            if password is None:
                display_message(
                        'You chose to use the user \'{}\' for '
                        'administrative purposes\r\n'.format(username))
        if password is None:
            with terminal_context(stdin) as fd:
                password = get_user_input('password: ', stdin)
                password = to_text(password, errors='surrogate_or_strict')

        # Make sure that the provided username:
        #  - is created;
        #  - has the provided password;
        #  - is admin.
        changed, = self.remote_shell(result, cmd, """\
                from django.contrib.auth.models import User
                user = User.objects.filter(username='{0}').last()
                changed = user is None or (not user.check_password('{1}') or not user.is_active or not user.is_staff)
                _ = user is None and User.objects.create_superuser('{0}', '', '{1}')
                _ = changed and user is not None and user.set_password('{1}')
                _ = changed and user is not None and setattr(user, 'is_active', True)
                _ = changed and user is not None and setattr(user, 'is_staff', True)
                _ = changed and user is not None and user.save()
                print([changed])
                """.format(username.replace("'", "\\'"), password.replace("'", "\\'")))

        result['changed'] = changed
        if result['rc']:
            result['failed'] = True
            result['msg'] = u'cannot manage user \'{}\' in the database'.format(username)
            return result

        facts = dict(
                openbach_backend_admin_name=username,
                openbach_backend_admin_password=password,
        )

        result['msg'] = u'user \'{}\' is an administrator'.format(username)
        result['failed'] = False
        result['ansible_facts'] = facts
        result['ansible_facts_cacheable'] = cacheable
        return result

    def remote_shell(self, result, command, piped_data):
        data = ';'.join(textwrap.dedent(piped_data).splitlines())
        shell = self._low_level_execute_command(command, in_data=data)
        result.update(shell)
        result['stderr_lines'] = shell['stderr'].splitlines()
        return from_yaml(shell['stdout'].strip('> \n'))
