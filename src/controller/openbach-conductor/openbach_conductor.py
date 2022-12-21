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


"""OpenBACH's core decision center.

The conductor is responsible to check that requests conveyed by the
backend are complete and well formed. If they do, appropriate actions
are then performed to fulfill them and return meaningful result to
the backend.

Messages are received from and send to the backend by the means of
a FIFO file so any amount of data can easily be transfered.
"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Adrien THIBAUD <adrien.thibaud@toulouse.viveris.com>
 * Mathias ETTINGER <mathias.ettinger@toulouse.viveris.com>
 * Joaquin MUGUERZA <joaquin.muguerza@toulouse.viveris.com>
 * Léa THIBOUT <lea.thibout@viveris.fr>
'''


import os
import json
import syslog
import traceback
import socketserver
from contextlib import suppress

from lib import errors
from lib.playbook_builder import setup_playbook_manager

# We need to use ansible from Python code so we can easily get failure
# messages. But its forking behaviour is causing troubles with Django
# (namely, closing database connections at the end of the forked
# process). So we setup a fork here before any of the Django stuff so
# connections are not shared with ansible workers.
setup_playbook_manager()

# We need to create a WSGI application before we
# can benefit from Django's access to databases
from django.core.wsgi import get_wsgi_application
from django.core import signals
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
application = get_wsgi_application()

from lib import openbach_conductor
from lib.utils import OpenbachJSONEncoder
from openbach_django.models import ScenarioInstance, CommandResult, InstalledJobCommandResult


syslog.openlog('openbach_conductor', syslog.LOG_PID, syslog.LOG_USER)


def class_from_name(name):
    """Return the class of this module whose name is given"""
    candidate = getattr(openbach_conductor, name)
    with suppress(TypeError):
        if issubclass(candidate, openbach_conductor.ConductorAction):
            return candidate
    raise AttributeError


class ConductorServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    """Choose the underlying technology for our sockets servers"""
    allow_reuse_address = True


class BackendHandler(socketserver.BaseRequestHandler):
    def finish(self):
        """Close the connection after handling a request"""
        self.request.close()

    def handle(self):
        """Handle message comming from the backend"""

        fifo_infos = self.request.recv(4096).decode()
        fifoname = json.loads(fifo_infos)['fifoname']
        with open(fifoname) as fifo:
            request = json.loads(fifo.read())

        try:
            response, returncode = self.execute_request(request)
        except errors.ConductorError as e:
            result = e.json
            is_warning = isinstance(e, errors.ConductorWarning)
            log_level = syslog.LOG_WARNING if is_warning else syslog.LOG_ERR
            syslog.syslog(log_level, '{}'.format(result))
        except Exception as e:
            result = {
                    'response': {
                        'message': 'Unexpected exception appeared',
                        'error': str(e),
                        'traceback': traceback.format_exc(),
                    },
                    'returncode': 500,
            }
            syslog.syslog(syslog.LOG_ALERT, '{}'.format(result))
        else:
            result = {'response': response, 'returncode': returncode}
            syslog.syslog(syslog.LOG_INFO, '{}'.format(result))
        finally:
            self.request.sendall(b'Done')
            with open(fifoname, 'w') as fifo:
                json.dump(result, fifo, cls=OpenbachJSONEncoder)
            signals.request_finished.send(sender=self.__class__)

    def execute_request(self, request):
        """Analyze the data received to execute the right action"""
        request_name = request.pop('command')
        user_name = request.pop('_username')
        command_name = ''.join(map(str.title, request_name.split('_')))
        print('\n#', '-' * 76, '#')
        print('Executing the command', command_name, 'with parameters', request)
        try:
            command_cls = class_from_name(command_name)
        except AttributeError:
            raise errors.ConductorError(
                    'A Function is not implemented',
                    function_name=command_name)

        command = command_cls(**request)
        command.configure_user(user_name)
        return command.action()


def clear_jobs_statuses():
    """Clear out jobs (un)install statuses upon reboot.

    This avoids old jobs (un)installation processes to be left in
    unupdateable state while new jobs (un)installation wait for
    them to complete.
    """
    CommandResult.objects.filter(pk__in=InstalledJobCommandResult.objects.filter(status_install__returncode=202).values('status_install')).update(returncode=500, response='{"state":"Controller restarted while installing"}')
    CommandResult.objects.filter(pk__in=InstalledJobCommandResult.objects.filter(status_uninstall__returncode=202).values('status_uninstall')).update(returncode=500, response='{"state":"Controller restarted while uninstalling"}')


def main(address='localhost', port=1113):
    clear_jobs_statuses()

    backend_server = ConductorServer((address, port), BackendHandler)
    try:
        backend_server.serve_forever()
    finally:
        backend_server.server_close()


if __name__ == '__main__':
    main()
