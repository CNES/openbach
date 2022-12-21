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


"""Means of sending orders to the Agents"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Adrien THIBAUD <adrien.thibaud@toulouse.viveris.com>
 * Mathias ETTINGER <mathias.ettinger@toulouse.viveris.com>
'''


import json
import struct
import socket

from . import errors


DEFAULT_UNIX_DOMAIN = '/opt/openbach/controller/socket'


def receive_all(socket, amount):
    buffer = bytearray(amount)
    view = memoryview(buffer)
    while amount > 0:
        received = socket.recv_into(view[-amount:])
        if not received:
            break
        amount -= received
    return buffer


class _BaseSocketCommunicator:
    def __init__(self, address, family, kind=socket.SOCK_STREAM):
        self.socket = None
        self._address = address
        self._family = family
        self._kind = kind
        self._init()

    def __del__(self):
        self._delete()

    def _init(self):
        try:
            self.socket = socket.socket(self._family, self._kind)
            self.socket.settimeout(2)
            self.socket.connect(self._address)
        except socket.timeout as e:
            raise errors.UnreachableError(
                    'Cannot connect socket to its destination {}: {}'
                    .format(self._address, e))
        except OSError as e:
            raise errors.UnprocessableError(
                    'Cannot connect socket to its destination {}: {}'
                    .format(self._address, e))

    def _delete(self):
        if self.socket is not None:
            self.socket.shutdown(socket.SHUT_RDWR)
            self.socket.close()

    def refresh(self):
        self._delete()
        self._init()
        return self

    def receive_message(self):
        size = receive_all(self.socket, 4)
        length, = struct.unpack('>I', size)
        response = receive_all(self.socket, length)
        actual_length = len(response)
        if actual_length != length:
            raise errors.UnreachableError(
                    'Response from the socket truncated at {} bytes instead of the expected {}'
                    .format(actual_length, length))
        return response

    def send_message(self, message):
        length = struct.pack('>I', len(message))
        self.socket.sendall(length)
        self.socket.sendall(message)

    def communicate(self, message):
        message = message.encode()
        try:
            for _ in range(3):
                try:
                    self.send_message(message)
                except socket.timeout as sock_timeout:
                    st = sock_timeout
                else:
                    return self.receive_message()
        except OSError as e:
            raise errors.UnreachableError(
                    'Sending message through the socket {} failed: {}'
                    .format(self.socket, e))
        raise errors.UnreachableError(
                'Sending message through the socket {} failed: {}'
                .format(self.socket, st))


class OpenBachBaton(_BaseSocketCommunicator):
    def __init__(self, agent_ip, agent_port=1112):
        address = (agent_ip, agent_port)
        super().__init__(address, socket.AF_INET)

    def communicate(self, json_message):
        message = json.dumps(json_message)
        response = super().communicate(message).decode()

        try:
            message = json.loads(response)
        except json.JSONDecodeError:
            raise errors.UnprocessableError(
                    'The agent did not send a JSON response',
                    agent_message=response)
        try:
            status = message['status']
        except KeyError:
            raise errors.UnprocessableError(
                    'The agent did not send the status '
                    'of the command in its JSON response',
                    agent_message=message)

        if status != 'OK':
            raise errors.UnprocessableError(
                    'The agent did not send a success message',
                    agent_message=message)

        return message.get('result')

    def start_job_instance(self, job_name, job_id, scenario_id, owner_id, arguments, date=None, interval=None):
        message = {
                'command_name': 'start_job_instance_agent',
                'command_arguments': {
                    'name': job_name,
                    'instance_id': job_id,
                    'scenario_id': scenario_id,
                    'owner_id': owner_id,
                    'date': date,
                    'interval': interval,
                    'arguments': arguments,
                },
        }
        return self.communicate(message)

    def stop_job_instance(self, job_name, job_id, date='now'):
        message = {
                'command_name': 'stop_job_instance_agent',
                'command_arguments': {
                    'name': job_name,
                    'instance_id': job_id,
                    'date': date,
                },
        }
        return self.communicate(message)

    def restart_job_instance(self, job_name, job_id, scenario_id, owner_id, arguments, date=None, interval=None):
        message = {
                'command_name': 'restart_job_instance_agent',
                'command_arguments': {
                    'name': job_name,
                    'instance_id': job_id,
                    'scenario_id': scenario_id,
                    'owner_id': owner_id,
                    'date': date,
                    'interval': interval,
                    'arguments': arguments,
                },
        }
        return self.communicate(message)

    def status_job_instance(self, job_name, job_id):
        message = {
                'command_name': 'status_job_instance_agent',
                'command_arguments': {
                    'name': job_name,
                    'instance_id': job_id,
                },
        }
        return self.communicate(message)

    def list_jobs(self):
        message = {
                'command_name': 'status_jobs_agent',
                'command_arguments': {},
        }
        return self.communicate(message)

    def add_job(self, job_name):
        message = {
                'command_name': 'add_job_agent',
                'command_arguments': {
                    'name': job_name,
                },
        }
        return self.communicate(message)

    def remove_job(self, job_name):
        message = {
                'command_name': 'del_job_agent',
                'command_arguments': {
                    'name': job_name,
                },
        }
        return self.communicate(message)

    def restart_agent(self):
        message = {
                'command_name': 'restart_agent',
                'command_arguments': {},
        }
        return self.communicate(message)

    def check_connection(self):
        message = {
                'command_name': 'check_connection',
                'command_arguments': {},
        }
        return self.communicate(message)

    def change_collector(self, address, logs_port, logs_query, stats_port, stats_query, stats_database, stats_precision):
        message = {
                'command_name': 'change_collector',
                'command_arguments': {
                    'address': address,
                    'logs': {
                        'port': logs_port,
                        'query': logs_query,
                    },
                    'stats': {
                        'port': stats_port,
                        'query': stats_query,
                        'database': stats_database,
                        'precision': stats_precision,
                    },
                },
        }
        return self.communicate(message)


class OpenBachClapperBoard(_BaseSocketCommunicator):
    def __init__(self, domain=DEFAULT_UNIX_DOMAIN):
        super().__init__(domain, socket.AF_UNIX)

    def communicate(self, **message):
        try:
            username = self.connected_user.get_username()
        except AttributeError:
            username = None
        message['user_name'] = username

        payload = super().communicate(json.dumps(message))
        if payload:
            response = json.loads(payload.decode())
            try:
                return_code = response['returncode']
                response = response['response']
            except KeyError:
                raise errors.UnprocessableError(
                        'Sending message through the socket {} '
                        'did not return a complete response'
                        .format(self.socket))
            return response, return_code

        raise errors.UnprocessableError(
                'Sending message through the socket {} did '
                'not return a response'.format(self.socket))

    def start_scenario_instance(self, scenario_instance_id):
        return self.communicate(action='start', scenario=scenario_instance_id)

    def stop_scenario_instance(self, scenario_instance_id):
        return self.communicate(action='stop', scenario=scenario_instance_id)

    def pause_scenario_instance(self, scenario_instance_id):
        return self.communicate(action='pause', scenario=scenario_instance_id)

    def resume_scenario_instance(self, scenario_instance_id):
        return self.communicate(action='resume', scenario=scenario_instance_id)
