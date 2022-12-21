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


"""Helper tools to simplify the writing of models and views"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Adrien THIBAUD <adrien.thibaud@toulouse.viveris.com>
 * Mathias ETTINGER <mathias.ettinger@toulouse.viveris.com>
'''


import os
import enum
import json
import shlex
import socket
import syslog
import pathlib
import tempfile
import ipaddress


class BadRequest(Exception):
    """Custom exception raised when parsing of a request failed"""
    def __init__(self, reason, returncode=400, infos=None,
                 severity=syslog.LOG_ERR):
        super().__init__(reason)
        self.reason = reason
        self.returncode = returncode
        if infos:
            self.infos = infos
        else:
            self.infos = {}
        syslog.syslog(severity, self.reason)


def send_fifo(message, local_port=1113):
    """Communicate a message on the given port of the local
    machine through a socket and a FIFO file.

    Opens a FIFO and write the message to it, then send to
    the other end the path to that FIFO. Wait for the other
    end to write back a result and return it to the caller.
    """
    with socket.create_connection(('localhost', local_port)) as conductor:
        with tempfile.NamedTemporaryFile('w') as f:
            fifoname = f.name
        try:
            os.mkfifo(fifoname)
        except OSError as e:
            raise BadRequest('Can not create FIFO file', 400, {'error': e})
        os.chmod(fifoname, 0o666)
        conductor.send(json.dumps({'fifoname': fifoname}).encode())
        with open(fifoname, 'w') as fifo:
            fifo.write(json.dumps(message))
        conductor.recv(16)  # Any response indicates end of processing

    with open(fifoname, 'r') as fifo:
        msg = fifo.read()
    os.remove(fifoname)
    return msg


def nullable_json(model):
    """Return the json attribute of a model, or None if no model"""
    if model is None:
        return None
    return model.json


def extract_models(cls):
    """Generate each sub-model out of a base Django's model class.

    Does not generate models that are marked abstract as they don't
    have any database representation.
    """
    for sub_class in cls.__subclasses__():
        if not sub_class._meta.abstract:
            yield sub_class
        yield from extract_models(sub_class)


def extract_integer(container, name, *, default=None):
    """Extract a field named `name` from the given container and
    tries to convert it to an integer.

    Return the default value if the field is not present or an
    integer otherwise. Raise ValueError on failure.
    """
    try:
        value = container[name]
    except KeyError:
        return default
    else:
        try:
            return int(value)
        except ValueError:
            raise ValueError(name) from None


def subcommand_names(subcommand):
    """Generate all names of subcommands for a job
    up to the given subcommand.
    """
    if subcommand.name is None:
        return

    yield from subcommand_names(subcommand.group.subcommand)
    yield subcommand.name


def subcommand_storage(subcommand, storage):
    """Create intermediate dictionaries, if needed, in the
    provided storage for all intermediate subcommands of
    a given job up to the given subcommand.

    Return the dictionary associated to the given subcommand.
    """
    for name in subcommand_names(subcommand):
        storage = storage.setdefault(name, {})

    return storage


def subcommands(job):
    """Generate a depth-first traversal of all the
    subcommands of the given job.
    """
    def inner(command):
        yield command
        for group in command.groups.all():
            for subcommand in group.subcommands.all():
                yield from inner(subcommand)

    subcommand, _ = job.subcommands.get_or_create(group=None)
    yield from inner(subcommand)


def user_to_json(user):
    if user is None or not user.is_authenticated:
        return {
                'username': None,
                'name': None,
                'first_name': None,
                'last_name': None,
                'is_user': False,
                'is_admin': False,
                'email': None,
                'favorites': {},
        }

    favorites = {}
    for project_name, scenario_name in user.favorites.values_list('project__name', 'name'):
        favorites.setdefault(project_name, []).append(scenario_name)

    return {
            'username': user.get_username(),
            'name': user.get_full_name(),
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_user': user.is_active,
            'is_admin': user.is_staff,
            'email': user.email,
            'favorites': favorites,
    }


def build_storage_path(path):
    storage = pathlib.Path(path)
    if storage.is_absolute():
        storage = storage.relative_to(storage.anchor)
    return '/opt/openbach/controller/files/' / storage
