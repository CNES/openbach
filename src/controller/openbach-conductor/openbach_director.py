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
'''


import os
import sys
import json
import time
import struct
import syslog
import pathlib
import threading
import traceback
import socketserver
from contextlib import suppress
from collections import defaultdict

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.base import JobLookupError

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
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
application = get_wsgi_application()

from django.utils import timezone
from django.db.models import Q
from django.core.exceptions import ObjectDoesNotExist
from openbach_django.models import (
        ScenarioInstance, JobInstance, OpenbachFunctionInstance,
        StartJobInstance as StartJobInstanceOpenbachFunction,
        StartScenarioInstance as StartScenarioInstanceOpenbachFunction,
        FailurePolicy,
)

from lib.utils import OpenbachJSONEncoder
from lib.openbach_communicator import receive_all, DEFAULT_UNIX_DOMAIN
from lib.openbach_conductor import (
        StatusJobInstance as StatusJobInstanceConductor,
        StartScenarioInstance as StartScenarioInstanceConductor,
        StopScenarioInstance as StopScenarioInstanceConductor,
        StartJobInstance as StartJobInstanceConductor,
        StopJobInstance as StopJobInstanceConductor,
        StopJobInstances as StopJobInstancesConductor,
        RestartJobInstance as RestartJobInstanceConductor,
        PushFile as PushFileConductor,
        PullFile as PullFileConductor,
        Reboot as RebootConductor,
        ThreadedAction, ScenarioInstanceAction, InfosScenarioInstance,
)


syslog.openlog('openbach_director', syslog.LOG_PID, syslog.LOG_USER)


ERRORED_FUNCTIONS_NOT_IGNORED = Q(status=OpenbachFunctionInstance.Status.ERROR, retries_left__isnull=False)
PLANNED_FUNCTIONS = Q(status=OpenbachFunctionInstance.Status.SCHEDULED)
FINISHED_FUNCTIONS = Q(status=OpenbachFunctionInstance.Status.FINISHED)
UNFINISHED_FUNCTIONS = Q(status__in=(
    OpenbachFunctionInstance.Status.SCHEDULED,
    OpenbachFunctionInstance.Status.RUNNING,
))

FAILED_JOBS = Q(stop_date__isnull=False, status__in=(
    JobInstance.Status.ERROR,
    JobInstance.Status.AGENT_UNREACHABLE,
    JobInstance.Status.NOT_SCHEDULED,
    JobInstance.Status.UNKNOWN,
))
IGNORABLE_JOBS = Q(openbach_function_instance__openbach_function__on_failure__policy=FailurePolicy.Policies.IGNORE)

SCENARIOS_STOPPED = Q(status__in=(ScenarioInstance.Status.STOPPED, ScenarioInstance.Status.FINISHED_OK))
SCENARIOS_ERRORED = Q(status=ScenarioInstance.Status.FINISHED_KO)
SCENARIOS_UNREACHABLE = Q(status=ScenarioInstance.Status.AGENTS_UNREACHABLE)
SCENARIOS_ENDED = SCENARIOS_ERRORED | SCENARIOS_STOPPED | SCENARIOS_UNREACHABLE


######################
# Threads management #
######################

class StatusManager:
    """Manage watches on the director to regularly check in
    agents for JobInstances statuses.
    """

    __state = {
            'job_instances': defaultdict(set),
            'scenarios': {},
            '_mutex': threading.Lock(),
            'scheduler': None,
    }

    def __init__(self):
        """Implement the Borg pattern so any instance share the same state"""
        self.__dict__ = self.__class__.__state
        with self._mutex:
            if self.scheduler is None:
                self.scheduler = BackgroundScheduler()
                self.scheduler.start()

    def _stop_watch(self, job_id):
        with suppress(JobLookupError):
            self.scheduler.remove_job('watch_{}'.format(job_id))

    def add_job(self, scenario_id, job_id, username):
        with self._mutex:
            self.job_instances[scenario_id].add(job_id)
            self.scheduler.add_job(
                    status_manager, 'interval', seconds=2,
                    args=(job_id, scenario_id, username),
                    id='watch_{}'.format(job_id))

    def remove_job(self, scenario_id, job_id):
        with self._mutex:
            jobs = self.job_instances[scenario_id]
            jobs.remove(job_id)
            self._stop_watch(job_id)
            if not jobs:
                del self.job_instances[scenario_id]

    def add_scenario(self, thread, scenario_id):
        thread.start()
        with self._mutex:
            self.scenarios[scenario_id] = thread

    def remove_scenario(self, scenario_id):
        with suppress(KeyError):
            with self._mutex:
                thread = self.scenarios.pop(scenario_id)
            thread.stop()


def status_manager(job_instance_id, scenario_instance_id, username):
    """Check and update the status of a job instance based
    on the informations returned by its agent.

    When jobs finish, remove them from StatusManager watches.
    """
    job_status_manager = StatusJobInstance(job_instance_id, update=True)
    job_status_manager.configure_user(username)
    try:
        job_instance = job_status_manager.get_job_instance_or_not_found_error()
    except errors.ConductorError:
        StatusManager().remove_job(scenario_instance_id, job_instance_id)
        return

    if job_instance.get_status() is JobInstance.Status.SCHEDULED:
        # Openbach Function did not finish properly yet
        return

    try:
        job_status_manager.action()
    except errors.ConductorWarning:
        job_instance.set_status(JobInstance.Status.AGENT_UNREACHABLE)
    except errors.ConductorError:
        job_instance.set_status(JobInstance.Status.ERROR)

    if job_instance.is_stopped:
        StatusManager().remove_job(scenario_instance_id, job_instance_id)
    elif job_instance.get_status() is JobInstance.Status.AGENT_UNREACHABLE:
        # TODO: do we need to check if job_instance.openbach_function_instance is not None ?
        if job_instance.last_status > job_instance.openbach_function_instance.status_retry_delay:
            job_instance.stop_date = job_instance.update_status
            job_instance.save()
            StatusManager().remove_job(scenario_instance_id, job_instance_id)


#################################
# OpenbachFunctions description #
#################################

class OpenbachFunctionMixin:
    """Mixin describing that a specific ConductorAction can also be
    called as an OpenBACH Function.
    """

    def openbach_function(self, openbach_function_instance):
        """Public entry point to execute the required OpenBACH Function"""
        self.openbach_function_instance = openbach_function_instance
        if isinstance(self, ThreadedAction):
            self._threaded_action(self._action)
        else:
            self._action()


class StatusJobInstance(OpenbachFunctionMixin, StatusJobInstanceConductor):
    pass


class StartJobInstance(OpenbachFunctionMixin, StartJobInstanceConductor):
    def openbach_function(self, openbach_function_instance):
        self.openbach_function_instance = openbach_function_instance

        if self.offset is None:
            self._build_job_instance()
        else:
            date = self.offset * 1000
            if self.date is None:
                date += int(timezone.now().timestamp() * 1000)
            else:
                date += self.date

            self._build_job_instance(date)

        StatusManager().add_job(
                openbach_function_instance.scenario_instance.id,
                self.instance_id,
                self.connected_user.get_username())
        return super().openbach_function(openbach_function_instance)


class StopJobInstance(OpenbachFunctionMixin, StopJobInstanceConductor):
    def openbach_function(self, openbach_function_instance):
        """Retrieve the job instance id launched by the provided
        openbach function id and store it in the instance for the
        _action to take effect.
        """
        scenario = openbach_function_instance.scenario_instance
        actual_id = (
                scenario
                .openbach_functions_instances
                .filter(openbach_function__function_id=self.openbach_function_id)
                .latest('id').id
        )
        try:
            openbach_function_to_stop = scenario.openbach_functions_instances.get(id=actual_id)
        except OpenbachFunctionInstance.DoesNotExist:
            raise errors.NotFoundError(
                    'The provided Openbach Function Instance is '
                    'not found in the database for the given Scenario',
                    openbach_function_id=actual_id,
                    scenario_name=scenario.scenario.name)

        try:
            self.instance_id = openbach_function_to_stop.started_job.id
        except JobInstance.DoesNotExist:
            raise errors.NotFoundError(
                    'The provided Openbach Function Instance is '
                    'not associated to a launched job',
                    openbach_function_id=actual_id,
                    openbach_function_name=openbach_function_to_stop.name)
        return super().openbach_function(openbach_function_instance)


class StopJobInstances(OpenbachFunctionMixin, StopJobInstancesConductor):
    def openbach_function(self, openbach_function_instance):
        issues = []
        has_error = False
        for stop_id in self.openbach_function_ids:
            try:
                stop_job = StopJobInstance(date=self.date, openbach_function_id=stop_id)
                self.share_user(stop_job)
                stop_job.openbach_function(openbach_function_instance)
            except errors.ConductorWarning as e:
                issues.append(e.json)
            except errors.ConductorError as e:
                issues.append(e.json)
                has_error = True
        if has_error:
            raise errors.ConductorError(
                    'Stopping one or more JobInstance produced an error',
                    errors=issues)
        elif issues:
            raise errors.ConductorWarning(
                    'Stopping one or more JobInstance produced a warning',
                    warnings=issues)
        return []


class RestartJobInstance(OpenbachFunctionMixin, RestartJobInstanceConductor):
    pass


class StartScenarioInstance(OpenbachFunctionMixin, StartScenarioInstanceConductor):
    def __init__(self, scenario_name, project=None, arguments=None, date=None):
        super().__init__(scenario_name, project, arguments, date)
        # UGLY HACK: store the first parameter as self.instance_id as well.
        # On an action, will be called only with the instance_id as
        # the scenario will already be built by the conductor.
        # On an openbach function, the instance_id will be overriden
        # by _build_scenario_instance so this is a noop.
        self.instance_id = scenario_name

    def openbach_function(self, openbach_function_instance):
        launching_project = openbach_function_instance.scenario_instance.scenario.project
        project = None if launching_project is None else launching_project.name
        if project != self.project and self.project is not None:
            raise errors.BadRequestError(
                    'Trying to start a ScenarioInstance using '
                    'an OpenbachFunction of an other Project.',
                    scenario_name=self.name,
                    project_name=self.project,
                    used_project_name=project)
        else:
            self.project = project

        self.openbach_function_instance = openbach_function_instance
        self._build_scenario_instance()
        return super().openbach_function(openbach_function_instance)

    def _action(self):
        thread = ScenarioInstanceStatus(self.instance_id)
        StatusManager().add_scenario(thread, self.instance_id)
        return {'scenario_instance_id': self.instance_id}, 200


class StopScenarioInstance(OpenbachFunctionMixin, StopScenarioInstanceConductor):
    def openbach_function(self, openbach_function_instance):
        """Retrieve the scenario instance id launched by the provided
        openbach function id and store it in the instance for the
        _action to take effect.
        """
        scenario = openbach_function_instance.scenario_instance
        actual_id = (
                scenario
                .openbach_functions_instances
                .filter(openbach_function__function_id=self.openbach_function_id)
                .latest('id').id
        )
        try:
            openbach_function_to_stop = scenario.openbach_functions_instances.get(id=actual_id)
        except OpenbachFunctionInstance.DoesNotExist:
            raise errors.NotFoundError(
                    'The provided Openbach Function Instance is '
                    'not found in the database for the given Scenario',
                    openbach_function_id=actual_id,
                    scenario_name=scenario.scenario.name)

        try:
            self.instance_id = openbach_function_to_stop.started_scenario.id
        except ScenarioInstance.DoesNotExist:
            raise errors.NotFoundError(
                    'The provided Openbach Function Instance is '
                    'not associated to a launched scenario',
                    openbach_function_id=actual_id,
                    openbach_function_name=openbach_function_to_stop.name)
        return super().openbach_function(openbach_function_instance)

    def _action(self):
        scenario_instance = self.get_scenario_instance_or_not_found_error()
        if not scenario_instance.is_stopped:
            scenario_instance.stop()
            for openbach_function in scenario_instance.openbach_functions_instances.all():
                with suppress(JobInstance.DoesNotExist):
                    job_instance = openbach_function.started_job
                    if not job_instance.is_stopped:
                        stopper = StopJobInstance(job_instance.id)
                        self.share_user(stopper)
                        stopper.action()
                with suppress(ScenarioInstance.DoesNotExist):
                    subscenario_instance = openbach_function.started_scenario
                    if not subscenario_instance.is_stopped:
                        stopper = StopScenarioInstance(subscenario_instance.id)
                        self.share_user(stopper)
                        stopper.action()
                if openbach_function.get_status() is OpenbachFunctionInstance.Status.RUNNING:
                    openbach_function.set_status(OpenbachFunctionInstance.Status.STOPPED)
            StatusManager().remove_scenario(self.instance_id)
        return None, 204


class PushFile(OpenbachFunctionMixin, PushFileConductor):
    pass

class PullFile(OpenbachFunctionMixin, PullFileConductor):
    pass

class Reboot(OpenbachFunctionMixin, RebootConductor):
    pass


##############################
# OpenbachFunctions handling #
##############################

class OpenbachFunctionThread(threading.Thread):
    def __init__(self, openbach_function_instance):
        super().__init__()
        self._stopped = threading.Event()

        openbach_function = openbach_function_instance.openbach_function
        self._set_action(
                openbach_function.get_content_model().__class__.__name__,
                openbach_function.name)

        self.instance_id = openbach_function_instance.id
        self.openbach_function = openbach_function_instance
        self.openbach_function.start()

    def _set_action(self, action_name, verbose_name):
        try:
            self.action, = (
                    action
                    for action in OpenbachFunctionMixin.__subclasses__()
                    if action.__name__ == action_name
            )
        except ValueError:
            raise errors.ConductorError(
                    'An OpenbachFunction is not implemented',
                    openbach_function_name=verbose_name)

    def run(self):
        try:
            self._run()
        except Exception as error:
            log_message = {
                    'message': 'Unexpected exception appeared',
                    'error': str(error),
                    'traceback': traceback.format_exc(),
            }
            syslog.syslog(syslog.LOG_ERR, str(log_message))
            self.openbach_function.set_status(OpenbachFunctionInstance.Status.ERROR)

    def _run(self):
        time.sleep(self.openbach_function.wait_time)
        if self._stopped.is_set():
            self.openbach_function.set_status(OpenbachFunctionInstance.Status.STOPPED)
            return

        try:
            self._run_openbach_function()
        except errors.ConductorWarning as error:
            syslog.syslog(syslog.LOG_WARNING, str(error.json))
        except errors.ConductorError as error:
            syslog.syslog(syslog.LOG_ERR, str(error.json))
            self.openbach_function.set_status(OpenbachFunctionInstance.Status.ERROR)
            return

        if self._stopped.is_set():
            self.openbach_function.set_status(OpenbachFunctionInstance.Status.STOPPED)
        else:
            self.openbach_function.set_status(OpenbachFunctionInstance.Status.FINISHED)

    def _run_openbach_function(self):
        self.openbach_function.start()
        try:
            # Validation of arguments already happened in
            # StartScenarioInstance._build_scenario_instance()
            arguments = self.openbach_function.arguments
        except ObjectDoesNotExist as e:
            # But we may fail to convert openbach_function ids to their
            # respective job/scenario id if they are not launched yet
            raise errors.ConductorError(
                    str(e), label=self.openbach_function.openbach_function.label,
                    openbach_function=self.openbach_function.openbach_function.name)

        owner = self.openbach_function.scenario_instance.started_by
        action = self.action(**arguments)
        if owner is not None:
            action.connected_user = owner
        if not self._stopped.is_set():
            return action.openbach_function(self.openbach_function)

    def stop(self):
        self._stopped.set()


class ScenarioInstanceStatus(threading.Thread):
    def __init__(self, scenario_instance_id):
        super().__init__()
        self.scenario_instance = ScenarioInstance.objects.get(id=scenario_instance_id)
        self._openbach_functions = []
        self._is_stopped = threading.Event()

    def run(self):
        try:
            self._run()
        except errors.ConductorError as error:
            syslog.syslog(syslog.LOG_ERR, str(error.json))
            self._terminate_instance()
        except Exception as error:
            log_message = {
                    'message': 'Unexpected exception appeared',
                    'error': str(error),
                    'traceback': traceback.format_exc(),
            }
            syslog.syslog(syslog.LOG_ERR, str(log_message))
            self._terminate_instance()

    def _run(self):
        self.scenario_instance.status = ScenarioInstance.Status.RUNNING
        self.scenario_instance.save()

        openbach_functions_instances = self.scenario_instance.openbach_functions_instances
        spawned_jobs = OpenbachFunctionInstance.objects.filter(
                id__in=StartJobInstanceOpenbachFunction.objects.values('instances'),
                scenario_instance=self.scenario_instance).values('started_job')
        spawned_scenarios = OpenbachFunctionInstance.objects.filter(
                id__in=StartScenarioInstanceOpenbachFunction.objects.values('instances'),
                scenario_instance=self.scenario_instance).values('started_scenario')

        # Create all openbach functions threads with respect to dependencies
        while True:
            if self._is_stopped.is_set():
                self._stop_instance()
                self._join_openbach_functions()
                return

            if JobInstance.objects.filter(FAILED_JOBS, id__in=spawned_jobs).exclude(IGNORABLE_JOBS).exists():
                self._terminate_instance()
                self._join_openbach_functions()
                return

            for failed_obf_instance in openbach_functions_instances.filter(ERRORED_FUNCTIONS_NOT_IGNORED):
                if failed_obf_instance.retries_left > 0:
                    try:
                        self._launch_openbach_function_instance(failed_obf_instance, True)
                    except FailurePolicy.DoesNotExist:
                        # Could not validate_restart on duplicated function instance
                        pass
                    else:
                        continue

                self._terminate_instance()
                self._join_openbach_functions()
                return

            for openbach_function_instance in openbach_functions_instances.filter(PLANNED_FUNCTIONS):
                function = openbach_function_instance.openbach_function
                if OpenbachFunctionInstance.objects.filter(
                        openbach_function__id__in=function.running_waiters.values('openbach_function_waited'),
                        scenario_instance=self.scenario_instance).filter(PLANNED_FUNCTIONS).exists():
                    # Wait for running openbach functions are not all started yet
                    continue
                if OpenbachFunctionInstance.objects.filter(
                        openbach_function__id__in=function.ended_waiters.values('openbach_function_waited'),
                        scenario_instance=self.scenario_instance).filter(UNFINISHED_FUNCTIONS).exists():
                    # Wait for ended openbach functions are not all started yet
                    continue
                if OpenbachFunctionInstance.objects.filter(
                        openbach_function__id__in=function.launched_waiters.values('openbach_function_waited'),
                        scenario_instance=self.scenario_instance).exclude(FINISHED_FUNCTIONS).exists():
                    # Wait for launched openbach functions are not all launched yet
                    continue

                if self._has_waited_instances_finished(function):
                    self._launch_openbach_function_instance(openbach_function_instance)

            if openbach_functions_instances.filter(UNFINISHED_FUNCTIONS).exists():
                time.sleep(0.2)
                continue

            if self._has_instances_running(spawned_jobs, spawned_scenarios):
                time.sleep(1)
            else:
                break

        self._join_openbach_functions()
        self.scenario_instance.stop(stop_status=ScenarioInstance.Status.FINISHED_OK)
        StatusManager().remove_scenario(self.scenario_instance.id)

    def stop(self):
        self._is_stopped.set()

    @staticmethod
    def _has_instances_running(started_jobs, started_scenarios):
        jobs_not_finished = JobInstance.objects.filter(stop_date__isnull=True, id__in=started_jobs)
        scenarios_not_finished = ScenarioInstance.objects.filter(~SCENARIOS_ENDED, id__in=started_scenarios)
        return jobs_not_finished.exists() or scenarios_not_finished.exists()

    def _has_waited_instances_finished(self, function):
        waited_instances = function.finished_waiters.values('openbach_function_waited')
        wait_for_finished = OpenbachFunctionInstance.objects.filter(
                openbach_function__id__in=waited_instances,
                scenario_instance=self.scenario_instance)

        instances_keywords = ('started_job', 'started_scenario')
        started_instances = wait_for_finished.values(*instances_keywords).exclude(
                **{'{}__isnull'.format(k): True for k in instances_keywords})
        if waited_instances.count() != started_instances.count():
            return False

        return not self._has_instances_running(
                wait_for_finished.values('started_job'),
                wait_for_finished.values('started_scenario'))

    def _launch_openbach_function_instance(self, openbach_function_instance, use_retry=False):
        if use_retry:
            retries_left = openbach_function_instance.retries_left - 1
            openbach_function_instance.set_status(OpenbachFunctionInstance.Status.RETRIED)
            openbach_function_instance = OpenbachFunctionInstance.objects.create(
                    openbach_function=openbach_function_instance.openbach_function,
                    scenario_instance=openbach_function_instance.scenario_instance,
                    status=OpenbachFunctionInstance.Status.SCHEDULED)
            openbach_function_instance.validate_restart(retries_left)
        openbach_function_thread = OpenbachFunctionThread(openbach_function_instance)
        self._openbach_functions.append(openbach_function_thread)
        openbach_function_thread.start()

    def _join_openbach_functions(self):
        for thread in self._openbach_functions:
            thread.join()
        self._openbach_functions.clear()

    def _stop_instance(self):
        for thread in self._openbach_functions:
            thread.stop()

        stop_scenario = StopScenarioInstance(self.scenario_instance.id)
        user = self.scenario_instance.started_by
        if user is not None:
            stop_scenario.connected_user = user
        stop_scenario.action()

    def _terminate_instance(self, status=ScenarioInstance.Status.FINISHED_KO):
        self._stop_instance()
        instance = ScenarioInstance.objects.get(id=self.scenario_instance.id)
        instance.stop(stop_status=status)


########
# Main #
########

class DirectorServer(socketserver.ThreadingMixIn, socketserver.UnixStreamServer):
    """Choose the underlying technology for our sockets servers"""
    pass


class ScenarioHandler(socketserver.BaseRequestHandler):
    def handle(self):
        length, = struct.unpack('>I', receive_all(self.request, 4))
        message = receive_all(self.request, length).decode()
        try:
            response, returncode = self.execute_request(message)
        except errors.ConductorError as e:
            result = {
                    'response': e.json,
                    'returncode': e.ERROR_CODE,
            }
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
            answer = json.dumps(result, cls=OpenbachJSONEncoder).encode()
            self.request.sendall(struct.pack('>I', len(answer)))
            self.request.sendall(answer)

    def execute_request(self, message):
        request = json.loads(message)
        scenario_instance_id = request['scenario']
        action_name = '{}ScenarioInstance'.format(request['action'].capitalize())
        action = getattr(sys.modules[__name__], action_name)
        command = action(scenario_instance_id)
        command.configure_user(request['user_name'])
        return command.action()


def main(socket_name=DEFAULT_UNIX_DOMAIN):
    # Remove old socket file if any
    socket = pathlib.Path(socket_name)
    if socket.is_socket():
        socket.unlink()

    # Restart previous scenarios in case of a crash
    status_manager = StatusManager()
    unfinished_scenarios = ScenarioInstance.objects.exclude(SCENARIOS_ENDED)
    for scenario in unfinished_scenarios:
        owner = scenario.started_by
        owner_name = None if owner is None else owner.get_username()
        started_jobs = scenario.openbach_functions_instances.values('started_job')
        for job_instance in JobInstance.objects.filter(id__in=started_jobs):
            status_manager.add_job(scenario.id, job_instance.id, owner_name)
        stopper = StopScenarioInstance(scenario.id)
        stopper.connected_user = owner
        stopper.action()

    # Start listening for orders
    server = DirectorServer(socket_name, ScenarioHandler)
    try:
        server.serve_forever()
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
