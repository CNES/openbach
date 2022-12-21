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


"""Table descriptions relatives to the OpenBACH's scenarios.

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


from django.db import models, IntegrityError, DataError
from django.utils import timezone
from django.utils.functional import cached_property
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User

from .base_models import Argument, ArgumentValue, ValuesType, OpenbachFunctionParameter
from .job_models import Job, JobArgument, SubcommandJobArgument
from .utils import subcommand_names
from . import openbach_function_models  # So we can getattr from this module
from .openbach_function_models import (  # Shortcuts
        OpenbachFunction, OpenbachFunctionInstance,
        StartJobInstance, StartJobInstanceArgument,
        StartScenarioInstance, FailurePolicy,
        WaitForRunning, WaitForEnded,
        WaitForLaunched, WaitForFinished,
)


def check_required_job_arguments_all_present(subcommand, arguments, error_template):
    required_arguments = subcommand.arguments.filter(
            requiredjobargument__isnull=False).exclude(name__in=arguments)
    if required_arguments.exists():
        raise Scenario.MalformedError(
                error_template.format(required_arguments.first().name),
                override_error='Missing required argument')

    for group in subcommand.groups.all():
        try:
            subcommand = group.subcommands.get(name__in=arguments)
        except SubcommandJobArgument.DoesNotExist:
            if not group.optional:
                raise Scenario.MalformedError(
                        error_template.format(group.name),
                        override_error='Missing subcommand for required group')
        except SubcommandJobArgument.MultipleObjectsReturned:
            raise Scenario.MalformedError(
                    error_template.format(group.name),
                    override_error='Several subcommands provided for the group')
        else:
            check_required_job_arguments_all_present(subcommand, arguments[subcommand.name], error_template)


def extract_start_job_instance_arguments(job, command, arguments, error_template):
    # To avoid a new table in database, and account for
    # subcommands without provided arguments (because none
    # exist or only optional ones without any provided),
    # we explicitly store selected subcommands as
    # StartJobInstanceArguments with no type (null value in DB).
    yield command

    for name, value in arguments.items():
        try:
            subcommand = job.subcommands.get(name=name)
        except SubcommandJobArgument.DoesNotExist:
            try:
                job_argument = command.arguments.get(name=name)
            except JobArgument.DoesNotExist:
                raise Scenario.MalformedError(
                        error_template.format(name),
                        override_error='The configured job does '
                        'not accept the given argument')

            if not isinstance(value, list):
                value = [[value]]
            if not isinstance(value[0], list):
                value = [value]

            for occurrence, values in enumerate(value):
                for val in values:
                    if val is None:
                        raise Scenario.MalformedError(
                                error_template.format(name),
                                override_error='An array of value '
                                'contains gaps for the given argument')
                    if job_argument.type == ValuesType.NONE_TYPE.value:
                        if val:
                            yield occurrence, job_argument, ''
                    else:
                        yield occurrence, job_argument, val
        else:
            yield from extract_start_job_instance_arguments(job, subcommand, value, error_template)


class Scenario(models.Model):
    """Data associated to a Scenario"""

    name = models.CharField(max_length=500)
    description = models.TextField(null=True, blank=True)
    project = models.ForeignKey(
            'Project', models.CASCADE,
            related_name='scenarios')
    favorited_by = models.ManyToManyField(User, related_name='favorites')

    class Meta:
        unique_together = (('name', 'project'))

    class MalformedError(Exception):
        def __init__(self, key, value=None, expected_type=None, override_error=None):
            if value is None:
                message = 'Missing entry \'{}\''.format(key)
                self.error = {
                        'error': 'Missing entry',
                        'offending_entry': key,
                }
            else:
                message = (
                        'Entry \'{}\' has the wrong kind of '
                        'value (expected {} got {})'
                        .format(key, expected_type, value)
                )
                self.error = {
                        'error': 'Type error',
                        'offending_entry': key,
                        'offending_value': value,
                        'expected_type': str(expected_type),
                }
            super().__init__(message)
            if override_error is not None:
                self.error['error'] = override_error

    def __str__(self):
        return self.name

    @property
    def last_version(self):
        try:
            return self._last_version
        except AttributeError:
            self._last_version = version = self.versions.last()
            return version

    @property
    def arguments(self):
        return self.last_version.arguments

    @property
    def constants(self):
        return self.last_version.constants

    @property
    def openbach_functions(self):
        return self.last_version.openbach_functions

    @property
    def instances(self):
        return self.last_version.instances

    @property
    def json(self):
        scenario = self.last_version
        functions = [f.json for f in scenario.openbach_functions.order_by('id')]
        return {
                'name': self.name,
                'description': self.description,
                'arguments': {arg.name: arg.description
                              for arg in scenario.arguments.all()},
                'constants': {const.name: const.value
                              for const in scenario.constants.all()},
                'openbach_functions': functions,
        }

    def load_from_json(self, json_data):
        def extract_value(*keys, expected_type, mandatory=True, default=None):
            data = json_data
            for index, key in enumerate(keys, 1):
                try:
                    data = data[key]
                except KeyError:
                    if not mandatory and index == len(keys):
                        if default is not None:
                            return default
                        return expected_type()
                    raise Scenario.MalformedError(
                            '.'.join(map(str, keys[:index])))
                except TypeError:
                    raise Scenario.MalformedError(
                            '.'.join(map(str, keys[:index - 1])),
                            data, dict)
            if not isinstance(data, expected_type):
                raise Scenario.MalformedError(
                        '.'.join(map(str, keys)),
                        data, expected_type)
            return data

        scenario = ScenarioVersion.objects.create(scenario=self)

        # Extract top-level parameters
        arguments = extract_value('arguments', expected_type=dict, mandatory=False)
        for name, description in arguments.items():
            if not isinstance(name, str):
                raise Scenario.MalformedError('arguments', name, str)
            if not isinstance(description, str):
                raise Scenario.MalformedError(
                        'arguments.{}'.format(name), description, str)
            ScenarioArgument.objects.create(
                    scenario_version=scenario,
                    name=name, description=description)
        constants = extract_value('constants', expected_type=dict, mandatory=False)
        existing_names = scenario.arguments.filter(name__in=list(constants))
        if existing_names:
            keys = ', '.join('constants.{}'.format(arg.name) for arg in existing_names)
            raise Scenario.MalformedError(
                    keys, override_error='Some constants are '
                    'named the same than some arguments')
        for name, value in constants.items():
            if not isinstance(name, str):
                raise Scenario.MalformedError('constants', name, str)
            if not isinstance(value, str):
                raise Scenario.MalformedError(
                        'constants.{}'.format(name), value, str)
            ScenarioConstant.objects.create(
                    scenario_version=scenario,
                    name=name, value=value)

        # Extract OpenBACH Functions definitions
        openbach_functions = extract_value('openbach_functions', expected_type=list)
        # range(len(...)), I know its bad, but I want to enforce type checking
        for index in range(len(openbach_functions)):
            function = extract_value('openbach_functions', index, expected_type=dict)
            wait = extract_value('openbach_functions', index, 'wait', expected_type=dict, mandatory=False)
            json_data['openbach_functions'][index]['wait'] = wait
            wait_time = extract_value(
                    'openbach_functions', index, 'wait', 'time',
                    expected_type=(int, float, str), mandatory=False, default=0)
            id_ = extract_value('openbach_functions', index, 'id', expected_type=int)
            label = extract_value('openbach_functions', index, 'label', expected_type=str, mandatory=False)
            label = json_data['openbach_functions'][index].get('label')  # Type checking is done, extract the real value
            policy = extract_value('openbach_functions', index, 'on_fail', expected_type=dict, mandatory=False)
            json_data['openbach_functions'][index]['on_fail'] = policy
            failure_policy = extract_value('openbach_functions', index, 'on_fail', 'policy', expected_type=str, mandatory=False)
            possible_function_name = [key for key in function if key not in {'wait', 'id', 'label', 'on_fail'}]
            if len(possible_function_name) < 1:
                raise Scenario.MalformedError(
                        'openbach_functions.{}'.format(index), value=function,
                        override_error='The content of the OpenBACH '
                                       'function to launch is missing')
            if len(possible_function_name) > 1:
                raise Scenario.MalformedError(
                        'openbach_functions.{}'.format(index), value=function,
                        override_error='Too much OpenBACH functions configured: {}'
                            .format(', '.join(possible_function_name)))
            function_name, = possible_function_name
            openbach_function_name = ''.join(map(str.title, function_name.split('_')))
            try:
                OpenbachFunctionFactory = getattr(openbach_function_models, openbach_function_name)
            except AttributeError:
                raise Scenario.MalformedError(
                        'openbach_functions.{}.{}'.format(index, function_name),
                        override_error='Unknown OpenBACH Function')
            try:
                openbach_function = OpenbachFunctionFactory.build_from_arguments(
                        id_, label, scenario, wait_time, function[function_name])
            except KeyError as e:
                raise Scenario.MalformedError(
                        'openbach_functions.{}.{}'.format(index, function_name),
                        override_error='Missing entry \'{}\''.format(e))
            except (ValidationError, IntegrityError, DataError, ValueError) as e:
                raise Scenario.MalformedError(
                        'openbach_functions.{}.{}'.format(index, function_name),
                        override_error=str(e))
            except TypeError as e:
                try:
                    expected_type, value, name = e.args
                except ValueError:
                    raise Scenario.MalformedError(
                            'openbach_functions.{}.{}'.format(index, function_name),
                            override_error=str(e))
                else:
                    raise Scenario.MalformedError(
                            'openbach_functions.{}.{}.{}'.format(index, function_name, name),
                            value=value, expected_type=expected_type)

            if failure_policy:
                try:
                    actual_policy = FailurePolicy.Policies[failure_policy.upper()]
                except KeyError:
                    raise Scenario.MalformedError(
                            'openbach_functions.{}.on_fail'.format(index),
                            override_error='Unknown failure policy \'{}\''.format(failure_policy))

                if actual_policy is FailurePolicy.Policies.RETRY:
                    failure_retry = extract_value('openbach_functions', index, 'on_fail', 'retry', expected_type=int)
                    failure_delay = extract_value(
                            'openbach_functions', index, 'on_fail', 'delay',
                            expected_type=(int, float, str), mandatory=False, default=5.0)
                    try:
                        FailurePolicy.objects.create(
                                openbach_function=openbach_function,
                                policy=actual_policy,
                                retry_limit=failure_retry,
                                wait_time=failure_delay)
                    except ValidationError as e:
                        raise Scenario.MalformedError(
                                'openbach_functions.{}.on_fail'.format(index),
                                override_error=str(e))
                else:
                    FailurePolicy.objects.create(openbach_function=openbach_function, policy=actual_policy)

            # Register required and optional arguments for a start_job_instance
            if function_name == 'start_job_instance':
                job_name = openbach_function.job_name
                error_hierarchy = 'openbach_functions.{}.{}.{}'.format(index, function_name, job_name)
                try:
                    job = Job.objects.get(name=job_name)
                except Job.DoesNotExist:
                    raise Scenario.MalformedError(
                            error_hierarchy,
                            override_error='No such job in the controller database: {}'.format(job_name))

                arguments = function[function_name][job_name]
                subcommand = job.subcommands.get(name=None, group=None)
                check_required_job_arguments_all_present(
                        subcommand, arguments, error_hierarchy + '.{}')
                job_arguments = extract_start_job_instance_arguments(
                        job, subcommand, arguments, error_hierarchy + '.{}')
                for subcommand in job_arguments:
                    try:
                        # Test if subcommand is not, in fact, an argument
                        occurrence, job_argument, value = subcommand
                    except TypeError:
                        StartJobInstanceArgument.objects.create(
                                name='', type=None, value='',
                                hierarchy=list(subcommand_names(subcommand)),
                                start_job_instance=openbach_function)
                    else:
                        try:
                            # TODO automate the following line into StartJobInstanceArgument somehow
                            value = OpenbachFunctionParameter.from_type(job_argument.type).get_prep_value(value)
                        except ValidationError as e:
                            raise Scenario.MalformedError(
                                    '{}.{}'.format(error_hierarchy, job_argument.name),
                                    override_error=str(e),
                                    expected_type=job_argument.type,
                                    value=value)
                        StartJobInstanceArgument.objects.create(
                                name=job_argument.name, type=job_argument.type, value=value,
                                hierarchy=list(subcommand_names(job_argument.subcommand)),
                                start_job_instance=openbach_function, occurrence=occurrence)

        # Extract Waits
        # Start again the looping to be sure all referenced
        # indexes have been created
        for index, function in enumerate(openbach_functions):
            def waiter_factory(ids_key, Factory):
                waited = extract_value(
                        'openbach_functions', index, 'wait', ids_key,
                        expected_type=list, mandatory=False)
                for idx, launched_id in enumerate(waited):
                    if not isinstance(launched_id, int):
                        raise Scenario.MalformedError(
                                'openbach_functions.{}.wait.'
                                '{}.{}'.format(index, ids_key, idx),
                                value=launched_id, expected_type=int)
                    try:
                        waited_function = scenario.openbach_functions.get(function_id=launched_id)
                    except OpenbachFunction.DoesNotExist:
                        raise Scenario.MalformedError(
                                'openbach_functions.{}.wait.'
                                'launched_ids.{}'.format(index, idx),
                                value=launched_id, override_error='The '
                                'referenced openbach function does not exist')
                    else:
                        waited_function = waited_function.get_content_model()
                    openbach_function_instance = scenario.openbach_functions.get(
                            function_id=function['id']).get_content_model()
                    Factory.objects.create(
                            openbach_function_waited=waited_function,
                            openbach_function_instance=openbach_function_instance)
            waiter_factory('running_ids', WaitForRunning)
            waiter_factory('ended_ids', WaitForEnded)
            waiter_factory('launched_ids', WaitForLaunched)
            waiter_factory('finished_ids', WaitForFinished)

        # Check that all arguments are used
        scenario_arguments = {
                argument.name: 0
                for argument in scenario.arguments.all()
        }
        scenario_arguments.update(
                (constant.name, 0)
                for constant in scenario.constants.all()
        )

        for openbach_function in scenario.openbach_functions.all():
            try:
                openbach_function.set_arguments_count(scenario_arguments)
            except KeyError as e:
                raise Scenario.MalformedError(
                        'arguments.{}'.format(e),
                        override_error='This argument is used as '
                        'a placeholder value but is not defined')
        for name, count in scenario_arguments.items():
            if not count:
                raise Scenario.MalformedError(
                        'arguments.{}'.format(name),
                        override_error='An argument is unused')


class ScenarioVersionManager(models.Manager):
    """Custom manager to limit database queries when
    dealing with ScenarioVersions.
    """

    def get_queryset(self):
        return super().get_queryset().select_related('scenario')


class ScenarioVersion(models.Model):
    """Data associated to a unique version of a Scenario"""

    scenario = models.ForeignKey(
            Scenario, models.CASCADE,
            related_name='versions')

    # Override default manager
    objects = ScenarioVersionManager()

    def __str__(self):
        return self.scenario.name


class ScenarioInstance(models.Model):
    """Data associated to a Scenario instance"""

    class Status(models.TextChoices):
        SCHEDULING = 'P'
        RUNNING = 'R'
        AGENTS_UNREACHABLE = 'AU'
        FINISHED_KO = 'KO'
        FINISHED_OK = 'OK'
        STOPPED = 'S'

    scenario_version = models.ForeignKey(
            ScenarioVersion, models.CASCADE,
            related_name='instances')
    status = models.CharField(
            max_length=max(map(len, Status.values)),
            choices=Status.choices)
    start_date = models.DateTimeField(null=True, blank=True)
    started_by = models.ForeignKey(
            User, models.CASCADE,
            null=True, blank=True,
            related_name='private_scenario_instances')
    stop_date = models.DateTimeField(null=True, blank=True)
    openbach_function_instance = models.OneToOneField(
            OpenbachFunctionInstance,
            models.CASCADE,
            null=True, blank=True,
            related_name='started_scenario')

    def get_status(self):
        return self.Status(self.status)

    @property
    def is_stopped(self):
        return self.stop_date is not None

    @property
    def scenario(self):
        return self.scenario_version.scenario

    def __str__(self):
        return 'Scenario Instance {}'.format(self.id)

    def stop(self, *, stop_status=None):
        if self.stop_date is None or stop_status is not None:
            self.status = self.Status.STOPPED if stop_status is None else stop_status
            self.stop_date = timezone.now()
            self.save()

    @cached_property
    def parameters(self):
        constants = {
                constant.name: constant.value
                for constant in self.scenario.constants.all()
        }
        constants.update(
                (argument.argument.name, argument.value)
                for argument in self.arguments_values.all()
        )
        return constants

    @property
    def sub_scenario_ids(self):
        return [
                sub_scenario.started_scenario.id for sub_scenario in
                self.openbach_functions_instances.filter(
                    started_scenario__isnull=False).only('started_scenario__id')
        ]

    @property
    def json(self):
        owner_id = self.id
        ofi = self.openbach_function_instance
        while ofi is not None:
            scenario = ofi.scenario_instance
            ofi = scenario.openbach_function_instance
            owner_id = scenario.id

        parameters = [
                {'name': key, 'value': value}
                for key, value in self.parameters.items()
        ]

        functions = [
                openbach_function.json for openbach_function in
                self.openbach_functions_instances.order_by('launch_date')
        ]

        return {
                'project_name': self.scenario.project.name,
                'scenario_name': self.scenario.name,
                'scenario_instance_id': self.id,
                'owner_scenario_instance_id': owner_id,
                'sub_scenario_instance_ids': sorted(self.sub_scenario_ids),
                'status': self.get_status().label,
                'start_date': self.start_date,
                'stop_date': self.stop_date,
                'arguments': parameters,
                'openbach_functions': functions,
        }

    @property
    def limited_json(self):
        return {
                'scenario_name': self.scenario.name,
                'scenario_instance_id': self.id,
                'status': self.get_status().label,
                'start_date': self.start_date,
                'sub_scenario_instance_ids': sorted(self.sub_scenario_ids),
        }


class ScenarioArgument(Argument):
    """Data associated to an Argument for a Scenario"""

    scenario_version = models.ForeignKey(
            ScenarioVersion, models.CASCADE,
            related_name='arguments')

    class Meta:
        unique_together = (('name', 'scenario_version'))

    @property
    def scenario(self):
        return self.scenario_version.scenario


class ScenarioConstant(Argument):
    """Data associated to a Constant for a Scenario"""

    scenario_version = models.ForeignKey(
            ScenarioVersion, models.CASCADE,
            related_name='constants')
    value = models.CharField(max_length=500)

    class Meta:
        unique_together = ('name', 'scenario_version')

    @property
    def scenario(self):
        return self.scenario_version.scenario


class ScenarioArgumentValue(ArgumentValue):
    """Data stored as the value of an Argument for a Scenario"""

    argument = models.ForeignKey(
            ScenarioArgument, models.CASCADE,
            related_name='values')
    scenario_instance = models.ForeignKey(
            ScenarioInstance,
            models.CASCADE,
            related_name='arguments_values')

    class Meta:
        unique_together = ('argument', 'scenario_instance')

    def check_and_set_value(self, value):
        self._check_and_set_value(value, ValuesType.STRING.value)

    def __str__(self):
        return self.value

    def save(self, *args, **kwargs):
        if self.argument.scenario_version != self.scenario_instance.scenario_version:
            raise IntegrityError(
                    'Trying to save a ScenarioArgumentValue '
                    'with the associated ScenarioInstance and '
                    'the associated scenario argument not '
                    'referencing the same Scenario')
        super().save(*args, **kwargs)
