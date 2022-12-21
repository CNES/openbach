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


"""The Control-Agent (with the scheduling part)"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Adrien THIBAUD <adrien.thibaud@toulouse.viveris.com>
 * Mathias ETTINGER <mathias.ettinger@toulouse.viveris.com>
'''


import os
import sys
import time
import json
import shlex
import struct
import signal
import random
import platform
import threading
import traceback
import socketserver
from pathlib import Path
from datetime import datetime
from subprocess import DEVNULL
from contextlib import suppress, contextmanager

import yaml
import psutil
from pkg_resources import parse_version as version
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.base import JobLookupError, ConflictingIdError
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.executors.pool import ThreadPoolExecutor

import collect_agent

try:
    # Try importing unix stuff
    import syslog
    OS_TYPE = 'linux'
    JOBS_FOLDER = Path('/opt/openbach/agent/jobs/')
    INSTANCES_FOLDER = Path('/opt/openbach/agent/job_instances/')
    COLLECTOR_CONFIG_FILE = Path('/opt/openbach/agent/collector.yml')
    RSTATS_CONFIG_FILE = Path('/opt/openbach/agent/rstats/rstats.yml')
except ImportError:
    # If we failed assume we’re on windows
    import syslog_viveris as syslog
    OS_TYPE = 'windows'
    JOBS_FOLDER = Path(r'C:\openbach\jobs')
    INSTANCES_FOLDER = Path(r'C:\openbach\instances')
    COLLECTOR_CONFIG_FILE = Path(r'C:\openbach\collector.yml')
    RSTATS_CONFIG_FILE = Path(r'C:\openbach\rstats\rstats.yml')


def signal_term_handler(signal, frame):
    """Stop the Openbach Agent gracefully"""
    scheduler = JobManager().scheduler
    scheduler.remove_all_jobs()
    RestartAgent(reload=False).action()
    while scheduler.get_jobs():
        time.sleep(0.5)
    scheduler.shutdown()
    exit(0)


class JobManager:
    """Context manager around job scheduling"""
    __shared_state = {
            'scheduler': None,
            'jobs': {},
            '_last_instance_id': random.randint(500000, 1000000),
            '_mutex': threading.RLock(),
    }

    def __init__(self):
        # Apply the Borg pattern
        self.__dict__ = self.__class__.__shared_state
        if self.scheduler is None:
            self.scheduler = BackgroundScheduler(executors={'default': ThreadPoolExecutor(50)})
            self.scheduler.start()

    def __enter__(self):
        self._mutex.acquire()
        return self

    def __exit__(self, t, v, tr):
        self._mutex.release()

    @property
    def job_names(self):
        with self._mutex:
            return list(self.jobs)

    def has_instance(self, name, instance_id):
        with self._mutex:
            try:
                job = self.jobs[name]
            except KeyError:
                return False
            else:
                return instance_id in job['instances']

    def add_job(self, name):
        with self._mutex:
            new_configuration = read_job_configuration(name)
            try:
                installed_job = self.jobs[name]
            except KeyError:
                conf = {'instances': {}}
                conf.update(new_configuration)
                self.jobs[name] = conf
            else:
                installed_version = version(installed_job['job_version'])
                new_version = version(new_configuration['job_version'])
                self.jobs[name].update(new_configuration)
                if installed_version >= new_version:
                    raise RequestWarning(
                            'Job {} is already installed with a newer '
                            'version (installed: {}, current: {}). '
                            'Configuration updated.'.format(
                                name, installed_version, new_version))

    def pop_job(self, name):
        with self._mutex:
            try:
                return self.jobs.pop(name)
            except KeyError:
                raise RequestWarning('No job {} is installed'.format(name))

    def get_job(self, name):
        with self._mutex:
            try:
                job = self.jobs[name]
            except KeyError:
                raise BadRequest('No job {} is installed'.format(name))
            return {key: value for key, value in job.items() if key != 'instances'}

    def get_instances(self, name):
        with self._mutex:
            try:
                job = self.jobs[name]
            except KeyError:
                raise BadRequest('No job {} is installed'.format(name))
            yield from job['instances'].items()

    def add_instance(self, name, instance_id, arguments, date, interval):
        with self._mutex:
            self.jobs[name]['instances'][instance_id] = {
                    'args': arguments,
                    'date': date,
                    'interval': interval,
            }

    def pop_instance(self, name, instance_id):
        with self._mutex:
            instance_infos = self.get_instance(name, instance_id)
            instance = self.jobs[name]['instances'][instance_id]
            del instance['pid']
            del instance['return_code']
            return instance_infos

    def get_instance(self, name, instance_id):
        with self._mutex:
            infos = self.get_job(name)
            infos.update(self.jobs[name]['instances'][instance_id])
            return infos

    def set_instance_started(self, name, instance_id, pid):
        with self._mutex:
            self.jobs[name]['instances'][instance_id].update(pid=pid, return_code=None)

    def set_instance_status(self, name, instance_id, pid, return_code):
        if return_code is None:
            # Somehow psutil returned None for a child process.
            # Since we have not much informations, assume success here.
            # TODO: this happen from time to time, especially with
            # the nuttcp job. Try to investigate what is going on.
            return_code = 0

        with self._mutex:
            instance = self.jobs[name]['instances'][instance_id]
            if 'pid' in instance:
                instance['return_code'] = return_code

    @property
    def new_instance_id(self):
        with self._mutex:
            instance_id = self._last_instance_id
            self._last_instance_id += 1
        return instance_id


class TruncatedMessageException(Exception):
    """Raised when a received message is not advertised length"""
    def __init__(self, expected_length, length):
        message = (
                'Message trunctated before '
                'reading the whole content. '
                'Expected {} bytes but read {}'
                .format(expected_length, length)
        )
        super().__init__(message)


class RequestWarning(ValueError):
    """Raised when parsing of a request lead to existing state"""
    def __init__(self, reason):
        super().__init__(reason)
        self.reason = reason


class BadRequest(RequestWarning):
    """Raised when parsing of a request failed"""
    pass


class AgentAction:
    def __init__(self, **kwargs):
        for name, value in kwargs.items():
            setattr(self, name, value)

    def action(self):
        self.check_arguments()
        return self._action()

    def check_arguments(self):
        pass

    def _action(self):
        raise NotImplementedError

    def _normalized_date(self):
        date = getattr(self, 'date', None)
        if date and time.time() < date.timestamp():
            return date


class AddJobAgent(AgentAction):
    def __init__(self, name):
        super().__init__(name=name)

    def _action(self):
        JobManager().add_job(self.name)


class DelJobAgent(AgentAction):
    def __init__(self, name):
        super().__init__(name=name)

    def _action(self):
        with JobManager() as manager:
            for job_instance_id, _ in manager.get_instances(self.name):
                manager.scheduler.add_job(
                        stop_job, 'date', args=(self.name, job_instance_id),
                        id='{}_{}_stop'.format(self.name, job_instance_id))


class StatusJobInstanceAgent(AgentAction):
    def __init__(self, name, instance_id):
        super().__init__(name=name, instance_id=instance_id)

    def check_arguments(self):
        with JobManager() as manager:
            manager.get_job(self.name)
            if self.instance_id < 0:
                self.instance_id = manager._last_instance_id

    def _action(self):
        with JobManager() as manager:
            job = manager.scheduler.get_job('{}_{}'.format(self.name, self.instance_id))
            try:
                infos = manager.get_instance(self.name, self.instance_id)
            except KeyError:
                assert job is None
                return 'Not Scheduled'

            try:
                pid = infos['pid']
                return_code = infos['return_code']
            except KeyError:
                return 'Stopped' if job is None else 'Scheduled'

            if return_code:
                return 'Error'

            if return_code is None:
                assert psutil.pid_exists(pid)
                return 'Running'

            assert return_code == 0
            if job:
                assert isinstance(job.trigger, IntervalTrigger)
                return 'Running'

            return 'Not Running'


class StartJobInstanceAgent(AgentAction):
    def __init__(self, name, instance_id, scenario_id, owner_id, date, interval, arguments, reschedule=False):
        super().__init__(
                name=name, instance_id=instance_id, scenario_id=scenario_id,
                owner_id=owner_id, date=date, interval=interval,
                arguments=arguments, reschedule=reschedule)

    def _check_instance(self):
        with JobManager() as manager:
            if self.instance_id < 0:
                self.instance_id = manager.new_instance_id

            if manager.has_instance(self.name, self.instance_id):
                raise BadRequest(
                        'Instance {} with id {} is already '
                        'started'.format(self.name, self.instance_id))

    def check_arguments(self):
        self._check_instance()

        if self.date == 'now':
            self.date = None

        try:
            if self.date is not None:
                self.date = datetime.fromtimestamp(self.date / 1000)
        except (TypeError, ValueError):
            raise BadRequest(
                    'The date to begin should be '
                    'given as a timestamp in milliseconds')

        try:
            if self.interval is not None:
                self.interval = int(self.interval)
        except ValueError:
            raise BadRequest(
                    'The interval should be an '
                    'integer number of seconds')

        if self.reschedule and self.interval is None and self._normalized_date() is None:
            raise BadRequest('Cannot reschedule a past job')

        infos = JobManager().get_job(self.name)
        nb_args = infos['required']
        optional = infos['optional']
        if len(self.arguments) < nb_args:
            raise BadRequest(
                    'Job {} requires at least {} arguments'
                    .format(self.name, nb_args))
        if not optional and len(self.arguments) > nb_args:
            raise BadRequest(
                    'Job {} does not require more than {} '
                    'arguments'.format(self.name, nb_args))

    def _action(self):
        with JobManager() as manager:
            infos = manager.get_job(self.name)
            command = infos['command']
            arguments = (
                    self.name, self.instance_id, self.scenario_id,
                    self.owner_id, command, self.arguments)
            scheduler_id = '{}_{}'.format(self.name, self.instance_id)

            try:
                # Schedule the Job Instance
                if self.interval is None:
                    date = self._normalized_date()
                    manager.scheduler.add_job(
                            launch_job, 'date', run_date=date,
                            args=arguments, id=scheduler_id)
                else:
                    #if infos['persistent']:    This conditions is removed: the user 
                    #                           must take care when playing with intervals
                    #    raise BadRequest(
                    #            'This job {} is persistent, you can\'t '
                    #            'start it with the "interval" option'
                    #            .format(self.name))
                    manager.scheduler.add_job(
                            launch_job, 'interval',
                            seconds=self.interval, start_date=self.date,
                            args=arguments, id=scheduler_id)
                    date = self.date or datetime.now()
            except ConflictingIdError:
                raise BadRequest(
                        'An instance of the job {} with the id {} is already '
                        'scheduled'.format(self.name, self.instance_id))

            manager.add_instance(
                    self.name, self.instance_id,
                    self.arguments, self.date, self.interval)

        if date is not None or self.interval:
            recover_file(
                    self.name, self.instance_id, 'start',
                    name=self.name,
                    instance_id=self.instance_id,
                    scenario_id=self.scenario_id,
                    owner_id=self.owner_id,
                    date=None if date is None else date.timestamp() * 1000,
                    interval=self.interval,
                    arguments=self.arguments)

        return self.instance_id


class RestartJobInstanceAgent(StartJobInstanceAgent):
    def _check_instance(self):
        pass

    def _action(self):
        stop_job(self.name, self.instance_id)
        super()._action()


class StopJobInstanceAgent(AgentAction):
    def __init__(self, name, instance_id, date, reschedule=False):
        super().__init__(
                name=name, instance_id=instance_id,
                date=date, reschedule=reschedule)

    def check_arguments(self):
        JobManager().get_job(self.name)

        if self.date == 'now':
            self.date = None

        try:
            if self.date is not None:
                self.date = datetime.fromtimestamp(self.date / 1000)
        except (TypeError, ValueError):
            raise BadRequest(
                    'The date to stop should be '
                    'given as a timestamp in milliseconds')

        if self.reschedule and self._normalized_date() is None:
            raise BadRequest('Cannot reschedule a past job')

    def _action(self):
        date = self._normalized_date()

        # Schedule the stop of the Job Instance
        with JobManager() as manager:
            scheduler_job_id = '{}_{}_stop'.format(self.name, self.instance_id)
            try:
                manager.scheduler.add_job(
                        stop_job, 'date', run_date=date,
                        args=(self.name, self.instance_id),
                        id=scheduler_job_id)
            except ConflictingIdError:
                manager.scheduler.reschedule_job(
                        scheduler_job_id,
                        trigger='date', run_date=date)

        if date is not None:
            recover_file(
                    self.name, self.instance_id, 'stop',
                    name=self.name,
                    instance_id=self.instance_id,
                    date=date.timestamp() * 1000)


class StatusJobsAgent(AgentAction):
    def __init__(self):
        super().__init__()

    def _action(self):
        return JobManager().job_names


class RestartAgent(AgentAction):
    def __init__(self, reload=True):
        super().__init__(reload=reload)

    def _action(self):
        with JobManager() as manager:
            for job_name in manager.job_names:
                for job_instance_id, _ in manager.get_instances(job_name):
                    manager.scheduler.add_job(
                            stop_job, 'date',
                            args=(job_name, job_instance_id, False),
                            id='{}_{}_stop'.format(job_name, job_instance_id))

        if self.reload:
            recover_old_state()


class CheckConnection(AgentAction):
    def __init__(self):
        super().__init__()

    def _action(self):
        pass


class ChangeCollector(AgentAction):
    def __init__(self, address, logs, stats):
        config = {
                'address': address,
                'logs': logs,
                'stats': stats,
        }
        super().__init__(collector=config)

    def _action(self):
        write_yaml(self.collector, COLLECTOR_CONFIG_FILE)
        collect_agent.restart_rstats()


def load_yaml(filename):
    """Read the content of a YAML file and return the associated object"""
    with open(filename, 'r', encoding='utf-8') as stream:
        return yaml.safe_load(stream)


def write_yaml(content, filename):
    """Write the content of an object into a file using YAML serialization"""
    with open(filename, 'w', encoding='utf-8') as stream:
        yaml.dump(content, stream, default_flow_style=False, explicit_start=True)


def recover_file(job_name, job_instance_id, extension, **content):
    """Save informations about a job in a specific file in case the Agent restarts"""
    filename = '{}{}.{}'.format(job_name, job_instance_id, extension)
    write_yaml(content, INSTANCES_FOLDER / filename)
    return filename


def popen(command, args, **kwargs):
    """Start a command with the provided arguments and
    return the associated process.

    Additional keywords arguments can be passed to the
    Popen constructor to manage the process creation.
    """

    kwargs.pop('shell', False)
    return psutil.Popen(
            command + args,
            stdout=DEVNULL,
            stderr=DEVNULL,
            **kwargs)


def launch_job(
        job_name, instance_id, scenario_instance_id,
        owner_scenario_instance_id, command, args):
    """Launch the Job Instance and wait for its termination"""
    # Add some environement variable for the Job Instance
    environ = os.environ.copy()
    environ.update({
        'JOB_NAME': str(job_name),
        'JOB_INSTANCE_ID': str(instance_id),
        'SCENARIO_INSTANCE_ID': str(scenario_instance_id),
        'OWNER_SCENARIO_INSTANCE_ID': str(owner_scenario_instance_id),
    })

    # Launch the Job Instance
    job_config = JobManager().get_job(job_name)
    proc = popen(command, args, env=environ, shell=job_config['sudo'])
    pid = proc.pid
    JobManager().set_instance_started(job_name, instance_id, pid)
    return_code = proc.wait()
    JobManager().set_instance_status(job_name, instance_id, pid, return_code)


def stop_job(job_name, job_instance_id, remove_recover_file=True):
    """Cancels the execution of a job or stop the instance if
    it was already scheduled.
    """
    with JobManager() as manager:
        try:
            infos = manager.pop_instance(job_name, job_instance_id)
            args = infos['args']
            command = infos['command_stop']
        except KeyError:
            pass  # Job is already stopped
        else:
            stop_job_already_running(job_name, job_instance_id, infos)
            if command:
                job_config = manager.get_job(job_name)
                popen(command, args, shell=job_config['sudo']).wait()
        finally:
            with suppress(JobLookupError):
                manager.scheduler.remove_job('{}_{}'.format(job_name, job_instance_id))
            if remove_recover_file:
                with suppress(OSError):
                    os.remove(recover_file(job_name, job_instance_id, 'start'))


def stop_job_already_running(job_name, job_instance_id, instance_infos):
    """Stop a running process that should be a child of the Agent"""

    # Get the process
    try:
        pid = instance_infos['pid']
    except KeyError:
        return
    try:
        proc = psutil.Process(pid)
    except psutil.NoSuchProcess:
        return

    # Kill all its children
    children = proc.children(recursive=True)
    for child in children:
        with suppress(psutil.AccessDenied, psutil.NoSuchProcess):
            child.terminate()
    _, still_alive = psutil.wait_procs(children, timeout=1)
    for child in still_alive:
        with suppress(psutil.AccessDenied, psutil.NoSuchProcess):
            child.kill()

    # Kill the process
    with suppress(psutil.AccessDenied, psutil.NoSuchProcess):
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except psutil.TimeoutExpired:
            proc.kill()


class AgentServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    """Choose the underlying technology for our sockets servers"""
    allow_reuse_address = True


class RequestHandler(socketserver.BaseRequestHandler):
    def _read_all(self, amount):
        expected = amount
        buffer = bytearray(amount)
        view = memoryview(buffer)
        while amount > 0:
            received = self.request.recv_into(view[-amount:])
            if not received:
                raise TruncatedMessageException(expected, expected - amount)
            amount -= received
        return buffer

    def finish(self):
        self.request.close()

    def handle(self):
        """Handle message comming from the conductor"""
        try:
            message_length = self._read_all(4)
            message_length, = struct.unpack('>I', message_length)
            message = self._read_all(message_length).decode()
            syslog.syslog(syslog.LOG_INFO, message)
            message = yaml.safe_load(message)
            action_name = message['command_name']
            arguments = message['command_arguments']
            action = ''.join(map(str.title, action_name.split('_')))
            handler = getattr(sys.modules[__name__], action)(**arguments)
        except TruncatedMessageException as e:
            self.send_response(str(e), syslog.LOG_WARNING)
        except yaml.error.YAMLError as e:
            self.send_response(
                    'Error parsing the message as a JSON '
                    'dictionary: {}'.format(e), syslog.LOG_CRIT)
        except struct.error as e:
            self.send_response(
                    'Error converting the message length to '
                    'an integer: {}'.format(e), syslog.LOG_CRIT)
        except KeyError as e:
            self.send_response(
                    'Missing mandatory argument: {}'.format(e),
                    syslog.LOG_ERR)
        except AttributeError:
            self.send_response(
                    'Unknown action: {}'.format(action_name),
                    syslog.LOG_CRIT)
        except TypeError as e:
            self.send_response(
                    'Bad parameters: {}'.format(e),
                    syslog.LOG_CRIT)
        except Exception:
            self.send_response(traceback.format_exc(), syslog.LOG_ALERT)
        else:
            try:
                result = handler.action()
            except BadRequest as e:
                self.send_response(e.reason, syslog.LOG_ERR)
            except RequestWarning as e:
                self.send_response(e.reason, syslog.LOG_WARNING)
            except Exception as e:
                self.send_response(traceback.format_exc(), syslog.LOG_ERR)
            else:
                self.send_response(result)

    def send_response(self, message, severity=None):
        if severity is None:
            status = 'OK'
            key = 'result'
        elif severity == syslog.LOG_WARNING:
            status = 'OK'
            key = 'warning'
            syslog.syslog(severity, message)
        else:
            status = 'KO'
            key = 'error'
            syslog.syslog(severity, message)

        result = json.dumps({
            'status': status,
            key: message,
        }).encode()
        length = struct.pack('>I', len(result))
        self.request.sendall(length + result)


def list_jobs_in_dir(dirname):
    """Generate the filename for jobs configuration files in
    the given directory.
    """
    for filename in dirname.iterdir():
        if filename.suffix == '.yml':
            yield filename.stem


def read_job_configuration(job_name):
    # Load the configuration
    filename = '{}.yml'.format(job_name)
    try:
        content = load_yaml(JOBS_FOLDER / filename)
    except yaml.YAMLError:
        raise BadRequest('Conf file {} not well formed'.format(filename))
    except FileNotFoundError:
        raise BadRequest('Conf file {} does not exist'.format(filename))

    # Register the configuration
    args = content.get('arguments', {})
    try:
        required, optional = read_subcommand_configuration(args)
    except KeyError as error:
        raise BadRequest(
                'Conf file {} does not contain an '
                'entry \'{}\' for section \'arguments '
                'required\' for job {}'
                .format(filename, error, job_name))

    try:
        configuration = {
                'required': required,
                'optional': optional,
                'persistent': content['general']['persistent'],
                'job_version': content['general']['job_version'],
                'command': shlex.split(content['general']['command']),
                'command_stop': shlex.split(content['general'].get('command_stop') or ''),
        }
    except KeyError as e:
        raise BadRequest(
                'Conf file {} does not contain a '
                '\'{}\' entry in section '
                '\'general\' for job {}'
                .format(filename, e, job_name))

    configuration['sudo'] = content['general'].get('need_privileges')

    return configuration


def read_subcommand_configuration(subcommand):
    required_count = 0
    optional_found = isinstance(subcommand.get('optional'), list)

    required = subcommand.get('required')
    if isinstance(required, list):
        for arg in required:
            count = arg['count']
            if count == '+':
                required_count += 1
            else:
                if not isinstance(count, int):
                    counts = count.split('-')
                    count = int(counts[0])
                required_count += count

    subcommands = subcommand.get('subcommand')
    if isinstance(subcommands, list):
        for group in subcommands:
            if group.get('optional', False):
                optional_found = True
            else:
                choices = (read_subcommand_configuration(sub) for sub in group.get('choices') or [])
                required, optional = zip(*choices)
                required_min = min(required)
                required_max = max(required)
                required_count += 1 + required_min
                optional_found = any([optional_found, optional, required_min != required_max])

    return required_count, optional_found


def populate_installed_jobs():
    """Read configuration files of Installed Jobs and
    store them into the JobManager.
    """
    with JobManager() as manager:
        for job in list_jobs_in_dir(JOBS_FOLDER):
            try:
                manager.add_job(job)
            except RequestWarning as e:
                syslog.syslog(syslog.LOG_ERR, e.reason)


def recover_old_state():
    """Read orders to start/stop jobs at a latter date and try to
    recover from a failure, depending of the current date.
    """
    loaders = {
            '.start': StartJobInstanceAgent,
            '.stop': StopJobInstanceAgent,
    }

    for filepath in INSTANCES_FOLDER.glob('**/*'):
        try:
            content = load_yaml(filepath)
            content['reschedule'] = True
            handler = loaders[filepath.suffix](**content)
            handler.action()
        except Exception:
            with suppress(OSError):
                os.remove(filepath)


def read_listening_port(default=1112):
    try:
        content = load_yaml(RSTATS_CONFIG_FILE)
        port = content['openbach_agent']['port']
        return int(port)
    except (KeyError, ValueError, FileNotFoundError, yaml.YAMLError):
        return default


if __name__ == '__main__':
    syslog.openlog('openbach_agent', syslog.LOG_PID, syslog.LOG_USER)
    signal.signal(signal.SIGTERM, signal_term_handler)
    signal.signal(signal.SIGINT, signal_term_handler)

    populate_installed_jobs()
    recover_old_state()
    port = read_listening_port()
    address = ('', port)

    with AgentServer(address, RequestHandler) as server:
        server.serve_forever()
