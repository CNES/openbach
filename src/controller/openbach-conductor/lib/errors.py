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


"""Module grouping the exceptions that the OpenBACH conductor can emit.

Each exception can be converted to a JSON response with a specific
return code associated to each kind of error.
"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Mathias ETTINGER <mathias.ettinger@toulouse.viveris.com>
'''


class ConductorError(Exception):
    """Generic purpose error: something went wrong"""

    ERROR_CODE = 500

    def __init__(self, reason, **kwargs):
        super().__init__(reason)
        kwargs.update({'error': reason})
        self.error = kwargs

    @property
    def json(self):
        """Format this exception as a JSON response for the frontend"""
        return {
                'response': self.error,
                'returncode': self.ERROR_CODE,
        }

    @classmethod
    def copy_from(cls, json_data):
        """Build a new error based on an existing one or its JSON representation"""
        if isinstance(json_data, ConductorError):
            json_data = json_data.json
        response = json_data['response']
        return_code = json_data['returncode']
        reason = response.pop('error')
        self = cls(reason, **response)
        self.ERROR_CODE = return_code
        return self


class ForbiddenError(ConductorError):
    """Error dedicated to actions requiring privileges that the user doesn't have"""
    ERROR_CODE = 403

    def __init__(self, reason, originated_by, **kwargs):
        author = None
        if originated_by.is_authenticated:
            author = originated_by.get_username()
        super().__init__(reason, originated_by=author, **kwargs)


class NotFoundError(ConductorError):
    """Error dedicated to objects not found in the database"""
    ERROR_CODE = 404


class ConflictError(ConductorError):
    """Error dedicated to conflict of resources"""
    ERROR_CODE = 409


class BadRequestError(ConductorError):
    """Error dedicated to input arguments parsing"""
    ERROR_CODE = 400


class UnprocessableError(ConductorError):
    """Error dedicated to requests that fail even though arguments are well formed"""
    ERROR_CODE = 422


class UnreachableError(UnprocessableError):
    """Error dedicated to requests that fail because an other component (mostly the agent) could not be reached"""
    pass


class ConductorWarning(ConductorError):
    """Exception dedicated to control flow allowing to
    set custom message in commands results.
    """

    def __init__(self, reason, custom_status_code=200, **kwargs):
        super().__init__(reason, **kwargs)
        self.ERROR_CODE = custom_status_code
        self.error['warning'] = self.error.pop('error')
