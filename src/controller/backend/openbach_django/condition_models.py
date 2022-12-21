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


"""Table descriptions relatives to the conditions used by some
OpenBACH Functions.

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

import requests
from django.db import models
from django.core.exceptions import MultipleObjectsReturned

from .utils import extract_models
from .base_models import ContentTyped, OpenbachFunctionParameter
from .project_models import Agent


class Operand(ContentTyped):
    """Operand used in comparison operations.

    These comparisons are meant to act as Conditions on
    some OpenBACH Functions and should resolve at runtime.
    Subclasses will need to fetch data into the database
    or the collector, for instance.
    """

    def get_value(self, scenario_id, parameters):
        """Return the value hold by the concrete implementation
        using runtime parameters.
        """
        return self.get_content_model().get_value(scenario_id, parameters)

    def _get_field_value(self, field_name, parameters):
        this = self.get_content_model()
        value = getattr(this, field_name)
        field = this._meta.get_field(field_name)
        if isinstance(field, OpenbachFunctionParameter):
            value = field.validate_openbach_value(value, parameters)
        return value

    def check_field_value(self, parameters):
        self.get_content_model().check_field_value(parameters)

    def save(self, *args, **kwargs):
        """Override the standard Django's save operation to
        make sure we store which concrete implementation was
        used to build the associated object.
        """
        self.set_content_model()
        super().save(*args, **kwargs)

    @property
    def json(self):
        return self.get_content_model().json

    @staticmethod
    def load_from_json(json_data):
        operand_model = OPERAND_TO_MODEL[json_data['type']]
        return operand_model.load_from_json(json_data)


class OperandDatabase(Operand):
    """Operand whose value is fetched at runtime in the database"""

    name = OpenbachFunctionParameter(type=str)
    key = OpenbachFunctionParameter(type=str)
    attribute = OpenbachFunctionParameter(type=str)

    def get_value(self, scenario_id, parameters):
        name = self._get_field_value('name', parameters)
        model_classes = [
                model for model in extract_models(models.Model)
                if model.__name__ == name
        ]
        try:
            model, = model_classes
        except ValueError:
            if not model_classes:
                raise self.DoesNotExist(
                        'No model named \'{}\''.format(self.name))
            raise MultipleObjectsReturned(
                    'Ambiguous name \'{}\' refer to '
                    'too many models'.format(self.name))
        key = self._get_field_value('key', parameters)
        data = model.objects.get(pk=key)
        attribute = self._get_field_value('attribute', parameters)
        return getattr(data, attribute)

    def check_field_value(self, parameters):
        self._get_field_value('name', parameters)
        self._get_field_value('key', parameters)
        self._get_field_value('attribute', parameters)

    @property
    def json(self):
        return {
                'type': 'database',
                'name': self.name,
                'key': self.key,
                'attribute': self.attribute,
        }

    @classmethod
    def load_from_json(cls, json_data):
        name = json_data['name']
        key = json_data['key']
        attribute = json_data['attribute']
        return cls.objects.create(name=name, key=key, attribute=attribute)


class OperandValue(Operand):
    """Operand whose value is constant and provided at build time"""

    value = OpenbachFunctionParameter(type=str)

    def get_value(self, scenario_id, parameters):
        origin_value = self._get_field_value('value', self.value, parameters)
        value = origin_value.lower()
        if value == 'true':
            return True
        if value == 'false':
            return False

        for converter in (int, float):
            with suppress(ValueError):
                return converter(value)

        return origin_value

    def check_field_value(self, parameters):
        self._get_field_value('value', parameters)

    @property
    def json(self):
        return {
                'type': 'value',
                'value': self.value,
        }

    @property
    def load_from_json(cls, json_data):
        value = json_data['value']
        return cls.objects.create(value=value)


class OperandStatistic(Operand):
    """Operand whose value is fetched at runtime in the collector"""

    field = OpenbachFunctionParameter(type=str)
    job_name = OpenbachFunctionParameter(type=str)
    agent_address = OpenbachFunctionParameter(type=str)

    def get_value(self, scenario_id, parameters):
        job_name = self._get_field_value('job_name', self.job_name, parameters)
        agent_ip = self.agent_address
        agent_ip = self._get_field_value('agent_address', agent_ip, parameters)
        agent = Agent.objects.get(address=agent_ip)
        collector = agent.collector
        field_name = self._get_field_value('field', self.field, parameters)
        url = 'http://{0.address}:{0.stats_query_port}/query'.format(collector)
        parameters = {
                'db': collector.stats_database_name,
                'epoch': collector.stats_database_precision,
                'q': 'SELECT last("{}") FROM "{}" '
                     'WHERE "@agent_name" = \'{}\' '
                     'AND @scenario_instance_id = \'{}\''
                     .format(field_name, job_name, agent.name, scenario_id),
        }

        result = requests.get(url, params=parameters).json()
        try:
            columns = result['results'][0]['series'][0]['columns']
            values = result['results'][0]['series'][0]['values'][0]
        except KeyError:
            raise self.DoesNotExist(
                    'Required Stats doesn\'t exist in the Database')

        for column, value in zip(columns, values):
            if column == 'last':
                return value

    def check_field_value(self, parameters):
        self._get_field_value('job_name', parameters)
        self._get_field_value('agent_address', parameters)
        self._get_field_value('field', parameters)

    @property
    def json(self):
        return {
                'type': 'statistic',
                'field': self.field,
                'job_name': self.job_name,
                'agent_address': self.agent_address,
        }

    @classmethod
    def load_from_json(cls, json_data):
        field = json_data['field']
        name = json_data['job_name']
        agent = json_data['agent_address']
        return cls.objects.create(
                field=field,
                job_name=name,
                agent_address=agent)


class Condition(ContentTyped):
    """Condition used by some OpenBACH Functions
    to branch in a Scenario execution.
    """

    def get_value(self, scenario_id, parameters):
        """Return the value hold by the concrete implementation"""
        return self.get_content_model().get_value(scenario_id, parameters)

    def check_field_value(self, parameters):
        self.get_content_model().check_field_value(parameters)

    def save(self, *args, **kwargs):
        """Override the standard Django's save operation to
        make sure we store which concrete implementation was
        used to build the associated object.
        """
        self.set_content_model()
        super().save(*args, **kwargs)

    @property
    def json(self):
        return self.get_content_model().json

    @staticmethod
    def load_from_json(json_data):
        condition_model = OPERATOR_TO_MODEL[json_data['type']]
        return condition_model.load_from_json(json_data)


class ConditionNot(Condition):
    """Condition that negate an other condition"""

    condition = models.ForeignKey(
            Condition,
            models.CASCADE,
            related_name='+')

    def get_value(self, scenario_id, parameters):
        return not self.condition.get_value(scenario_id, parameters)

    def check_field_value(self, parameters):
        self.condition.check_field_value(parameters)

    @property
    def json(self):
        return {
                'type': 'not',
                'condition': self.condition.json,
        }

    @classmethod
    def load_from_json(cls, json_data):
        condition_json = json_data['condition']
        condition_instance = Condition.load_from_json(condition_json)
        return cls.objects.create(condition=condition_instance)


class _TwoConditions(Condition):
    """Abstract base class that factorize common behaviour
    between conditions expecting two other conditions.
    """

    left_condition = models.ForeignKey(
            Condition,
            models.CASCADE,
            related_name='+')
    right_condition = models.ForeignKey(
            Condition,
            models.CASCADE,
            related_name='+')

    class Meta:
        abstract = True

    def check_field_value(self, parameters):
        self.left_condition.check_field_value(parameters)
        self.right_condition.check_field_value(parameters)

    @property
    def json(self):
        return {
                'type': self.TYPE,
                'left_condition': self.left_condition.json,
                'right_condition': self.right_condition.json,
        }

    @classmethod
    def load_from_json(cls, json_data):
        left_json = json_data['left_condition']
        right_json = json_data['right_condition']
        left_instance = Condition.load_from_json(left_json)
        right_instance = Condition.load_from_json(right_json)
        return cls.objects.create(
                left_condition=left_instance,
                right_condition=right_instance)


class ConditionOr(_TwoConditions):
    """Condition that is true if either one of two other conditions is true"""

    TYPE = 'or'

    def get_value(self, scenario_id, parameters):
        return (
                self.left_condition.get_value(scenario_id, parameters) or
                self.right_condition.get_value(scenario_id, parameters)
        )


class ConditionAnd(_TwoConditions):
    """Condition that is true if both of two other conditions are true"""

    TYPE = 'and'

    def get_value(self, scenario_id, parameters):
        return (
                self.left_condition.get_value(scenario_id, parameters) and
                self.right_condition.get_value(scenario_id, parameters)
        )


class ConditionXor(_TwoConditions):
    """Condition that is true if only one of two other conditions is true"""

    TYPE = 'xor'

    def get_value(self, scenario_id, parameters):
        left = self.left_condition.get_value(scenario_id, parameters)
        right = self.right_condition.get_value(scenario_id, parameters)
        return (left or right) and not (left and right)


class _TwoOperands(Condition):
    """Abstract base class that factorize common behaviour
    between conditions expecting two operands.
    """

    left_operand = models.ForeignKey(
            Operand,
            models.CASCADE,
            related_name='+')
    right_operand = models.ForeignKey(
            Operand,
            models.CASCADE,
            related_name='+')

    class Meta:
        abstract = True

    def check_field_value(self, parameters):
        self.left_operand.check_field_value(parameters)
        self.right_operand.check_field_value(parameters)

    @property
    def json(self):
        return {
                'type': self.TYPE,
                'left_operand': self.left_operand.json,
                'right_operand': self.right_operand.json,
        }

    @classmethod
    def load_from_json(cls, json_data):
        left_json = json_data['left_operand']
        right_json = json_data['right_operand']
        left_instance = Operand.load_from_json(left_json)
        right_instance = Operand.load_from_json(right_json)
        return cls.objects.create(
                left_operand=left_instance,
                right_operand=right_instance)


class ConditionEqual(_TwoOperands):
    """Condition that is true if the value of two operands are equal"""

    TYPE = '='

    def get_value(self, scenario_id, parameters):
        return (
                self.left_operand.get_value(scenario_id, parameters) ==
                self.right_operand.get_value(scenario_id, parameters)
        )


class ConditionUnequal(_TwoOperands):
    """Condition that is true if the value of two operands are different"""

    TYPE = '!='

    def get_value(self, scenario_id, parameters):
        return (
                self.left_operand.get_value(scenario_id, parameters) !=
                self.right_operand.get_value(scenario_id, parameters)
        )


class ConditionLowerOrEqual(_TwoOperands):
    """Condition that is true if the value of the left operand
    is lower or equal than the value of the right operand.
    """

    TYPE = '<='

    def get_value(self, scenario_id, parameters):
        return (
                self.left_operand.get_value(scenario_id, parameters) <=
                self.right_operand.get_value(scenario_id, parameters)
        )


class ConditionLower(_TwoOperands):
    """Condition that is true if the value of the left
    operand is lower than the value of the right operand.
    """

    TYPE = '<'

    def get_value(self, scenario_id, parameters):
        return (
                self.left_operand.get_value(scenario_id, parameters) <
                self.right_operand.get_value(scenario_id, parameters)
        )


class ConditionGreaterOrEqual(_TwoOperands):
    """Condition that is true if the value of the left operand
    is greater or equal than the value of the right operand.
    """

    TYPE = '>='

    def get_value(self, scenario_id, parameters):
        return (
                self.left_operand.get_value(scenario_id, parameters) >=
                self.right_operand.get_value(scenario_id, parameters)
        )


class ConditionGreater(_TwoOperands):
    """Condition that is true if the value of the left
    operand is greater than the value of the right operand.
    """

    TYPE = '>'

    def get_value(self, scenario_id, parameters):
        return (
                self.left_operand.get_value(scenario_id, parameters) >
                self.right_operand.get_value(scenario_id, parameters)
        )


OPERATOR_TO_MODEL = {
        'not': ConditionNot,
        'and': ConditionAnd,
        'or': ConditionOr,
        'xor': ConditionXor,
        '=': ConditionEqual,
        '==': ConditionEqual,
        '<>': ConditionUnequal,
        '!=': ConditionUnequal,
        '>=': ConditionGreaterOrEqual,
        '>': ConditionGreater,
        '<=': ConditionLowerOrEqual,
        '<': ConditionLower,
}
OPERAND_TO_MODEL = {
        'database': OperandDatabase,
        'value': OperandValue,
        'statistic': OperandStatistic,
}
