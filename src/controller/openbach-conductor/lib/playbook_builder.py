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


"""Utilities around Ansible invocation to help and
simplify playbooks building and launching.
"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Adrien THIBAUD <adrien.thibaud@toulouse.viveris.com>
 * Mathias ETTINGER <mathias.ettinger@toulouse.viveris.com>
'''


import os
import atexit
import tempfile
import multiprocessing
from contextlib import suppress
from collections import defaultdict

from ansible.cli import CLI
from ansible.executor.playbook_executor import PlaybookExecutor
from ansible.plugins.callback import CallbackBase

from . import errors


try:
    from ansible import context
except ImportError:
    context = None


class Options:
    """Utility class that mimic a namedtuple or an argparse's Namespace
    so that Ansible can extract out whatever option we pass in.
    """
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)


class PlayResult(CallbackBase):
    """Utility class to hook into the Ansible play process.

    Most of Ansible actions will call one or several methods of
    this class so we can take decision or store error messages
    based on the current execution of a Play.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.failure = defaultdict(list)
        self._context = None

    def set_play_context(self, play_context):
        self._context = play_context

    def raise_for_error(self):
        """Raise an error if something failed during an Ansible Play"""
        if self._context is not None:
            # Clear tags at the end of a play (ansible bug?)
            self._context.only_tags.clear()
            self._context.skip_tags.clear()

        if self.failure:
            raise errors.UnprocessableError(
                    'Ansible playbook execution failed',
                    **self.failure)

    def _store_failure(self, result):
        self.failure[result._host.get_name()].append(result._result)

    # From here on, Ansible hooks definition

    def v2_runner_on_failed(self, result, ignore_errors=False):
        if not ignore_errors:
            self._store_failure(result)

    def v2_runner_on_unreachable(self, result):
        self._store_failure(result)

    def v2_runner_on_async_failed(self, result):
        self._store_failure(result)

    def v2_runner_item_on_failed(self, result):
        self._store_failure(result)


class SetupResult(PlayResult):
    def v2_runner_on_ok(self, result):
        if result._task_fields['action'] in ('setup', 'gather_facts'):
            self.ansible_facts = result._result['ansible_facts']


class SilentResult(PlayResult):
    def raise_for_error(self):
        with suppress(errors.UnprocessableError):
            super().raise_for_error()


class ServicesResult(SilentResult):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.services = defaultdict(dict)

    def v2_runner_on_ok(self, result):
        host = result._host.get_name()
        action = result._task_fields['action']
        if action == 'service_facts':
            self.services[host]['services'] = result._result['ansible_facts']['services']
        elif action in ('command', 'shell') and result._task_fields['args']['_raw_params'].startswith('ntp'):
            self.services[host]['ntp'] = result._result['stdout']


