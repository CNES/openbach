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


"""Table descriptions relatives to the results of long-running
requests to the backend.

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

import os.path
import json

from django.db import models
from django.utils import timezone

from .utils import nullable_json


class CommandResult(models.Model):
    """State of a requested action.

    This model is used to store information pertaining to
    a request that was handled but whose result is not yet
    available (a 204 status code was returned). The user
    will then be able to ask the backend for these results.
    """

    response = models.TextField(default='{"state": "Running"}')
    returncode = models.IntegerField(default=202)
    date = models.DateTimeField(default=timezone.now)

    def reset(self):
        self.response = '{"state": "Running"}'
        self.returncode = 202
        self.date = timezone.now()
        self.save()

    def update(self, response, return_code):
        if isinstance(response, str):
            self.response = response
        else:
            self.response = json.dumps(response)
        self.returncode = return_code
        # self.date = timezone.now()
        self.save()

    @property
    def json(self):
        return {
                'response': json.loads(self.response),
                'returncode': self.returncode,
                'last_operation_date': self.date,
        }


class CollectorCommandResult(models.Model):
    """State of actions allowed on a Collector"""

    address = models.CharField(max_length=500, primary_key=True)
    status_add = models.ForeignKey(
            CommandResult,
            models.SET_NULL,
            null=True, blank=True,
            related_name='+')
    status_modify = models.ForeignKey(
            CommandResult,
            models.SET_NULL,
            null=True, blank=True,
            related_name='+')
    status_del = models.ForeignKey(
            CommandResult,
            models.SET_NULL,
            null=True, blank=True,
            related_name='+')

    @property
    def json(self):
        return {
                'add': nullable_json(self.status_add),
                'modify': nullable_json(self.status_modify),
                'del': nullable_json(self.status_del),
        }


class AgentCommandResult(models.Model):
    """State of actions allowed on a Agent"""

    address = models.CharField(max_length=500, primary_key=True)
    status_install = models.ForeignKey(
            CommandResult,
            models.SET_NULL,
            null=True, blank=True,
            related_name='+')
    status_uninstall = models.ForeignKey(
            CommandResult,
            models.SET_NULL,
            null=True, blank=True,
            related_name='+')
    status_assign = models.ForeignKey(
            CommandResult,
            models.SET_NULL,
            null=True, blank=True,
            related_name='+')
    status_log_severity = models.ForeignKey(
            CommandResult,
            models.SET_NULL,
            null=True, blank=True,
            related_name='+')

    @property
    def json(self):
        return {
                'install': nullable_json(self.status_install),
                'uninstall': nullable_json(self.status_uninstall),
                'assign_collector': nullable_json(self.status_assign),
                'log_severity': nullable_json(self.status_log_severity),
        }


class FileCommandResult(CommandResult):
    """State of a requested "push file" action"""

    filename = models.CharField(max_length=500)
    remote_path = models.CharField(max_length=500)
    address = models.CharField(max_length=500)

    class Meta:
        unique_together = ('filename', 'address', 'remote_path')

    @property
    def json(self):
        json = super().json
        json['stored_at'] = os.path.join(self.remote_path, self.filename)
        json['address'] = self.address
        return json


class InstalledJobCommandResult(models.Model):
    """State of actions allowed on a Job"""

    address = models.CharField(max_length=500)
    job_name = models.CharField(max_length=500)
    status_install = models.ForeignKey(
            CommandResult,
            models.SET_NULL,
            null=True, blank=True,
            related_name='+')
    status_uninstall = models.ForeignKey(
            CommandResult,
            models.SET_NULL,
            null=True, blank=True,
            related_name='+')
    status_log_severity = models.ForeignKey(
            CommandResult,
            models.SET_NULL,
            null=True, blank=True,
            related_name='+')
    status_stat_policy = models.ForeignKey(
            CommandResult,
            models.SET_NULL,
            null=True, blank=True,
            related_name='+')

    class Meta:
        unique_together = ('address', 'job_name')

    @property
    def json(self):
        return {
                'install': nullable_json(self.status_install),
                'uninstall': nullable_json(self.status_uninstall),
                'log_severity': nullable_json(self.status_log_severity),
                'stat_policy': nullable_json(self.status_stat_policy),
        }


class JobInstanceCommandResult(models.Model):
    """State of actions allowed on a Job instance"""

    job_instance_id = models.IntegerField(primary_key=True)
    status_start = models.ForeignKey(
            CommandResult,
            models.SET_NULL,
            null=True, blank=True,
            related_name='+')
    status_stop = models.ForeignKey(
            CommandResult,
            models.SET_NULL,
            null=True, blank=True,
            related_name='+')
    status_restart = models.ForeignKey(
            CommandResult,
            models.SET_NULL,
            null=True, blank=True,
            related_name='+')

    @property
    def json(self):
        return {
                'start': nullable_json(self.status_start),
                'stop': nullable_json(self.status_stop),
                'restart': nullable_json(self.status_restart),
        }
