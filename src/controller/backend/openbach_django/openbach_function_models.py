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


"""Table descriptions relatives to the OpenBACH's functions.

Each class in this module describe a table with its associated
columns in the backend's database. These classes are used by
the Django's ORM to convert results from databases queries into
Python objects.
"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Adrien THIBAUD <adrien.thibaud@toulouse.viveris.com>
 * Mathias ETTINGER <mathias.ettinger@toulouse.viveris.com>
'''


from contextlib import suppress

from django.db import models, IntegrityError
from django.utils import timezone

from .utils import build_storage_path
from .base_models import ContentTyped, OpenbachFunctionParameter, ValuesType
from .condition_models import Condition
from .project_models import Entity, Agent


class OpenbachFunction(ContentTyped):
    """Data associated to an Openbach Function"""

    function_id = models.IntegerField()
    label = models.CharField(max_length=500)
    scenario_version = models.ForeignKey(
            'ScenarioVersion',
            models.CASCADE,
            related_name='openbach_functions')
    wait_time = OpenbachFunctionParameter(type=float)

    class Meta:
        unique_together = ('scenario_version', 'function_id')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        """Override the standard Django's save operation to
        make sure we store which concrete implementation was
        used to build the associated object.
        """
        self.set_content_model()
        super().save(*args, **kwargs)

    @classmethod
    def build_from_arguments(
            cls, function_id, label,
            scenario, wait_time, arguments):
        if label is None:
            label = str(function_id)

        return cls.objects.create(
                function_id=function_id,
                label=label,
                scenario_version=scenario,
                wait_time=wait_time,
                **arguments)

    @property
    def scenario(self):
        return self.scenario_version.scenario

    @property
    def name(self):
        return self.get_content_model()._meta.verbose_name

    @property
    def json(self):
        json_data = self.get_content_model()._json
        json_data['id'] = self.function_id
        json_data['label'] = self.label

        try:
            on_failure = self.on_failure
        except FailurePolicy.DoesNotExist:
            pass
        else:
            json_data['on_fail'] = on_failure.json

        wait = {}
        if self.wait_time != 0:
            wait['time'] = self.wait_time
        if self.launched_waiters.count():
            wait['launched_ids'] = [
                    waited.openbach_function_waited.function_id
                    for waited in self.launched_waiters.all()
            ]
        if self.finished_waiters.count():
            wait['finished_ids'] = [
                    waited.openbach_function_waited.function_id
                    for waited in self.finished_waiters.all()
            ]
        if wait:
            json_data['wait'] = wait
        return json_data

    def set_arguments_count(self, arguments):
        this = self.get_content_model()
        for value in this._openbach_function_argument_values():
            for placeholder in OpenbachFunctionParameter.placeholders(value):
                arguments[placeholder] += 1

    def _openbach_function_argument_values(self):
        for field in self._meta.fields:
            if isinstance(field, OpenbachFunctionParameter):
                yield getattr(self, field.name)

    def instance_value(self, field_name, parameters):
        value = getattr(self, field_name)
        field = self._meta.get_field(field_name)
        if isinstance(field, OpenbachFunctionParameter):
            value = field.validate_openbach_value(value, parameters)
        return value

    def get_arguments(self, parameters, scenario_instance):
        return self.get_content_model()._get_arguments(parameters, scenario_instance)


class OpenbachFunctionInstance(models.Model):
    """Data associated to an Openbach Function instance"""

    class Status(models.TextChoices):
        SCHEDULED = 'P'
        RUNNING = 'R'
        STOPPED = 'S'
        FINISHED = 'F'
        ERROR = 'E'
        RETRIED = '*'

    openbach_function = models.ForeignKey(
            OpenbachFunction,
            models.CASCADE,
            related_name='instances')
    scenario_instance = models.ForeignKey(
            'ScenarioInstance', models.CASCADE,
            related_name='openbach_functions_instances')
    status = models.CharField(
            max_length=max(map(len, Status.values)),
            choices=Status.choices)
    launch_date = models.DateTimeField(null=True, blank=True)

    # Secondary attributes, computed from openbach_function
    retries_left = models.IntegerField(null=True, blank=True)
    wait_time = models.FloatField(default=0.0)

    def __str__(self):
        return (
            'Openbach Function \'{}\' of Scenario \'{}\' '
            '(instance {} of scenario {})'.format(
                self.openbach_function.name,
                self.scenario_instance.scenario.name,
                self.id, self.scenario_instance.id))

    def start(self):
        self.status = self.Status.RUNNING
        self.launch_date = timezone.now()
        self.save()

    def get_status(self):
        return self.Status(self.status)

    def set_status(self, status):
        self.status = status
        self.save()

    def save(self, *args, **kwargs):
        if self.scenario_instance.scenario != self.openbach_function.scenario:
            raise IntegrityError(
                    'Trying to save an OpenbachFunctionInstance with the '
                    'associated ScenarioInstance and the associated '
                    'OpenbachFunction not referencing the same Scenario')
        super().save(*args, **kwargs)

    @property
    def json(self):
        # Late imports to avoid circular dependencies
        from .scenario_models import ScenarioInstance
        from .job_models import JobInstance

        json_data = self.openbach_function.json
        json_data['status'] = self.get_status().label
        json_data['launch_date'] = self.launch_date

        with suppress(ScenarioInstance.DoesNotExist):
            scenario = self.started_scenario
            json_data['scenario'] = scenario.json

        with suppress(JobInstance.DoesNotExist):
            job_instance = self.started_job
            json_data['job'] = job_instance.json

        return json_data

    @property
    def arguments(self):
        parameters = self.scenario_instance.parameters
        return self.openbach_function.get_arguments(parameters, self.scenario_instance)

    def validate_arguments(self):
        parameters = self.scenario_instance.parameters
        self.openbach_function.get_arguments(parameters, None)

        try:
            on_failure = self.openbach_function.on_failure
        except FailurePolicy.DoesNotExist:
            policy = FailurePolicy.Policies.FAIL
        else:
            policy = on_failure.fail_policy

        if policy is FailurePolicy.Policies.FAIL:
            self.retries_left = 0
        elif policy is FailurePolicy.Policies.IGNORE:
            self.retries_left = None
        elif policy is FailurePolicy.Policies.RETRY:
            # Validate on_failure.wait_time here so we don't need to do it in validate_restart later
            OpenbachFunction.instance_value(on_failure, 'wait_time', parameters)
            self.retries_left = OpenbachFunction.instance_value(on_failure, 'retry_limit', parameters)

        self.wait_time = self.openbach_function.instance_value('wait_time', parameters)
        self.save()

    def validate_restart(self, retries_left):
        parameters = self.scenario_instance.parameters
        on_failure = self.openbach_function.on_failure

        retry_limit = OpenbachFunction.instance_value(on_failure, 'retry_limit', parameters)
        wait_time = OpenbachFunction.instance_value(on_failure, 'wait_time', parameters)
        if retries_left >= max(retry_limit, 0):
            # Acceptable approximation over more generic ValueError
            raise FailurePolicy.DoesNotExist

        self.retries_left = retries_left
        self.wait_time = wait_time
        self.save()

    @property
    def status_retry_delay(self):
        try:
            on_failure = self.openbach_function.on_failure
        except FailurePolicy.DoesNotExist:
            pass
        else:
            if on_failure.fail_policy is FailurePolicy.Policies.RETRY:
                parameters = self.scenario_instance.parameters
                retries = OpenbachFunction.instance_value(on_failure, 'retry_limit', parameters)
                delay = OpenbachFunction.instance_value(on_failure, 'wait_time', parameters)
                return retries * delay

        return 0.0


class WaitingCondition(models.Model):
    """Abstract base class containing scheduling informations
    for an OpenBACH function waiting on an other one. Each
    awaitable lifecycle event of an OpenBACH function have an
    associated concrete subclass.

    Subclasses must implement an `openbach_function_instance`
    ForeignKey with the appropriate `related_name` so the
    director can easily get back to there for its scheduling
    decision making.
    """

    class Meta:
        abstract = True

    openbach_function_waited = models.ForeignKey(
            OpenbachFunction,
            on_delete=models.CASCADE,
            related_name='+')

    def __str__(self):
        action = self.__class__.__name__.split('WaitFor')[-1].lower()
        return ('{0.openbach_function_instance} waits for '
                '{0.openbach_function_waited} to be {1}'.format(self, action))

    def save(self, *args, **kwargs):
        own_scenario = self.openbach_function_instance.scenario
        waited_scenario = self.openbach_function_waited.scenario
        if waited_scenario != own_scenario:
            name = self.__class__.__name__
            raise IntegrityError(
                    f'Trying to save a {name} instance '
                    'with the associated OpenbachFunction and '
                    'the waited OpenbachFunction not '
                    'referencing the same Scenario')
        super().save(*args, **kwargs)


class WaitForRunning(WaitingCondition):
    """Waiting condition that will prevent an OpenBACH Function
    to start before an other one is already running.
    """

    openbach_function_instance = models.ForeignKey(
            OpenbachFunction,
            on_delete=models.CASCADE,
            related_name='running_waiters')


class WaitForEnded(WaitingCondition):
    """Waiting condition that will prevent an OpenBACH Function
    to start before an other one is done executing.
    """

    openbach_function_instance = models.ForeignKey(
            OpenbachFunction,
            on_delete=models.CASCADE,
            related_name='ended_waiters')


class WaitForLaunched(WaitingCondition):
    """Waiting condition that will prevent an OpenBACH Function to
    start before an other one has already started their job/scenario.
    """

    openbach_function_instance = models.ForeignKey(
            OpenbachFunction,
            on_delete=models.CASCADE,
            related_name='launched_waiters')


class WaitForFinished(WaitingCondition):
    """Waiting condition that will prevent an OpenBACH Function to
    start before an other one have their job/scenario completely finished.
    """

    openbach_function_instance = models.ForeignKey(
            OpenbachFunction,
            on_delete=models.CASCADE,
            related_name='finished_waiters')


class FailurePolicy(models.Model):
    """Policy indicating how a given OpenBACH Function
    should behave upon failure. Absence of such policy is
    equivalent to the FAIL policy.
    """

    class Policies(models.TextChoices):
        IGNORE = 'I'
        FAIL = 'F'
        RETRY = 'R'

    openbach_function = models.OneToOneField(
            OpenbachFunction,
            models.CASCADE,
            related_name='on_failure')

    policy = models.CharField(
            max_length=max(map(len, Policies.values)),
            choices=Policies.choices,
            default=Policies.IGNORE)
    wait_time = OpenbachFunctionParameter(type=float, blank=True, null=True)
    retry_limit = OpenbachFunctionParameter(type=int, blank=True, null=True)

    def requires_restart(self, attempts):
        return self.fail_policy is self.Policies.RETRY and (self.retry_limit is None or self.retry_limit > attemps)

    @property
    def fail_policy(self):
        return self.Policies(self.policy)

    @property
    def json(self):
        policy = self.fail_policy
        json_data = {'policy': policy.label}

        if policy is self.Policies.RETRY:
            if self.wait_time is not None:
                json_data['delay'] = self.wait_time
            if self.retry_limit is not None:
                json_data['retry'] = self.retry_limit

        return json_data

    def __str__(self):
        policy = self.fail_policy
        if policy is self.Policies.RETRY:
            delay = 5. if self.delay is None else self.delay
            retries = 'undefinitely' if self.retry_limit is None else 'at most {} times'.format(self.retry_limit)
            return 'Failure Policy: Retry every {} seconds {}'.format(delay, retries)
        else:
            return 'Failure Policy: {}'.format(policy.label)


# From here on, definition of supported OpenBACH functions

class AssignCollector(OpenbachFunction):
    address = OpenbachFunctionParameter(type=str)
    collector = OpenbachFunctionParameter(type=str)

    @property
    def _json(self):
        return {'assign_collector': {
            'address': self.address,
            'collector': self.collector,
        }}

    def _get_arguments(self, parameters, scenario_instance):
        return {
                'address': self.instance_value('address', parameters),
                'collector': self.instance_value('collector', parameters),
        }


class InstallAgent(OpenbachFunction):
    address = OpenbachFunctionParameter(type=str)
    collector = OpenbachFunctionParameter(type=str)
    username = OpenbachFunctionParameter(type=str)
    password = OpenbachFunctionParameter(type=str)
    name = OpenbachFunctionParameter(type=str)

    @property
    def _json(self):
        return {'install_agent': {
            'address': self.address,
            'collector': self.collector,
            'username': self.username,
            'password': self.password,
            'name': self.name,
        }}

    def _get_arguments(self, parameters, scenario_instance):
        return {
                'name': self.instance_value('name', parameters),
                'address': self.instance_value('address', parameters),
                'collector': self.instance_value('collector', parameters),
                'username': self.instance_value('username', parameters),
                'password': self.instance_value('password', parameters),
        }


class UninstallAgent(OpenbachFunction):
    address = OpenbachFunctionParameter(type=str)

    @property
    def _json(self):
        return {'uninstall_agent': {
            'address': self.address,
        }}

    def _get_arguments(self, parameters, scenario_instance):
        return {
                'address': self.instance_value('address', parameters),
        }

class Reboot(OpenbachFunction):
    kernel = OpenbachFunctionParameter(type=str, null=True)
    entity_name = OpenbachFunctionParameter(type=str)

    @property
    def _json(self):
        return {'reboot': {
            'entity_name': self.entity_name,
            'kernel': self.kernel,
        }}

    def _get_arguments(self, parameters, scenario_instance):
        entity_name = self.instance_value('entity_name', parameters)
        project = self.scenario.project
        entity = Entity.objects.get(name=entity_name, project=project)
        if entity.agent is None:
            raise Agent.DoesNotExist

        return {
                'address': entity.agent.address,
                'kernel': self.instance_value('kernel', parameters),
        }

class PushFile(OpenbachFunction):
    users = OpenbachFunctionParameter(type=list)
    groups = OpenbachFunctionParameter(type=list)
    removes = OpenbachFunctionParameter(type=list)
    local_path = OpenbachFunctionParameter(type=list)
    remote_path = OpenbachFunctionParameter(type=list)
    entity_name = OpenbachFunctionParameter(type=str)

    @classmethod
    def build_from_arguments(
            cls, function_id, label,
            scenario, wait_time, arguments):
        local_path = arguments.pop('local_path')
        if not isinstance(local_path, list):
            raise TypeError(list, local_path, 'local_path')

        remote_path = arguments.pop('remote_path')
        if not isinstance(remote_path, list):
            raise TypeError(list, remote_path, 'remote_path')

        users = arguments.pop('users', [])
        if not isinstance(users, list):
            raise TypeError(list, users, 'users')

        groups = arguments.pop('groups', [])
        if not isinstance(groups, list):
            raise TypeError(list, groups, 'groups')

        removes = arguments.pop('removes', [])
        if not isinstance(removes, list):
            raise TypeError(list, removes, 'removes')

        length = len(local_path)
        if length != len(remote_path):
            raise ValueError('local and remote paths amount mismatch')

        if users and len(users) != length:
            raise ValueError('owner of files and paths amount mismatch')

        if groups and len(groups) != length:
            raise ValueError('group owner of files and paths amount mismatch')

        if removes and len(removes) != length:
            raise ValueError('removes and paths amount mismatch')

        return super().build_from_arguments(
                function_id,
                label,
                scenario,
                wait_time,
                {
                    'local_path': [build_storage_path(path) for path in local_path],
                    'remote_path': remote_path,
                    'users': users,
                    'groups': groups,
                    'removes': removes,
                    **arguments,
                })

    @property
    def _json(self):
        path_infos = [
                {
                    'local_path': local_path,
                    'remote_path': remote_path,
                    'user': user,
                    'group': group,
                    'remove': remove,
                }
                for local_path, remote_path, user, group, remove
                in zip(self.local_path, self.remote_path, self.users, self.groups, self.removes)
        ]
        return {'push_file': {
            'entity_name': self.entity_name,
            'files': path_infos,
        }}

    def _get_arguments(self, parameters, scenario_instance):
        entity_name = self.instance_value('entity_name', parameters)
        project = self.scenario.project

        entity = Entity.objects.get(name=entity_name, project=project)
        if entity.agent is None:
            raise Agent.DoesNotExist

        return {
                'address': entity.agent.address,
                'local_path': self.instance_value('local_path', parameters),
                'remote_path': self.instance_value('remote_path', parameters),
                'users': self.instance_value('users', parameters),
                'groups': self.instance_value('groups', parameters),
                'removes': self.instance_value('removes', parameters),
        }


class PullFile(OpenbachFunction):
    users = OpenbachFunctionParameter(type=list)
    groups = OpenbachFunctionParameter(type=list)
    removes = OpenbachFunctionParameter(type=list)
    local_path = OpenbachFunctionParameter(type=list)
    remote_path = OpenbachFunctionParameter(type=list)
    entity_name = OpenbachFunctionParameter(type=str)

    @classmethod
    def build_from_arguments(
            cls, function_id, label,
            scenario, wait_time, arguments):
        local_path = arguments.pop('local_path')
        if not isinstance(local_path, list):
            raise TypeError(list, local_path, 'local_path')

        remote_path = arguments.pop('remote_path')
        if not isinstance(remote_path, list):
            raise TypeError(list, remote_path, 'remote_path')

        users = arguments.pop('users', [])
        if not isinstance(users, list):
            raise TypeError(list, users, 'users')

        groups = arguments.pop('groups', [])
        if not isinstance(groups, list):
            raise TypeError(list, groups, 'groups')

        removes = arguments.pop('removes', [])
        if not isinstance(removes, list):
            raise TypeError(list, removes, 'removes')

        length = len(local_path)
        if length != len(remote_path):
            raise ValueError('local and remote paths amount mismatch')

        if users and len(users) != length:
            raise ValueError('owner of files and paths amount mismatch')

        if groups and len(groups) != length:
            raise ValueError('group owner of files and paths amount mismatch')

        if removes and len(removes) != length:
            raise ValueError('removes and paths amount mismatch')

        return super().build_from_arguments(
                function_id,
                label,
                scenario,
                wait_time,
                {
                    'local_path': [build_storage_path(path) for path in local_path],
                    'remote_path': remote_path,
                    'users': users,
                    'groups': groups,
                    'removes': removes,
                    **arguments,
                })

    @property
    def _json(self):
        path_infos = [
                {
                    'local_path': local_path,
                    'remote_path': remote_path,
                    'user': user,
                    'group': group,
                    'remove': remove,
                }
                for local_path, remote_path, user, group, remove
                in zip(self.local_path, self.remote_path, self.users, self.groups, self.removes)
        ]
        return {'pull_file': {
            'entity_name': self.entity_name,
            'files': path_infos,
        }}

    def _get_arguments(self, parameters, scenario_instance):
        entity_name = self.instance_value('entity_name', parameters)
        project = self.scenario.project

        entity = Entity.objects.get(name=entity_name, project=project)
        if entity.agent is None:
            raise Agent.DoesNotExist

        return {
                'address': entity.agent.address,
                'local_path': self.instance_value('local_path', parameters),
                'remote_path': self.instance_value('remote_path', parameters),
                'users': self.instance_value('users', parameters),
                'groups': self.instance_value('groups', parameters),
                'removes': self.instance_value('removes', parameters),
        }

class StartJobInstance(OpenbachFunction):
    entity_name = OpenbachFunctionParameter(type=str)
    job_name = OpenbachFunctionParameter(type=str)
    offset = OpenbachFunctionParameter(type=float, null=True)
    interval = OpenbachFunctionParameter(type=int, null=True)

    def _openbach_function_argument_values(self):
        yield from super()._openbach_function_argument_values()
        for argument in self.arguments.all():
            yield argument.value

    @classmethod
    def build_from_arguments(
            cls, function_id, label,
            scenario, wait_time, arguments):
        offset = arguments.pop('offset', None)
        if offset is not None and not isinstance(offset, (int, float, str)):
            raise TypeError(float, offset, 'offset')
        interval = arguments.pop('interval', None)
        if interval is not None and not isinstance(interval, (int, str)):
            raise TypeError(int, interval, 'interval')
        entity_name = arguments.pop('entity_name')
        if len(arguments) > 1:
            raise ValueError('Too much job names to start')
        if len(arguments) < 1:
            raise ValueError('The name of the job to start is missing')
        job_name, = arguments
        if not isinstance(arguments[job_name], dict):
            raise TypeError(dict, arguments[job_name], job_name)

        return super().build_from_arguments(
                function_id,
                label,
                scenario,
                wait_time,
                {
                    'offset': offset,
                    'interval': interval,
                    'job_name': job_name,
                    'entity_name': entity_name,
                })

    def _prepare_arguments(self, parameters=None, scenario_instance=None):
        arguments = {}
        for argument in self.arguments.all():
            args = arguments
            for name in argument.hierarchy:
                args = args.setdefault(name, {})
            if argument.type is None:
                continue
            value = argument.get_value(parameters, scenario_instance)
            storage = args.setdefault(argument.name, [])
            if len(storage) == argument.occurrence:
                storage.append([value])
            else:
                storage[argument.occurrence].append(value)
        return arguments

    @property
    def _json(self):
        scheduling = {}
        if self.offset is not None:
            scheduling['offset'] = self.offset
        if self.interval is not None:
            scheduling['interval'] = self.interval

        return {'start_job_instance': {
            **scheduling,
            self.job_name: self._prepare_arguments(),
            'entity_name': self.entity_name,
        }}

    def _get_arguments(self, parameters, scenario_instance):
        entity_name = self.instance_value('entity_name', parameters)
        project = self.scenario.project

        entity = Entity.objects.get(name=entity_name, project=project)
        if entity.agent is None:
            raise Agent.DoesNotExist

        return {
                'name': self.instance_value('job_name', parameters),
                'offset': self.instance_value('offset', parameters),
                'interval': self.instance_value('interval', parameters),
                'address': entity.agent.address,
                'arguments': self._prepare_arguments(parameters, scenario_instance),
        }


class StartJobInstanceArgument(models.Model):
    """Storage of arguments of a Job Instance as defined by a
    Scenario. Possible usage of placeholder values make it
    impossible to create the arguments up-front.
    """

    value = OpenbachFunctionParameter(type=str)
    start_job_instance = models.ForeignKey(
            StartJobInstance, models.CASCADE,
            related_name='arguments')
    occurrence = models.PositiveIntegerField(default=0)
    name = models.CharField(max_length=500)
    type = models.CharField(max_length=10, choices=ValuesType.choices(), null=True)
    hierarchy = OpenbachFunctionParameter(type=list)

    class Meta:
        ordering = ['occurrence', 'id']

    def get_value(self, parameters, scenario_instance):
        checker = OpenbachFunctionParameter.from_type(self.type)
        value = checker.validate_openbach_value(self.value, parameters)
        if scenario_instance is None:
            return value

        if self.type in (ValuesType.JOB_INSTANCE_ID.value, ValuesType.SCENARIO_INSTANCE_ID.value):
            for current in value[:-1]:
                queryset = OpenbachFunctionInstance.objects.select_related('started_scenario')
                openbach_function_instance = queryset.get(
                        openbach_function__function_id=current,
                        openbach_function__startscenarioinstance__isnull=False,
                        scenario_instance=scenario_instance)
                scenario_instance = openbach_function_instance.started_scenario

            if self.type == ValuesType.JOB_INSTANCE_ID.value:
                queryset = OpenbachFunctionInstance.objects.select_related('started_job')
                openbach_function_instance = queryset.filter(
                        openbach_function__function_id=value[-1],
                        openbach_function__startjobinstance__isnull=False,
                        scenario_instance=scenario_instance).last()
                return openbach_function_instance.started_job.id

            if self.type == ValuesType.SCENARIO_INSTANCE_ID.value:
                queryset = OpenbachFunctionInstance.objects.select_related('started_scenario')
                openbach_function_instance = queryset.filter(
                        openbach_function__function_id=value[-1],
                        openbach_function__startscenarioinstance__isnull=False,
                        scenario_instance=scenario_instance).last()
                return openbach_function_instance.started_scenario.id

        return value


class StopJobInstance(OpenbachFunction):
    openbach_function_id = OpenbachFunctionParameter(type=int)

    @property
    def _json(self):
        return {'stop_job_instance': {
            'openbach_function_id': self.openbach_function_id,
        }}

    def _get_arguments(self, parameters, scenario_instance):
        return {
                'openbach_function_id': self.instance_value('openbach_function_id', parameters),
        }


class StopJobInstances(OpenbachFunction):
    openbach_function_ids = OpenbachFunctionParameter(type=[int])

    @property
    def _json(self):
        return {'stop_job_instances': {
            'openbach_function_ids': self.openbach_function_ids,
        }}

    def _get_arguments(self, parameters, scenario_instance):
        field_name = 'openbach_function_ids'
        stop_ids = self.instance_value(field_name, parameters)
        return {
                field_name: stop_ids,
        }


class RestartJobInstance(OpenbachFunction):
    instance_id = OpenbachFunctionParameter(type=int)
    instance_args = OpenbachFunctionParameter(type=dict)
    date = OpenbachFunctionParameter(type=str)
    interval = OpenbachFunctionParameter(type=int)

    @classmethod
    def build_from_arguments(
            cls, function_id, label,
            scenario, wait_time, arguments):
        instance_id = arguments.pop('instance_id')
        args = arguments.pop('arguments')
        if not isinstance(args, dict):
            raise TypeError(dict, args, instance_id)

        return super().build_from_arguments(
                function_id,
                label,
                scenario,
                wait_time,
                {
                    'instance_id': instance_id,
                    'instance_args': args,
                    **arguments,
                })

    @property
    def _json(self):
        return {'restart_job_instance': {
            'instance_id': self.instance_id,
            'arguments': self.instance_args,
            'date': self.date,
            'interval': self.interval,
        }}

    def _get_arguments(self, parameters, scenario_instance):
        return {
                'instance_id': self.instance_value('instance_id', parameters),
                'arguments': self.instance_value('instance_args', parameters),
                'date': self.instance_value('date', parameters),
                'interval': self.instance_value('interval', parameters),
        }


class StatusJobInstance(OpenbachFunction):
    instance_id = OpenbachFunctionParameter(type=int)
    update = OpenbachFunctionParameter(type=bool)

    @property
    def _json(self):
        return {'status_job_instance': {
            'instance_id': self.instance_id,
            'update': self.update,
        }}

    def _get_arguments(self, parameters, scenario_instance):
        return {
                'instance_id': self.instance_value('instance_id', parameters),
                'update': self.instance_value('update', parameters),
        }


class ListJobInstances(OpenbachFunction):
    addresses = OpenbachFunctionParameter(type=list)
    update = OpenbachFunctionParameter(type=bool)

    @property
    def _json(self):
        return {'status_job_instance': {
            'addresses': self.addresses,
            'update': self.update,
        }}

    def _get_arguments(self, parameters, scenario_instance):
        return {
                'addresses': self.instance_value('addresses', parameters),
                'update': self.instance_value('update', parameters),
        }


class SetLogSeverityJob(OpenbachFunction):
    address = OpenbachFunctionParameter(type=str)
    job_name = OpenbachFunctionParameter(type=str)
    severity = OpenbachFunctionParameter(type=int)
    local_severity = OpenbachFunctionParameter(type=int)
    date = OpenbachFunctionParameter(type=str)

    @property
    def _json(self):
        return {'set_log_severity_job': {
            'address': self.address,
            'job_name': self.job_name,
            'severity': self.severity,
            'local_severity': self.local_severity,
            'date': self.date,
        }}

    def _get_arguments(self, parameters, scenario_instance):
        return {
                'address': self.instance_value('address', parameters),
                'name': self.instance_value('job_name', parameters),
                'severity': self.instance_value('severity', parameters),
                'local_severity': self.instance_value('local_severity', parameters),
                'date': self.instance_value('date', parameters),
        }


class SetStatisticsPolicyJob(OpenbachFunction):
    address = OpenbachFunctionParameter(type=str)
    job_name = OpenbachFunctionParameter(type=str)
    config_file = OpenbachFunctionParameter(type=str)
    stat_name = OpenbachFunctionParameter(type=str)
    local = OpenbachFunctionParameter(type=bool)
    storage = OpenbachFunctionParameter(type=bool)
    broadcast = OpenbachFunctionParameter(type=bool)
    path = OpenbachFunctionParameter(type=str)

    @property
    def _json(self):
        return {'set_log_severity_job': {
            'address': self.address,
            'job_name': self.job_name,
            'config_file': self.config_file,
            'stat_name': self.stat_name,
            'local': self.local,
            'storage': self.storage,
            'broadcast': self.broadcast,
            'path': self.path,
        }}

    def _get_arguments(self, parameters, scenario_instance):
        return {
                'address': self.instance_value('address', parameters),
                'name': self.instance_value('job_name', parameters),
                'config_file': self.instance_value('config_file', parameters),
                'stat_name': self.instance_value('stat_name', parameters),
                'local': self.instance_value('local', parameters),
                'storage': self.instance_value('storage', parameters),
                'broadcast': self.instance_value('broadcast', parameters),
                'path': self.instance_value('path', parameters),
        }


class If(OpenbachFunction):
    condition = models.OneToOneField(
            Condition,
            models.CASCADE,
            related_name='if_function')
    functions_true = OpenbachFunctionParameter(type=list)
    functions_false = OpenbachFunctionParameter(type=list)

    @classmethod
    def build_from_arguments(
            cls, function_id, label,
            scenario, wait_time, arguments):
        condition = Condition.load_from_json(arguments['condition'])
        for name in ('openbach_functions_true_ids', 'openbach_functions_false_ids'):
            functions = arguments[name]
            if not isinstance(functions, list):
                raise TypeError(list, functions, name)

        return super().build_from_arguments(
                function_id,
                label,
                scenario,
                wait_time,
                {
                    'condition': condition,
                    'functions_true': arguments['openbach_functions_true_ids'],
                    'functions_false': arguments['openbach_functions_false_ids'],
                })

    @property
    def _json(self):
        return {'if': {
            'condition': self.condition.json,
            'openbach_function_true_ids': self.functions_true,
            'openbach_function_false_ids': self.functions_false,
        }}

    def _get_arguments(self, parameters, scenario_instance):
        return {
                'condition': self.condition,
                'on_true': self.instance_value('functions_true', parameters),
                'on_false': self.instance_value('functions_false', parameters),
        }


class While(OpenbachFunction):
    condition = models.OneToOneField(
            Condition,
            models.CASCADE,
            related_name='while_function')
    functions_while = OpenbachFunctionParameter(type=list)
    functions_end = OpenbachFunctionParameter(type=list)

    @classmethod
    def build_from_arguments(
            cls, function_id, label,
            scenario, wait_time, arguments):
        condition = Condition.load_from_json(arguments['condition'])
        for name in ('openbach_functions_while_ids', 'openbach_functions_end_ids'):
            functions = arguments[name]
            if not isinstance(functions, list):
                raise TypeError(list, functions, name)

        return super().build_from_arguments(
                function_id,
                label,
                scenario,
                wait_time,
                {
                    'condition': condition,
                    'functions_while': arguments['openbach_functions_while_ids'],
                    'functions_end': arguments['openbach_functions_end_ids'],
                })

    @property
    def _json(self):
        return {'while': {
            'condition': self.condition.json,
            'openbach_function_while_ids': self.functions_while,
            'openbach_function_end_ids': self.functions_end,
        }}

    def _get_arguments(self, parameters, scenario_instance):
        return {
                'condition': self.condition,
                'on_true': self.instance_value('functions_while', parameters),
                'on_false': self.instance_value('functions_end', parameters),
        }


class StartScenarioInstance(OpenbachFunction):
    scenario_name = OpenbachFunctionParameter(type=str)
    arguments = OpenbachFunctionParameter(type=dict)

    def _openbach_function_argument_values(self):
        yield from super()._openbach_function_argument_values()

        arguments = self.arguments
        if isinstance(arguments, dict):
            for name, value in arguments.items():
                yield value

    @property
    def _json(self):
        return {'start_scenario_instance': {
            'scenario_name': self.scenario_name,
            'arguments': self.arguments,
        }}

    def _get_arguments(self, parameters, scenario_instance):
        arguments = {
                field_name: self.instance_value(field_name, parameters)
                for field_name in ('scenario_name', 'arguments')
        }

        checker = OpenbachFunctionParameter.from_type('str')
        args = arguments['arguments']
        for name, value in args.items():
            args[name] = checker.validate_openbach_value(value, parameters)

        project = self.scenario.project
        arguments['project'] = project.name if project else None
        return arguments


class StopScenarioInstance(OpenbachFunction):
    openbach_function_id = OpenbachFunctionParameter(type=int)

    @property
    def _json(self):
        return {'stop_scenario_instance': {
            'openbach_function_id': self.openbach_function_id,
        }}

    def _get_arguments(self, parameters, scenario_instance):
        field_name = 'openbach_function_id'
        return {
                field_name: self.instance_value(field_name, parameters)
        }