class PlaybookBuilder():
    """Easy Playbook configuration and launching"""

    def __init__(self, agent_address, group_name='agent', username=None, password=None):
        self.inventory_filename = None
        with tempfile.NamedTemporaryFile('w', delete=False) as inventory:
            print('[{}]'.format(group_name), file=inventory)
            print(agent_address, file=inventory)
            self.inventory_filename = inventory.name

        self.passwords = {
                'conn_pass': password,
                'become_pass': password,
        }

        self.options = Options(  # Fill in required default values
                ask_pass=False,
                ask_su_pass=False,
                ask_sudo_pass=False,
                ask_vault_pass=False,
                become=False,
                become_ask_pass=False,
                become_method='sudo',
                become_user='root',
                check=False,
                connection='smart',
                diff=False,
                extra_vars=[],
                flush_cache=None,
                force_handlers=False,
                forks=5,
                inventory=[self.inventory_filename],
                listhosts=None,
                listtags=None,
                listtasks=None,
                module_path=None,
                new_vault_id=None,
                new_vault_password_files=[],
                private_key_file=None,
                remote_user='',
                scp_extra_args='',
                sftp_extra_args='',
                skip_tags=['questions'],
                ssh_common_args='',
                ssh_extra_args='',
                start_at_task=None,
                step=None,
                su=False,
                su_user=None,
                subset=None,
                sudo=False,
                sudo_user=None,
                syntax=None,
                tags=['all'],
                timeout=10,
                vault_ids=[],
                vault_password_files=[],
                verbosity=0,
        )
        if username is None:
            self.options.remote_user = 'openbach'
            self.options.private_key_file = '/home/openbach/.ssh/id_rsa'
        else:
            self.options.remote_user = username

        if context is None:
            self.loader, self.inventory, self.variables = CLI._play_prereqs(self.options)
        else:
            context._init_global_context(self.options)
            self.loader, self.inventory, self.variables = CLI._play_prereqs()

    def __del__(self):
        """Remove the Inventory file when this object is garbage collected"""
        if self.inventory_filename is not None:
            os.remove(self.inventory_filename)

    def add_variables(self, **kwargs):
        """Add extra_vars for the current playbook execution.

        Equivalent to using multiple -e with key=value pairs
        on the Ansible command line.
        """
        if context is None:
            variables = self.variables.extra_vars
            variables.update(kwargs)
            self.variables.extra_vars = variables
        else:
            self.variables.extra_vars.update(kwargs)

    def launch_playbook(self, play_name, playbook_results=None, session_cookie=None):
        """Actually run the configured Playbook.

        Check that the configuration is valid before doing so
        and raise a ConductorError if not.
        """
        playbook = '/opt/openbach/controller/ansible/{}.yml'.format(play_name)
        if session_cookie is not None:
            self.add_variables(session_cookie=session_cookie)
        if playbook_results is None:
            playbook_results = PlayResult()

        tasks_parameters = dict(
                playbooks=[playbook],
                inventory=self.inventory,
                variable_manager=self.variables,
                loader=self.loader,
                passwords=self.passwords,
        )
        if context is None:
            tasks_parameters.update(options=self.options)
        tasks = PlaybookExecutor(**tasks_parameters)
        tasks._tqm._callback_plugins.append(playbook_results)
        tasks.run()
        playbook_results.raise_for_error()

    @classmethod
    def install_collector(cls, collector, name, username=None, password=None, cookie=None):
        self = cls(collector['address'], 'collector', username, password)
        self.add_variables(
                openbach_name=name,
                openbach_rstats_port=1111,
                openbach_agent_port=1112,
                openbach_collector=collector['address'],
                logstash_logs_port=collector['logs_port'],
                logstash_stats_port=collector['stats_port'],
                logstash_stats_mode=collector['stats_mode'],
                elasticsearch_port=collector['logs_query_port'],
                elasticsearch_cluster_name=collector['logs_database_name'],
                influxdb_port=collector['stats_query_port'],
                influxdb_database_name=collector['stats_database_name'],
                influxdb_database_precision=collector['stats_database_precision'],
                auditorium_broadcast_mode=collector['logstash_broadcast_mode'],
                auditorium_broadcast_port=collector['logstash_broadcast_port'])
        self.launch_playbook('install', session_cookie=cookie)

    @classmethod
    def uninstall_collector(cls, collector, cookie=None):
        self = cls(collector['address'], group_name='collector')
        self.add_variables(
                openbach_collector=collector['address'],
                openbach_rstats_port=1111,
                openbach_agent_port=1112,
                logstash_logs_port=collector['logs_port'],
                logstash_stats_port=collector['stats_port'],
                logstash_stats_mode=collector['stats_mode'],
                elasticsearch_port=collector['logs_query_port'],
                elasticsearch_cluster_name=collector['logs_database_name'],
                influxdb_port=collector['stats_query_port'],
                influxdb_database_name=collector['stats_database_name'],
                influxdb_database_precision=collector['stats_database_precision'],
                auditorium_broadcast_mode=collector['logstash_broadcast_mode'],
                auditorium_broadcast_port=collector['logstash_broadcast_port'])
        self.launch_playbook('uninstall', session_cookie=cookie)

    @classmethod
    def install_agent(cls, address, name, port, rstats_port, collector, username=None, password=None, cookie=None):
        self = cls(address, username=username, password=password)
        self.add_variables(
                openbach_name=name,
                openbach_rstats_port=rstats_port,
                openbach_agent_port=port,
                openbach_collector=collector['address'],
                logstash_logs_port=collector['logs_port'],
                logstash_stats_port=collector['stats_port'],
                logstash_stats_mode=collector['stats_mode'],
                elasticsearch_port=collector['logs_query_port'],
                elasticsearch_cluster_name=collector['logs_database_name'],
                influxdb_port=collector['stats_query_port'],
                influxdb_database_name=collector['stats_database_name'],
                influxdb_database_precision=collector['stats_database_precision'],
                auditorium_broadcast_mode=collector['logstash_broadcast_mode'],
                auditorium_broadcast_port=collector['logstash_broadcast_mode'])
        self.launch_playbook('install', session_cookie=cookie)

    @classmethod
    def uninstall_agent(cls, address, collector, jobs=None, cookie=None):
        self = cls(address)
        if jobs is not None:
            self.add_variables(jobs=jobs)
        self.add_variables(
                openbach_collector=collector['address'],
                logstash_logs_port=collector['logs_port'],
                logstash_stats_port=collector['stats_port'],
                logstash_stats_mode=collector['stats_mode'],
                elasticsearch_port=collector['logs_query_port'],
                elasticsearch_cluster_name=collector['logs_database_name'],
                influxdb_port=collector['stats_query_port'],
                influxdb_database_name=collector['stats_database_name'],
                influxdb_database_precision=collector['stats_database_precision'],
                auditorium_broadcast_mode=collector['logstash_broadcast_mode'])
        self.launch_playbook('uninstall', session_cookie=cookie)

    @classmethod
    def check_connection(cls, address, port=1111, restart=False, cookie=None):
        self = cls(address)
        self.add_variables(
                openbach_restart=restart,
                openbach_agent_port=port)
        self.launch_playbook('check_connection', session_cookie=cookie)

    @classmethod
    def check_connections(cls, *addresses, cookie=None):
        self = cls('\n'.join(addresses))
        self.options.forks = len(addresses)
        self.add_variables(collect_metrics=True)
        playbook_results = ServicesResult()
        self.launch_playbook('check_connection', playbook_results, session_cookie=cookie)
        return playbook_results.failure, playbook_results.services

    @classmethod
    def assign_collector(cls, address, port, collector, cookie=None):
        self = cls(address)
        self.add_variables(
                collector_ip=collector['address'],
                logstash_logs_port=collector['logs_port'],
                elasticsearch_port=collector['logs_query_port'],
                logstash_stats_port=collector['stats_port'],
                logstash_stats_mode=collector['stats_mode'],
                openbach_agent_port=port,
                influxdb_port=collector['stats_query_port'],
                influxdb_database_name=collector['stats_database_name'],
                influxdb_database_precision=collector['stats_database_precision'])
        self.launch_playbook('assign_collector', session_cookie=cookie)

    @classmethod
    def install_job(cls, address, collector_ip, logs_port, job_name, job_path, cookie=None):
        self = cls(address)
        self.add_variables(
                openbach_collector=collector_ip,
                logstash_logs_port=logs_port,
                jobs=[{'name': job_name, 'path': job_path}])
        self.launch_playbook('install_a_job', session_cookie=cookie)

    @classmethod
    def uninstall_job(cls, address, collector_ip, job_name, job_path, cookie=None):
        self = cls(address)
        self.add_variables(
                openbach_collector=collector_ip,
                jobs=[{'name': job_name, 'path': job_path}])
        self.launch_playbook('uninstall_a_job', session_cookie=cookie)

    @classmethod
    def enable_logs(cls, address, collector, job, severity=None, local_severity=None, cookie=None):
        self = cls(address)
        self.add_variables(job=job)
        if severity is not None:
            self.add_variables(
                    syslogseverity=severity,
                    collector_ip=collector['address'],
                    logstash_logs_port=collector['logs_port'])
        if local_severity is not None:
            self.add_variables(syslogseverity_local=local_severity)
        self.launch_playbook('enable_logs', session_cookie=cookie)

    @classmethod
    def push_file(cls, address, parameters, restart_services=False, cookie=None):
        self = cls(address)
        self.add_variables(
                copy_parameters=parameters,
                restart_services=restart_services)
        self.launch_playbook('push_files', session_cookie=cookie)

    @classmethod
    def pull_file(cls, address, parameters, restart_services=False, cookie=None):
        self = cls(address)
        self.add_variables(
                copy_parameters=parameters,
                restart_services=restart_services)
        self.launch_playbook('pull_files', session_cookie=cookie)

    @classmethod
    def fetch_file(cls, address, archive_prefix, local_path, remote_paths, cookie=None):
        self = cls(address)
        self.add_variables(
                local_path=local_path,
                remote_paths=remote_paths,
                archive_prefix=archive_prefix)
        self.launch_playbook('fetch_files', session_cookie=cookie)

    @classmethod
    def gather_facts(cls, address, cookie=None):
        self = cls(address)
        playbook_results = SetupResult()
        self.launch_playbook('check_connection', playbook_results, session_cookie=cookie)
        return playbook_results.ansible_facts

    @classmethod
    def enable_controller_access(cls, address, username=None, password=None, cookie=None):
        self = cls(address, username=username, password=password)
        self.add_variables(openbach_controller_key_state='present')
        self.launch_playbook('controller_access', session_cookie=cookie)

    @classmethod
    def disable_controller_access(cls, address, cookie=None):
        self = cls(address)
        self.add_variables(openbach_controller_key_state='absent')
        self.launch_playbook('controller_access', session_cookie=cookie)

    @classmethod
    def reboot(cls, address, kernel=None, cookie=None):
        self = cls(address)
        if kernel is not None:
            self.add_variables(kernel=kernel)
        self.launch_playbook('reboot', session_cookie=cookie)

    @classmethod
    def manage_retention_policies(cls, address, openbach_influx_database, influxdb_port, cookie=None):
        self = cls(address)
        self.add_variables(openbach_influx_database=openbach_influx_database)
        self.add_variables(influxdb_port=influxdb_port)
        self.launch_playbook('manage_retention_policies', session_cookie=cookie)

