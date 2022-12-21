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


"""Base classes to help build a complete Database model"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Adrien THIBAUD <adrien.thibaud@toulouse.viveris.com>
 * Mathias ETTINGER <mathias.ettinger@toulouse.viveris.com>
'''


import enum
import json
import shlex
import string
import ipaddress

from django.db import models
from django.core.exceptions import ValidationError


class ValuesType(enum.Enum):
    INTEGER = 'int'
    STRING = 'str'
    FLOATING_POINT_NUMBER = 'float'
    IP_ADDRESS = 'ip'
    IP_NETWORK = 'network'
    NONE_TYPE = 'None'
    JOB_INSTANCE_ID = 'job'
    SCENARIO_INSTANCE_ID = 'scenario'

    @classmethod
    def choices(cls):
        return tuple((t.value, t.name) for t in cls)


class OpenbachFunctionParameter(models.TextField):
    """Custom field type to ease usage of placeholders in parameters values"""

    _TYPES = {
            ValuesType.INTEGER: int,
            ValuesType.STRING: str,
            ValuesType.FLOATING_POINT_NUMBER: float,
            ValuesType.IP_ADDRESS: (ipaddress.IPv4Address, ipaddress.IPv6Address),
            ValuesType.IP_NETWORK: (ipaddress.IPv4Interface, ipaddress.IPv6Interface),
            ValuesType.NONE_TYPE: type(None),
            ValuesType.JOB_INSTANCE_ID: [int],
            ValuesType.SCENARIO_INSTANCE_ID: [int],
    }

    _CONVERTER = {
            type(None): lambda x: True,
            dict: json.loads,
            list: shlex.split,
            (ipaddress.IPv4Address, ipaddress.IPv6Address): ipaddress.ip_address,
            (ipaddress.IPv4Interface, ipaddress.IPv6Interface): ipaddress.ip_interface,
    }

    def __init__(self, *args, **kwargs):
        type_ = kwargs.pop('type', type(None))

        try:
            if isinstance(type_, list):
                t, = type_  # Can raise ValueError if len != 1
            else:
                t = type_
            isinstance(None, t)  # Can raise TypeError if t is not a type, a tuple of types or a union
        except (ValueError, TypeError):
            raise TypeError('type parameter should be a type, a tuple of types, a union or a list of one of them')

        self.type = type_
        kwargs['default'] = None
        super().__init__(*args, **kwargs)

    def deconstruct(self):
        """Return enough information to recreate the field as a 4-tuple;
        for serialization purposes (migrations).
        """
        name, path, args, kwargs = super().deconstruct()
        kwargs['type'] = self.type
        del kwargs['default']
        return name, path, args, kwargs

    @classmethod
    def from_type(cls, kind):
        return cls(type=cls._TYPES[ValuesType(kind)])

    @staticmethod
    def placeholders(value):
        if not isinstance(value, str):
            return

        templated = string.Template(value)
        for match in templated.pattern.finditer(templated.template):
            escaped, named, braced, invalid = match.groups()
            if invalid is not None:
                raise ValidationError(
                        'value uses the placeholder escape '
                        'symbol ($) but does not provide a '
                        'valid identifier', code='invalid_template')
            if named is not None:
                yield named
            if braced is not None:
                yield braced

    @staticmethod
    def has_placeholders(value):
        return any(OpenbachFunctionParameter.placeholders(value))

    def validate_openbach_value(self, value, parameters):
        """Interpolate placeholders of the stored value to
        provide the actual value of this field.
        """
        if value is None:
            return value

        if parameters is None:
            return self._convert_from_db_value(value, loose=True)

        templated = string.Template(self.get_prep_value(value))
        try:
            value = templated.substitute(parameters)
        except KeyError as e:
            raise ValidationError(
                    'value contains a placeholder (%(key)s) '
                    'that is not found in provided parameters',
                    code='invalid_placeholder',
                    params={'key': str(e)})
        except ValueError:
            raise ValidationError(
                    'value contains an invalid placeholder',
                    code='invalid_placeholder')

        return self._convert_from_db_value(value)

    def from_db_value(self, value, *args):
        """Convert a value from the database into its Python counterpart"""
        if value is None:
            return value

        return self._convert_from_db_value(value, self.has_placeholders(value))

    def _convert_from_db_value(self, value, loose=False):
        """Helper function that perform the actual convertion between
        database values and Python values.
        """
        if isinstance(self.type, list):
            self.type, = self.type
            try:
                return [
                        self._convert_from_db_value(v, loose)
                        for v in self._CONVERTER[list](value)
                ]
            finally:
                self.type = [self.type]

        try:
            return self._CONVERTER.get(self.type, self.type)(value)
        except (ValueError, KeyError):
            if loose:
                return value
            if isinstance(self.type, tuple):
                expected = ' or '.join(t.__name__ for t in self.type)
            else:
                expected = self.type.__name__
            raise ValidationError(
                    'value has an invalid type \'%(real_type)s\' '
                    'should be \'%(expected_type)s\'',
                    code='invalid',
                    params={
                        'real_type': value.__class__.__name__,
                        'expected_type': expected
                    })

    def to_python(self, value):
        """Convert the value of this field into its Python representation"""
        if isinstance(self.type, list):
            type_, = self.type
            if isinstance(value, list):
                if all(isinstance(v, type_) for v in value):
                    return value
                value = ' '.join(shlex.quote(str(v)) for v in value)
        elif value is None or isinstance(value, self.type):
            return value

        return self.from_db_value(value)

    def get_prep_value(self, value):
        """Prepare the value so it can be inserted in the database"""
        # Do not let TextField prepare the value (cast to str) or
        # you won't be able to parse it back for lists and dicts
        value = super(models.TextField, self).get_prep_value(value)
        if value is None:
            return value
        value = self.to_python(value)
        if self.type == dict:
            return json.dumps(value)
        if self.type == list or isinstance(self.type, list):
            return ' '.join(shlex.quote(str(val)) for val in value)
        # Now let TextField convert it to a str representation
        return super().to_python(value)


# Keep historical model for migrations to work properly
class OpenbachFunctionArgument(models.CharField):
    """Custom field type to ease usage of placeholders in parameters values"""

    _TYPES = {
            ValuesType.INTEGER: int,
            ValuesType.STRING: str,
            ValuesType.FLOATING_POINT_NUMBER: float,
            ValuesType.IP_ADDRESS: ipaddress._BaseAddress,
            ValuesType.NONE_TYPE: type(None),
            ValuesType.JOB_INSTANCE_ID: [int],
            ValuesType.SCENARIO_INSTANCE_ID: [int],
    }

    _CONVERTER = {
            type(None): lambda x: True,
            dict: json.loads,
            list: shlex.split,
            ipaddress._BaseAddress: ipaddress.ip_address,
    }

    def __init__(self, *args, **kwargs):
        kwargs.setdefault('max_length', 500)
        type_ = kwargs.pop('type', type(None))

        if not isinstance(type_, type) and not (isinstance(type_, list) and len(type_) == 1 and isinstance(type_[0], type)):
            raise TypeError('type parameter should be a class or a list of one class')

        self.type = type_
        kwargs['default'] = None
        super().__init__(*args, **kwargs)

    def deconstruct(self):
        """Return enough information to recreate the field as a 4-tuple;
        for serialization purposes (migrations).
        """
        name, path, args, kwargs = super().deconstruct()
        kwargs['type'] = self.type
        del kwargs['default']
        if kwargs['max_length'] == 500:
            del kwargs['max_length']
        return name, path, args, kwargs

    @classmethod
    def from_type(cls, kind):
        return cls(type=cls._TYPES[ValuesType(kind)])

    @staticmethod
    def placeholders(value):
        if not isinstance(value, str):
            return

        templated = string.Template(value)
        for match in templated.pattern.finditer(templated.template):
            escaped, named, braced, invalid = match.groups()
            if invalid is not None:
                raise ValidationError(
                        'value uses the placeholder escape '
                        'symbol ($) but does not provide a '
                        'valid identifier', code='invalid_template')
            if named is not None:
                yield named
            if braced is not None:
                yield braced

    @staticmethod
    def has_placeholders(value):
        return any(OpenbachFunctionArgument.placeholders(value))

    def validate_openbach_value(self, value, parameters):
        """Interpolate placeholders of the stored value to
        provide the actual value of this field.
        """
        if value is None:
            return value

        if parameters is None:
            return self._convert_from_db_value(value, loose=True)

        templated = string.Template(self.get_prep_value(value))
        try:
            value = templated.substitute(parameters)
        except KeyError as e:
            raise ValidationError(
                    'value contains a placeholder (%(key)s) '
                    'that is not found in provided parameters',
                    code='invalid_placeholder',
                    params={'key': str(e)})
        except ValueError:
            raise ValidationError(
                    'value contains an invalid placeholder',
                    code='invalid_placeholder')

        return self._convert_from_db_value(value)

    def from_db_value(self, value, *args):
        """Convert a value from the database into its Python counterpart"""
        if value is None:
            return value

        return self._convert_from_db_value(value, self.has_placeholders(value))

    def _convert_from_db_value(self, value, loose=False):
        """Helper function that perform the actual convertion between
        database values and Python values.
        """
        if isinstance(self.type, list):
            self.type, = self.type
            try:
                return [
                        self._convert_from_db_value(v, loose)
                        for v in self._CONVERTER[list](value)
                ]
            finally:
                self.type = [self.type]

        try:
            return self._CONVERTER.get(self.type, self.type)(value)
        except (ValueError, KeyError):
            if loose:
                return value
            raise ValidationError(
                    'value has an invalid type \'%(real_type)s\' '
                    'should be \'%(expected_type)s\'',
                    code='invalid',
                    params={
                        'real_type': value.__class__.__name__,
                        'expected_type': self.type.__name__,
                    })

    def to_python(self, value):
        """Convert the value of this field into its Python representation"""
        if isinstance(self.type, list):
            type_, = self.type
            if isinstance(value, list):
                if all(isinstance(v, type_) for v in value):
                    return value
                value = ' '.join(shlex.quote(str(v)) for v in value)
        elif value is None or isinstance(value, self.type):
            return value

        return self.from_db_value(value)

    def get_prep_value(self, value):
        """Prepare the value so it can be inserted in the database"""
        # Do not let CharField prepare the value (cast to str) or
        # you won't be able to parse it back for lists and dicts
        value = super(models.CharField, self).get_prep_value(value)
        if value is None:
            return value
        value = self.to_python(value)
        if self.type == dict:
            return json.dumps(value)
        if self.type == list or isinstance(self.type, list):
            return ' '.join(shlex.quote(str(val)) for val in value)
        return str(value)


class ContentTyped(models.Model):
    """Abstract base class for tables acting as abstract base classes.

    A ContentTyped class usually have several concrete implementations
    that are hard to retrieve at runtime so this class help to remember
    which concrete class was used to build the actual object.
    """

    content_model = models.CharField(editable=False, max_length=50, null=True)

    class Meta:
        abstract = True

    def concrete_base(self):
        """Inspect the inheritance chain and retrieve the
        first class in the hierarchy that is a subclass of
        ContentTyped but is not marked abstract.
        """
        klass = self.__class__
        for kls in reversed(klass.__mro__):
            if issubclass(kls, ContentTyped) and not kls._meta.abstract:
                return kls
        return klass

    def set_content_model(self):
        """Set content_model to the child class's related name,
        or None if this is the base class.
        """
        is_base_class = self.concrete_base() == self.__class__
        self.content_model = (
            None if is_base_class else self._meta.object_name.lower())

    def get_content_model(self):
        """Return content model, or an error if it is the base class"""
        if self.content_model:
            return getattr(self, self.content_model)
        raise NotImplementedError


class ArgumentValue(models.Model):
    """Data stored as the value of an Argument"""

    argument_value_id = models.AutoField(primary_key=True)
    value = models.CharField(max_length=500)

    def _check_and_set_value(self, value, value_type):
        kind = ValuesType(value_type)
        if kind in (ValuesType.JOB_INSTANCE_ID, ValuesType.SCENARIO_INSTANCE_ID):
            # These kind of arguments should have been converted
            # to the actual ID by now. So adapt their type in
            # order to avoid missmatches between the expected [int]
            # value and the provided int.
            value_type = ValuesType.INTEGER.value
        checker = OpenbachFunctionParameter.from_type(value_type)
        self.value = checker.get_prep_value(value)

    def __str__(self):
        return self.value


class Argument(models.Model):
    """Data associated to a generic Argument"""

    name = models.CharField(max_length=500)
    description = models.TextField(null=True, blank=True)

    class Meta:
        abstract = True

    def __str__(self):
        return self.name