def _run_playbook(queue):
    running_playbooks = set()

    while True:
        check_error = None
        action = queue.get()
        if action is None:
            for playbook in running_playbooks:
                playbook.join()
            return

        try:
            pipe, order, args, kwargs = action
        except ValueError as e:
            check_error = errors.ConductorError(
                    'Playbook manager received the wrong '
                    'number of arguments: {}'.format(e))
        else:
            try:
                # Get the desired method
                play = getattr(PlaybookBuilder, order)
                # and check is it a classmethod
                cls = play.__self__
            except AttributeError:
                check_error = errors.ConductorError(
                        'Unknow playbook builder method '
                        '\'{}\''.format(order))
            else:
                if cls != PlaybookBuilder:
                    check_error = errors.ConductorError(
                            'Playbook builder method {} '
                            'is not a classmethod'.format(order))

        if check_error is not None:
            _terminate_playbook(pipe, check_error.json)
        else:
            play_book = multiprocessing.Process(
                    target=_execute_playbook,
                    args=(play, pipe, args, kwargs))
            play_book.start()
            running_playbooks.add(play_book)

        _clean_finished_playbooks(running_playbooks)


def _clean_finished_playbooks(playbooks):
    for playbook in playbooks:
        playbook.join(0.05)
    terminated = [playbook for playbook in playbooks if not playbook.is_alive()]
    for playbook in terminated:
        playbooks.remove(playbook)


def _execute_playbook(method, pipe, args, kwargs):
    try:
        result = method(*args, **kwargs)
    except errors.ConductorError as e:
        _terminate_playbook(pipe, e.json)
    except Exception as e:
        error = errors.ConductorError(str(e))
        import traceback
        error.error['traceback'] = traceback.format_exc()
        _terminate_playbook(pipe, error.json)
    else:
        _terminate_playbook(pipe, result)


def _terminate_playbook(pipe, error=None):
    pipe.send(error)
    pipe.close()


def start_playbook(name, *args, **kwargs):
    parent_conn, child_conn = multiprocessing.Pipe()
    _COMMUNICATOR.put((child_conn, name, args, kwargs))
    result = parent_conn.recv()
    if result is not None and 'response' in result and 'returncode' in result:
        raise errors.ConductorError.copy_from(result)
    return result


def setup_playbook_manager():
    playbook_manager = multiprocessing.Process(
            target=_run_playbook, args=(_COMMUNICATOR,))
    playbook_manager.start()
    atexit.register(playbook_manager.join)
    atexit.register(_COMMUNICATOR.put, None)


_COMMUNICATOR = multiprocessing.Queue()
