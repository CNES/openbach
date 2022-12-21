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
 * Léa THIBOUT <lea.thibout@viveris.fr>
'''


import os
import re
import csv
import shutil
import syslog
import tarfile
import operator
import tempfile
import threading
import itertools
import traceback
import configparser
from time import sleep
from pathlib import Path
from functools import wraps
from datetime import datetime
from contextlib import suppress
from ipaddress import IPv4Network
from collections import defaultdict, Counter

import yaml
import numpy
from fuzzywuzzy import fuzz
from pkg_resources import parse_version as version
from django import db
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User, AnonymousUser

from data_access import Timeout
from data_access.elasticsearch_tools import ElasticSearchConnection
from data_access.influxdb_tools import InfluxDBConnection, ConditionTag, Operator, parse_influx
from data_access.post_processing import Statistics
from openbach_django.models import (
        CommandResult, CollectorCommandResult, Collector,
        AgentCommandResult, Agent, Job, Keyword,
        ArgumentChoice, SubcommandGroupArgument,
        Statistic, OsCommand, Entity, Network, Interface,
        PotentialNetwork, RequiredJobArgument,
        OptionalJobArgument, InstalledJob,
        InstalledJobCommandResult, JobInstance,
        JobInstanceCommandResult, StatisticInstance,
        ScenarioInstance, OpenbachFunctionInstance,
        Scenario, Project, FileCommandResult,
        ScenarioArgument, ScenarioArgumentValue,
        StartJobInstance as OpenbachFunctionStartJobInstance,
        StartScenarioInstance as OpenbachFunctionStartScenarioInstance,
)
from openbach_django.utils import user_to_json
from . import errors, external_jobs
from .playbook_builder import start_playbook
from .openbach_communicator import OpenBachBaton, OpenBachClapperBoard


TOPOLOGY_WORKERS = 10
_SEVERITY_MAPPING = {
    1: 3,   # Error
    2: 4,   # Warning
    3: 6,   # Informational
    4: 7,   # Debug
}


def convert_severity(severity):
    """Convert the syslog severity to the equivalent openbach severity"""
    return _SEVERITY_MAPPING.get(severity)


def get_master_scenario_id(scenario_id):
    """Get all the way up to the sub-scenario chain to retrieve
    the ID of the root Scenario.

    If `scenario_id` is neither the ID of a Scenario nor the ID
    of a subscenario, returns itself.
    """
    try:
        scenario = ScenarioInstance.objects.get(id=scenario_id)
    except ScenarioInstance.DoesNotExist:
        return scenario_id

    while scenario.openbach_function_instance is not None:
        scenario = scenario.openbach_function_instance.scenario_instance
    return scenario.id


def extract_and_check_name_from_json(json_data, existing_name=None, *, kind):
    """Retrieve the `name` attribute from a JSON data and check that
    it matches the provided name, if any.

    This function is aimed at simplifying the first check on a Project
    or a Scenario creation/modification.
    """
    try:
        name = json_data['name']
    except KeyError:
        if existing_name is None:
            raise errors.BadRequestError(
                    'You must provide a name to create a {}'.format(kind))
        else:
            kwargs = {kind.lower(): existing_name}
            raise errors.BadRequestError(
                    'The {0} data to modify an existing {0} '
                    'does not contain the {0} name.'.format(kind),
                    **kwargs)

    if existing_name is not None and name != existing_name:
        lower_type = kind.lower()
        kwargs = {lower_type: existing_name, 'name': name}
        raise errors.BadRequestError(
                'The name in the {} data does not match '
                'with the name of the {}.'.format(kind, lower_type),
                **kwargs)
    return name


def require_connected_user(*, admin=False):
    """Decorator factory aimed at restricting actions based on connected users"""
    def decorator(method):
        """Decorate a method to check the privileges of the
        connected user before executing it.
        """
        if admin:
            @wraps(method)
            def wrapper(self):
                """Method wrapper that check if the connected
                user is registered and has admin privileges.
                """
                if not self.connected_user.is_staff:
                    raise errors.ForbiddenError(
                            'Unsufficient privileges: an admin account '
                            'is necessary to perform this action',
                            self.connected_user)
                if not self.connected_user.is_active:
                    raise errors.ForbiddenError(
                            'Unsufficient privileges: your user account '
                            'has not been activated yet. Please contact '
                            'your administrator.',
                            self.connected_user)
                return method(self)
        else:
            @wraps(method)
            def wrapper(self):
                """Method wrapper that check if the connected user is registered"""
                if not self.connected_user.is_active:
                    raise errors.ForbiddenError(
                            'Unsufficient privileges: your user account '
                            'has not been activated yet. Please contact '
                            'your administrator.',
                            self.connected_user)
                return method(self)
        return wrapper
    return decorator


class ConductorAction:
    """Base Template class that correspond to an action supported
    by the conductor.

    Subclasses are usually directly mapped to a route that the
    backend handles and will perform the requested action.
    """

    def __init__(self, **kwargs):
        self.openbach_function_instance = None
        self.connected_user = AnonymousUser()
        for name, value in kwargs.items():
            setattr(self, name, value)

    def action(self):
        """Public entry point to execute the required action"""
        return self._action()

    def _action(self):
        """Override this in subclasses to implement the desired action"""
        raise NotImplementedError

    def configure_user(self, username):
        if not username:
            return

        try:
            self.connected_user = User.objects.get(username=username)
        except User.DoesNotExist:
            syslog.syslog(
                    syslog.LOG_WARNING,
                    'Cannot run action {} with provided user '
                    '{} as it is not found in the database. '
                    'Continuing anonymously.'
                    .format(self.__class__.__name__, username))

    def share_user(self, other):
        other.connected_user = self.connected_user

    def _assert_user_in(self, identity):
        if self.connected_user.is_staff:
            # Admin can do anything
            return

        if not identity or identity == [None]:
            # Resource owned by nobody is public
            return

        if self.connected_user in identity:
            # Users having ownership of the resource can use it
            return

        raise errors.ForbiddenError(
                'Forbidden: this resource belong to another user',
                self.connected_user)


class ThreadedAction(ConductorAction):
    """Specific kind of action that is known to take a long time (usually
    by launching playbooks).

    Such action will immediately return with a 202 (Accepted) status code
    and set the state of the action in the backend database. Clients are
    responsible to check this state regularly to know when the action
    actually terminates.
    """

    def action(self):
        """Public entry point to execute the required action"""
        real_action = super().action
        thread = threading.Thread(target=self._threaded_action, args=(real_action,))
        thread.start()
        return {}, 202

    def _create_command_result(self):
        """Override this in subclasses to create the required CommandResult"""
        raise NotImplementedError

    def _threaded_action(self, real_action):
        command_result = self._create_command_result()
        try:
            real_action()
        except errors.ConductorError as e:
            is_warning = isinstance(e, errors.ConductorWarning)
            log_level = syslog.LOG_WARNING if is_warning else syslog.LOG_ERR
            syslog.syslog(log_level, '{}'.format(e.json))
            command_result.update(e.json, e.ERROR_CODE)
            raise
        except Exception as err:
            infos = {
                    'message': 'An unexpected error occured',
                    'error': str(err),
                    'traceback': traceback.format_exc(),
            }
            syslog.syslog(syslog.LOG_ALERT, '{}'.format(infos))
            command_result.update(infos, 500)
            raise
        command_result.update(None, 204)

    @staticmethod
    def set_running(aggregator, field_name):
        """Get a CommandResult from a nullable field of the given
        aggregator and set its inner state to 'Running'.
        """
        command_result = getattr(aggregator, field_name)
        if command_result is None:
            new_result = CommandResult()
            new_result.save()
            setattr(aggregator, field_name, new_result)
            aggregator.save()
            return new_result

        command_result.reset()
        return command_result


#############
# Collector #
#############

class CollectorAction(ConductorAction):
    """Base class that defines helper methods to deal with Collectors"""

    def get_collector_or_not_found_error(self):
        try:
            return Collector.objects.get(address=self.address)
        except Collector.DoesNotExist:
            raise errors.NotFoundError(
                    'The requested Collector is not in the database',
                    collector_address=self.address)


class AddCollector(ThreadedAction, CollectorAction):
    """Action responsible for the installation of a Collector"""

    def __init__(self, address, name, username=None,
                 password=None, logs_port=None,
                 logs_query_port=None, cluster_name=None,
                 stats_mode=None, stats_port=None,
                 stats_query_port=None, database_name=None,
                 database_precision=None, broadcast_mode=None,
                 broadcast_port=None, skip_playbook=False,
                 cookie=None):
        super().__init__(
                address=address, name=name,
                username=username,
                password=password,
                logs_port=logs_port,
                stats_mode=stats_mode,
                stats_port=stats_port,
                cluster_name=cluster_name,
                logs_query_port=logs_query_port,
                stats_query_port=stats_query_port,
                database_name=database_name,
                database_precision=database_precision,
                broadcast_mode=broadcast_mode,
                broadcast_port=broadcast_port,
                skip_playbook=skip_playbook,
                cookie=cookie)

    def _create_command_result(self):
        command_result, _ = CollectorCommandResult.objects.get_or_create(address=self.address)
        return self.set_running(command_result, 'status_add')

    @require_connected_user(admin=True)
    def _action(self):
        collector, created = Collector.objects.get_or_create(address=self.address)
        collector.update(
                self.logs_port,
                self.logs_query_port,
                self.cluster_name,
                self.stats_mode,
                self.stats_port,
                self.stats_query_port,
                self.database_name,
                self.database_precision,
                self.broadcast_mode,
                self.broadcast_port)

        if not self.skip_playbook:
            try:
                # Perform physical installation through a playbook
                start_playbook(
                        'install_collector',
                        collector.json,
                        self.name,
                        self.username,
                        self.password,
                        cookie=self.cookie)
            except errors.ConductorError:
                collector.delete()
                raise

        # An agent was installed by the playbook so create it in DB
        agent = InstallAgent(
                self.address, self.name,
                self.address, skip_playbook=True)
        self.share_user(agent)
        with suppress(errors.ConductorWarning):
            agent._threaded_action(agent._action)

        if not created:
            raise errors.ConductorWarning(
                    'A Collector was already installed, configuration updated',
                    collector_address=self.address)


class ModifyCollector(ThreadedAction, CollectorAction):
    """Action responsible of modifying the configuration of a Collector"""

    def __init__(self, address, logs_port=None,
                 logs_query_port=None, cluster_name=None,
                 stats_mode=None, stats_port=None,
                 stats_query_port=None, database_name=None,
                 database_precision=None, broadcast_mode=None,
                 broadcast_port=None):
        super().__init__(
                address=address,
                logs_port=logs_port,
                stats_mode=stats_mode,
                stats_port=stats_port,
                cluster_name=cluster_name,
                logs_query_port=logs_query_port,
                stats_query_port=stats_query_port,
                database_name=database_name,
                database_precision=database_precision,
                broadcast_mode=broadcast_mode,
                broadcast_port=broadcast_port)

    def _create_command_result(self):
        command_result, _ = CollectorCommandResult.objects.get_or_create(address=self.address)
        return self.set_running(command_result, 'status_modify')

    @require_connected_user(admin=True)
    def _action(self):
        collector = self.get_collector_or_not_found_error()
        updated = collector.update(
                self.logs_port,
                self.logs_query_port,
                self.cluster_name,
                self.stats_mode,
                self.stats_port,
                self.stats_query_port,
                self.database_name,
                self.database_precision,
                self.broadcast_mode,
                self.broadcast_port)

        if not updated:
            raise errors.ConductorWarning('No modification to do')

        for agent in collector.agents.all():
            start_playbook('assign_collector', agent.address, agent.port, collector.json)


class DeleteCollector(ThreadedAction, CollectorAction):
    """Action responsible for the uninstallation of a Collector"""

    def __init__(self, address):
        super().__init__(address=address)

    def _create_command_result(self):
        command_result, _ = CollectorCommandResult.objects.get_or_create(address=self.address)
        return self.set_running(command_result, 'status_del')

    @require_connected_user(admin=True)
    def _action(self):
        collector = self.get_collector_or_not_found_error()
        other_agents = collector.agents.exclude(address=self.address)
        if other_agents:
            raise errors.ConflictError(
                    'The requested Collector is still bound to other Agents',
                    collector_address=self.address,
                    agents_addresses=[agent.address for agent in other_agents])

        # Perform physical uninstallation through a playbook
        start_playbook('uninstall_collector', collector.json)

        # The associated Agent was removed by the playbook, remove it from DB
        try:
            agent = collector.agents.get(address=self.address)
        except Agent.DoesNotExist:
            pass
        else:
            agent.delete()
        finally:
            collector.delete()


class InfosCollector(CollectorAction):
    """Action responsible for information retrieval about a Collector"""

    def __init__(self, address):
        super().__init__(address=address)

    @require_connected_user(admin=True)
    def _action(self):
        collector = self.get_collector_or_not_found_error()
        return collector.json, 200


class ListCollectors(CollectorAction):
    """Action responsible for information retrieval about all Collectors"""

    @require_connected_user(admin=True)
    def _action(self):
        infos = [c.json for c in Collector.objects.all()]
        return infos, 200


class ChangeCollectorAddress(CollectorAction):
    """Action responsible for changing the address of a Collector and
    updating this information on all associated Agents.
    """

    def __init__(self, address, new_address):
        super().__init__(address=address, new_address=new_address)

    @require_connected_user(admin=True)
    def _action(self):
        new_address = self.new_address
        collector = self.get_collector_or_not_found_error()
        collector.address = new_address
        collector.save()

        for agent_address, in collector.agents.values_list('address'):
            assignment = AssignCollector(agent_address, new_address)
            self.share_user(assignment)
            assignment.action()

        return None, 204


#########
# Agent #
#########

class AgentAction(ConductorAction):
    """Base class that defines helper methods to deal with Agents"""

    def get_agent_or_not_found_error(self):
        try:
            return Agent.objects.get(address=self.address)
        except Agent.DoesNotExist:
            raise errors.NotFoundError(
                    'The requested Agent is not in the database',
                    agent_address=self.address)

    def _update_agent(self, restart=False):
        """Update the local status of an Agent by trying to connect to it"""
        agent = self.get_agent_or_not_found_error()
        try:
            start_playbook('check_connection', agent.address, agent.port, restart)
        except errors.ConductorError:
            agent.set_reachable(False)
            agent.set_available(False)
            agent.set_status(Agent.Status.AGENT_UNREACHABLE)
            agent.save()
            return

        agent.set_reachable(True)
        try:
            OpenBachBaton(agent.address, agent.port).check_connection()
        except errors.UnprocessableError:
            agent.set_available(False)
            agent.set_status(Agent.Status.AGENT_REACHABLE_BUT_DAEMON_UNAVAILABLE)
        else:
            agent.set_available(True)
            agent.set_status(Agent.Status.AVAILABLE)
        agent.save()

    def _check_user_can_use_agent(self):
        agent = self.get_agent_or_not_found_error()
        try:
            entity = agent.entity
        except Entity.DoesNotExist:
            owners = None
        else:
            owners = entity.project.owners.all()
        self._assert_user_in(owners)


class InstallAgent(ThreadedAction, AgentAction):
    """Action responsible for the installation of an Agent"""

    def __init__(self, address, name, collector, port=1112, rstats=1111,
                 username=None, password=None, skip_playbook=False, cookie=None):
        super().__init__(address=address, username=username,
                         name=name, password=password,
                         agent_port=port, rstats_port=rstats,
                         collector_ip=collector,
                         skip_playbook=skip_playbook,
                         cookie=cookie)

    def _create_command_result(self):
        command_result, _ = AgentCommandResult.objects.get_or_create(address=self.address)
        return self.set_running(command_result, 'status_install')

    @require_connected_user(admin=True)
    def _action(self):
        agent, created = self._create_agent()
        if not self.skip_playbook:
            try:
                # Perform physical installation through a playbook
                start_playbook(
                        'install_agent',
                        agent.address,
                        agent.name,
                        agent.port,
                        agent.rstats_port,
                        agent.collector.json,
                        self.username,
                        self.password,
                        cookie=self.cookie)
            except errors.ConductorError:
                agent.delete()
                raise
        agent.set_available(True)
        agent.set_status(Agent.Status.AVAILABLE)
        agent.save()

        if not created:
            raise errors.ConductorWarning(
                    'An Agent was already installed, configuration updated',
                    agent_address=self.address)

    def _create_agent(self):
        collector_info = InfosCollector(self.collector_ip)
        collector = collector_info.get_collector_or_not_found_error()
        agent, created = Agent.objects.get_or_create(
                address=self.address, defaults={
                    'name': self.name,
                    'collector': collector,
                })
        agent.name = self.name
        agent.port = self.agent_port
        agent.rstats_port = self.rstats_port
        agent.set_reachable(True)
        agent.set_available(False)
        agent.set_status(Agent.Status.INSTALLING)
        agent.collector = collector
        agent.save()

        return agent, created

    def _populate_jobs(self, job_names):
        for job_name in job_names:
            with suppress(errors.ConductorError):
                job = InstallJob(self.address, job_name, skip_playbook=True)
                self.share_user(job)
                job._threaded_action(job._action)


class UninstallAgent(ThreadedAction, AgentAction):
    """Action responsible for the uninstallation of an Agent"""

    def __init__(self, address):
        super().__init__(address=address)

    def _create_command_result(self):
        command_result, _ = AgentCommandResult.objects.get_or_create(address=self.address)
        return self.set_running(command_result, 'status_uninstall')

    @require_connected_user(admin=True)
    def _action(self):
        agent = self.get_agent_or_not_found_error()
        installed_jobs = [
                {'name': installed.job.name, 'path': installed.job.path}
                for installed in agent.installed_jobs.all()
        ]
        try:
            # Perform physical uninstallation through a playbook
            start_playbook(
                    'uninstall_agent',
                    agent.address,
                    agent.collector.json,
                    jobs=installed_jobs)
        except errors.ConductorError:
            agent.set_status(Agent.Status.UNINSTALL_FAILED)
            agent.save()
            raise
        finally:
            agent.delete()


class AttachAgent(InstallAgent):
    @require_connected_user(admin=True)
    def _action(self):
        agent, created = self._create_agent()
        if not self.skip_playbook:
            try:
                # Perform physical installation through a playbook
                start_playbook('enable_controller_access', self.address, self.username, self.password)
                with tempfile.NamedTemporaryFile('w', prefix='openbach_files/') as f:
                    print(self.name, file=f, flush=True)
                    parameters = {
                            'user': 'openbach',
                            'source': f.name,
                            'destination': '/opt/openbach/agent/agent_name',
                    }
                    start_playbook('push_file', self.address, [parameters])
                start_playbook('assign_collector', self.address, self.agent_port, agent.collector.json)
            except errors.ConductorError:
                agent.delete()
                raise

        jobs = set()
        try:
            jobs.update(OpenBachBaton(agent.address, agent.port).list_jobs())
        except errors.UnprocessableError:
            agent.set_available(False)
            agent.set_status(Agent.Status.AGENT_REACHABLE_BUT_DAEMON_UNAVAILABLE)
        else:
            agent.set_available(True)
            agent.set_status(Agent.Status.AVAILABLE)
        agent.save()

        self._populate_jobs(jobs)

        try:
            statuses = AgentCommandResult.objects.select_related('status_uninstall').get(address=self.address)
        except AgentCommandResult.DoesNotExist:
            last_seen = datetime.fromtimestamp(0)
        else:
            last_uninstall = statuses.status_uninstall.date
            last_seen = timezone.make_naive(last_uninstall)

        arguments = {'date': [[str(last_seen.date()), str(last_seen.time())]]}
        for job_name in ('send_logs', 'send_stats'):
            if job_name in jobs:
                job = StartJobInstance(self.address, job_name, arguments)
                self.share_user(job)
                job.openbach_function_instance = self.openbach_function_instance
                job._build_job_instance()
                job._threaded_action(job._action)


class DetachAgent(UninstallAgent):
    @require_connected_user(admin=True)
    def _action(self):
        agent = self.get_agent_or_not_found_error()
        # Create a fake collector with default values
        collector = Collector(address='127.0.0.1')
        try:
            start_playbook('assign_collector', agent.address, agent.port, collector.json)
            start_playbook('disable_controller_access', self.address)
        except errors.ConductorError:
            agent.set_status(Agent.Status.DETACH_FAILED)
            agent.save()
            raise
        finally:
            agent.delete()


class InfosAgent(AgentAction):
    """Action responsible for information retrieval about an Agent"""

    def __init__(self, address, update=False, restart=False):
        super().__init__(address=address, update=update, restart=restart)

    def _action(self):
        self._check_user_can_use_agent()

        if self.update or self.restart:
            # Do not perform update blindly as it
            # may take some time due to ansible playbooks
            self._update_agent(self.restart)
        agent = self.get_agent_or_not_found_error()
        return agent.json, 200


class ListAgents(AgentAction):
    """Action responsible for information retrieval about all Agents"""

    RELEVANT_SERVICES = (
            'openbach_agent',
            'openbach_backend',
            'openbach_conductor',
            'openbach_director',
            'rstats',
            'logstash',
            'elasticsearch',
            'influxdb',
            'kibana',
            'grafana-server',
            'chronograf',
            'nginx',
            'ntp',
    )

    def __init__(self, update=False, services=False):
        super().__init__(update=update, services=services)

    @property
    def queryset(self):
        if self.connected_user.is_staff:
            return Agent.objects.all()

        user_id = self.connected_user.id
        return Agent.objects.filter(
                db.models.Q(entity__project__owners__id__exact=user_id)
                | (db.models.Q(entity__isnull=True) & (
                    db.models.Q(project__isnull=True)
                    | db.models.Q(project__owners__id__exact=user_id)
                ))
        )

    def _action(self):
        agents = self.queryset
        if self.update or self.services:
            addresses = list(itertools.chain.from_iterable(agents.values_list('address')))
            errors, services = start_playbook('check_connections', *addresses)
            if self.services:
                return [self._services_agent(agent, errors, services) for agent in agents], 200
            return [self._infos_agent(agent, errors) for agent in agents], 200
        return [agent.json for agent in agents], 200

    @staticmethod
    def _infos_agent(agent, agents_in_error):
        address = agent.address
        if address in agents_in_error:
            agent.set_reachable(False)
            agent.set_available(False)
            agent.set_status(Agent.Status.AGENT_UNREACHABLE)
        else:
            agent.set_reachable(True)
            try:
                OpenBachBaton(address, agent.port).check_connection()
            except errors.UnprocessableError:
                agent.set_available(False)
                agent.set_status(Agent.Status.AGENT_REACHABLE_BUT_DAEMON_UNAVAILABLE)
            else:
                agent.set_available(True)
                agent.set_status(Agent.Status.AVAILABLE)
        agent.save()
        return agent.json

    @staticmethod
    def _services_agent(agent, agents_in_error, services_statuses):
        address = agent.address
        errors = agents_in_error.get(address)
        services = services_statuses.get(address, {})
        ntp_status = services.get('ntp', 'running')
        services = services.get('services', {})
        statuses = {
                service: services.get(service, {}).get('state')
                for service in map('{}.service'.format, ListAgents.RELEVANT_SERVICES)
        }

        if statuses:
            agent.set_reachable(True)
            if statuses['openbach_agent.service'] == 'running':
                agent.set_available(True)
                agent.set_status(Agent.Status.AVAILABLE)
            else:
                agent.set_available(False)
                agent.set_status(Agent.Status.AGENT_REACHABLE_BUT_DAEMON_UNAVAILABLE)
        else:
            agent.set_reachable(False)
            agent.set_available(False)
            agent.set_status(Agent.Status.AGENT_UNREACHABLE)
        agent.save()

        if statuses['ntp.service'] == 'running':
            statuses['ntp.service'] = ntp_status
        content = agent.json
        content['errors'] = errors
        content['services'] = statuses
        return content


class AssignCollector(ThreadedAction, AgentAction):
    """Action responsible for assigning a Collector to an Agent"""

    def __init__(self, address, collector):
        super().__init__(address=address, collector_ip=collector)

    def _create_command_result(self):
        command_result, _ = AgentCommandResult.objects.get_or_create(address=self.address)
        return self.set_running(command_result, 'status_assign')

    @require_connected_user(admin=True)
    def _action(self):
        agent = self.get_agent_or_not_found_error()
        collector = InfosCollector(self.collector_ip).get_collector_or_not_found_error()
        start_playbook('assign_collector', agent.address, agent.port, collector.json)
        agent.collector = collector
        agent.save()


class ModifyAgent(AgentAction):
    """Action responsible for modifying informations about an Agent"""

    def __init__(self, address, new_name=None, new_address=None, new_collector=None):
        super().__init__(
                address=address, new_name=new_name,
                new_address=new_address, new_collector=new_collector)

    @require_connected_user(admin=True)
    def _action(self):
        agent = self.get_agent_or_not_found_error()

        with db.transaction.atomic():
            if self.new_address:
                agent.address = self.new_address
            if self.new_name and self.new_name != agent.name:
                agent.name = self.new_name
                with tempfile.NamedTemporaryFile('w', prefix='openbach_files/') as name_file:
                    print(self.new_name, file=name_file, flush=True)
                    parameters = {
                            'user': 'openbach',
                            'source': name_file.name,
                            'destination': '/opt/openbach/agent/agent_name',
                    }
                    start_playbook('push_file', agent.address, [parameters])
            agent.save()

            if self.new_collector and self.new_collector != agent.collector.address:
                new_collector = AssignCollector(agent.address, self.new_collector)
                self.share_user(new_collector)
                new_collector._threaded_action(new_collector._action)

        agent.refresh_from_db()
        return agent.json, 200


class SetLogSeverityAgent(ThreadedAction, AgentAction):
    """Action responsible for changing the log severity of an Agent"""

    def __init__(self, address, severity, local_severity=None):
        super().__init__(address=address, severity=severity, local_severity=local_severity)

    def _create_command_result(self):
        command_result, _ = AgentCommandResult.objects.get_or_create(address=self.address)
        return self.set_running(command_result, 'status_log_severity')

    @require_connected_user(admin=True)
    def _action(self):
        self.get_agent_or_not_found_error()
        rsyslog_modifier = SetLogSeverityJob(self.address, 'openbach_agent', None)
        self.share_user(rsyslog_modifier)
        rsyslog_modifier._physical_set_severity(self.severity, self.local_severity)


class ReserveProject(AgentAction):
    """Action responsible for booking an agent into a project"""

    def __init__(self, address, project=None):
        super().__init__(address=address, project=project)

    @require_connected_user()
    def _action(self):
        agent = self.get_agent_or_not_found_error()
        if agent.project:
            self._assert_user_in(agent.project.owners.all())

        if self.project is not None:
            infos_project = InfosProject(self.project)
            self.share_user(infos_project)
            project = infos_project.get_project_or_not_found_error()
            self._assert_user_in(project.owners.all())
        else:
            project = None

        agent.project = project
        agent.save()

        projects = ListProjects()
        self.share_user(projects)
        return projects.action()


########
# Jobs #
########

class JobAction(ConductorAction):
    """Base class that defines helper methods to deal with Jobs"""

    def get_job_or_not_found_error(self):
        try:
            return Job.objects.get(name=self.name)
        except Job.DoesNotExist:
            raise errors.NotFoundError(
                    'The requested Job is not in the database',
                    job_name=self.name)


class AddJob(JobAction):
    """Action responsible to add a Job whose files are on the
    Controller's filesystem into the database.
    """

    def __init__(self, name, path):
        super().__init__(name=name, path=path)

    @require_connected_user(admin=True)
    def _action(self):
        config_prefix = os.path.join(self.path, 'files', self.name)
        config_file = '{}.yml'.format(config_prefix)
        config_help = '{}.help'.format(config_prefix)
        try:
            stream = open(config_file, encoding='utf-8')
        except FileNotFoundError:
            raise errors.BadRequestError(
                    'The configuration file of the Job is not present',
                    job_name=self.name,
                    configuration_file=config_file)
        with stream:
            try:
                content = yaml.safe_load(stream)
            except yaml.YAMLError as err:
                raise errors.BadRequestError(
                        'The configuration file of the Job does not '
                        'contain valid YAML data',
                        job_name=self.name, error_message=str(err),
                        configuration_file=config_file)

        # Load the help file
        try:
            with open(config_help, encoding='utf-8') as stream:
                help_content = stream.read()
        except OSError:
            help_content = None

        try:
            with db.transaction.atomic():
                self._update_job(content, help_content)
        except KeyError as err:
            raise errors.BadRequestError(
                    'The configuration file of the Job is missing an entry',
                    entry_name=str(err), job_name=self.name,
                    configuration_file=config_file)
        except (TypeError, db.utils.DataError) as err:
            raise errors.BadRequestError(
                    'The configuration file of the Job contains entries '
                    'whose values are not of the required type',
                    job_name=self.name, error_message=str(err),
                    configuration_file=config_file)
        except db.IntegrityError as err:
            raise errors.BadRequestError(
                    'The configuration file of the Job contains '
                    'duplicated entries',
                    job_name=self.name, error_message=str(err),
                    configuration_file=config_file)

        return InfosJob(self.name).action()

    def _update_job(self, content, help_content):
        """Update the values stored for a job based on its JSON"""

        general_section = content['general']
        general_section['name'] = self.name  # Enforce the two to match
        description = general_section['description']

        job, created = Job.objects.get_or_create(name=self.name)
        job.path = self.path
        job.description = description
        job.help = description if help_content is None else help_content
        job.job_version = general_section['job_version']
        job.persistent = general_section['persistent']
        job.has_uncertain_required_arg = False
        job.save()

        system_list = {}

        # Associate OSes
        os_commands = content['platform_configuration']
        for os_description in os_commands:
            os_system = os_description['ansible_system']
            os_distribution = os_description['ansible_distribution']
            os_distribution_version = os_description['ansible_distribution_version']
            command = os_description['command']
            command_stop = os_description.get('command_stop')
            system_list.setdefault(os_system, {}).setdefault(os_distribution, []).append(os_distribution_version)
            os_command, _ = OsCommand.objects.get_or_create(
                    job=job, family=os_system, distribution=os_distribution,
                    version=os_distribution_version,
                    defaults={
                        'command': command,
                        'command_stop': command_stop,
                    })
            os_command.command = command
            os_command.command_stop = command_stop
            os_command.save()
        # Remove OSes associated to the previous version of the job
        for system, system_info in system_list.items():
            for distribution, versions in system_info.items():
                job.os.filter(family=os_system, distribution=os_distribution).exclude(version__in=versions).delete()

        # Associate "new" keywords
        keywords = general_section['keywords']
        for keyword in keywords:
            job_keyword, _ = Keyword.objects.get_or_create(name=keyword)
            job.keywords.add(job_keyword)
        # Remove keywords associated to the previous version of the job
        job.keywords.set(Keyword.objects.filter(
                jobs__name__exact=self.name,
                name__in=keywords))

        # Associate "new" statistics
        statistics = content.get('statistics')
        # No EAFP here to support entry with empty content
        if statistics is not None:
            for statistic in statistics:
                stat, _ = Statistic.objects.get_or_create(
                        name=statistic['name'], job=job)
                stat.description = statistic['description']
                stat.frequency = statistic['frequency']
                stat.save()
            stats_names = {stat['name'] for stat in statistics}
        else:
            stats_names = set()
        # Remove statistics associated to the previous version of the job
        job.statistics.exclude(name__in=stats_names).delete()

        # Associate "new" arguments
        job.subcommands.all().delete()
        self._populate_arguments(
                job.subcommands.create(group=None, name=None),
                content.get('arguments', {}), job)

        # Check constraints on arguments counts
        for subcommand in job.subcommands.all():
            required = subcommand.arguments.filter(requiredjobargument__isnull=False)
            if required.filter(count_upper__isnull=True).count() > 1:
                raise errors.BadRequestError(
                        'A Job can only have one required argument with '
                        'an infinite amount of values per subcommand',
                        job_name=self.name, arguments=list(map(str, required.filter(count_upper__isnull=True))))

        if created:
            return

        # If the job existed already, uninstall on agents if necessary
        for installed_job in InstalledJob.objects.filter(job=job):
            installed_version = version(installed_job.job_version)
            current_version = version(job.job_version)
            # In case of rollback or major update, uninstall the Job
            if (installed_version > current_version or installed_version.major != current_version.major):
                uninstaller = UninstallJob(installed_job.agent.address, self.name)
                self.share_user(uninstaller)
                uninstaller.action()

    def _populate_arguments(self, subcommand, arguments, job):
        required = arguments.get('required')
        if required is not None:
            for rank, argument in enumerate(required):
                arg = RequiredJobArgument.objects.create(
                        subcommand=subcommand,
                        rank=rank, name=argument['name'])
                self._populate_argument(arg, argument)

        optional = arguments.get('optional')
        if optional is not None:
            for argument in optional:
                arg = OptionalJobArgument.objects.create(
                        subcommand=subcommand,
                        flag=argument['flag'], name=argument['name'],
                        repeatable=argument.get('repeatable', False))
                self._populate_argument(arg, argument)

        subcommands = arguments.get('subcommand')
        if subcommands is not None:
            for group in subcommands:
                group_argument = SubcommandGroupArgument.objects.create(
                        name=group['group_name'],
                        optional=group.get('optional', False),
                        subcommand=subcommand)
                sub_arguments = group.get('choices')
                if sub_arguments is not None:
                    for sub_argument in sub_arguments:
                        name = sub_argument['name']
                        self._populate_arguments(
                            job.subcommands.create(name=name, group=group_argument),
                            sub_argument, job)

    def _populate_argument(self, argument, content):
        argument.type = content['type']
        argument.count_str = content['count']
        argument.description = content.get('description')
        argument.password = content.get('password', False)
        argument.default = content.get('default')
        for choice in content.get('choices', []):
            ArgumentChoice.objects.create(argument=argument, value=choice)
        argument.save()


class AddTarJob(JobAction):
    """Action responsible to add a Job whose files are sent in
    a .tar file into the database.
    """

    def __init__(self, name, path):
        super().__init__(name=name, path=path)

    @require_connected_user(admin=True)
    def _action(self):
        path = '/opt/openbach/controller/src/jobs/private_jobs/{}'.format(self.name)
        try:
            with tarfile.open(self.path) as tar_file:
                tar_file.extractall(path)
        except tarfile.ReadError as err:
            raise errors.ConductorError(
                    'Failed to uncompress the provided tar file',
                    error_message=str(err))
        add_job_action = AddJob(self.name, path)
        self.share_user(add_job_action)
        return add_job_action.action()


class AddExternalJob(JobAction):
    def __init__(self, name, repository):
        super().__init__(name=name, repository=repository)

    @require_connected_user(admin=True)
    def _action(self):
        path = external_jobs.add_job(self.name, self.repository)
        if path is None:
            raise errors.NotFoundError(
                    'Unable to find the provided external job',
                    job_name=self.name)
        add_job_action = AddJob(self.name, path)
        self.share_user(add_job_action)
        return add_job_action.action()


class DeleteJob(JobAction):
    """Action responsible of removing a Job from the filesystem"""

    def __init__(self, name):
        super().__init__(name=name)

    @require_connected_user(admin=True)
    def _action(self):
        job = self.get_job_or_not_found_error()
        path = job.path
        job.delete()

        shutil.rmtree(path, ignore_errors=True)
        if os.path.exists(path):
            return {
                    'warning': 'Job deleted but some files '
                               'remain on the controller',
                    'job_name': self.name,
            }, 200
        return None, 204


class InfosJob(JobAction):
    """Action responsible for information retrieval about a Job"""

    def __init__(self, name):
        super().__init__(name=name)

    def _action(self):
        job = self.get_job_or_not_found_error()
        return job.json, 200


class ListJobs(JobAction):
    """Action responsible to search information about Jobs"""

    def __init__(self, string_to_search=None, ratio=60):
        super().__init__(name=string_to_search, ratio=ratio)

    def _action(self):
        if self.name is None:
            return [job.json for job in Job.objects.all()], 200

        return [job.json for job in self._fuzzy_matching()], 200

    def _fuzzy_matching(self):
        delimiters = re.compile(r'\W|_')
        for job in Job.objects.all():
            search_fields = itertools.chain(
                    delimiters.split(job.name),
                    job.keywords.all())
            if any(fuzz.token_set_ratio(word, self.name) > self.ratio
                   for word in search_fields):
                yield job


class ListExternalJobs(JobAction):
    def __init__(self, repository):
        super().__init__(repository=repository)

    def _action(self):
        return external_jobs.list_jobs_properties(self.repository), 200


class GetKeywordsJob(JobAction):
    """Action responsible for retrieval of the keywords of a Job"""

    def __init__(self, name):
        super().__init__(name=name)

    def _action(self):
        job = self.get_job_or_not_found_error()
        keywords = [keyword.name for keyword in job.keywords.all()]
        return {'job_name': job.name, 'keywords': keywords}, 200


class GetStatisticsJob(JobAction):
    """Action responsible for retrieval of the statistics of a Job"""

    def __init__(self, name):
        super().__init__(name=name)

    def _action(self):
        job = self.get_job_or_not_found_error()
        stats = [stat.json for stat in job.statistics.all()]
        return {'job_name': job.name, 'statistics': stats}, 200


class GetHelpJob(JobAction):
    """Action responsible for retrieval of the help on a Job"""

    def __init__(self, name):
        super().__init__(name=name)

    def _action(self):
        job = self.get_job_or_not_found_error()
        return {'job_name': job.name, 'help': job.help}, 200


class GetAgentsJob(JobAction):
    """Action responsible for retrieval of agents names where a Job is installed"""

    def __init__(self, name):
        super().__init__(name=name)

    def _action(self):
        job = self.get_job_or_not_found_error()
        agents = ListAgents()
        self.share_user(agents)
        installed_on = InstalledJob.objects.filter(
                job=job,
                agent__in=agents.queryset,
        ).values('agent__name', 'agent__address')
        return {'job_name': job.name, 'installed_on': list(installed_on)}, 200


##################
# Installed Jobs #
##################

class InstalledJobAction(ConductorAction):
    """Base class that defines helper methods to deal with InstalledJobs"""

    def get_installed_job_or_not_found_error(self):
        job = InfosJob(self.name).get_job_or_not_found_error()
        agent_infos = InfosAgent(self.address)
        self.share_user(agent_infos)
        agent_infos._check_user_can_use_agent()
        agent = agent_infos.get_agent_or_not_found_error()
        try:
            return InstalledJob.objects.get(agent=agent, job=job)
        except InstalledJob.DoesNotExist:
            raise errors.NotFoundError(
                    'The requested Installed Job is not in the database',
                    agent_address=self.address, job_name=self.name)

    def _check_user_can_manage_job(self, agent, job):
        if self.connected_user.is_staff:
            return

        if not agent.has_entity:
            raise errors.UnprocessableError(
                    'Cannot (un)install jobs on agents '
                    'not associated to a project.',
                    agent_address=agent.address,
                    job_name=job.name)

        admin_job = Keyword.objects.get_or_create(name='admin')
        if admin_job in job.keywords.all():
            raise errors.ForbiddenError(
                    'Only administrators can (un)install '
                    'administrative jobs on agents.',
                    self.connected_user,
                    agent_address=agent.address,
                    job_name=job.name)


class InstallJob(ThreadedAction, InstalledJobAction):
    """Action responsible for installing a Job on an Agent"""

    def __init__(self, address, name, severity=2, local_severity=2, skip_playbook=False, cookie=None):
        super().__init__(address=address, name=name, skip_playbook=skip_playbook,
                         severity=severity, local_severity=local_severity, cookie=cookie)

    def _create_command_result(self):
        command_result, _ = InstalledJobCommandResult.objects.get_or_create(
                address=self.address,
                job_name=self.name)
        return self.set_running(command_result, 'status_install')

    @require_connected_user()
    def _action(self):
        agent_infos = InfosAgent(self.address)
        self.share_user(agent_infos)
        agent_infos._check_user_can_use_agent()
        agent = agent_infos.get_agent_or_not_found_error()
        job = InfosJob(self.name).get_job_or_not_found_error()
        self._check_user_can_manage_job(agent, job)

        if not self.skip_playbook:
            # check os configuration arguments
            ansible_fact = start_playbook('gather_facts',agent.address)
            try:
                job.os.get(
                        family=ansible_fact['ansible_os_family'],
                        distribution=ansible_fact['ansible_distribution'],
                        version=ansible_fact['ansible_distribution_version'])
            except OsCommand.DoesNotExist:
                raise errors.UnprocessableError(
                        'Cannot install a job on an '
                        'agent: Unsupported Os',
                        agent_address=self.address,
                        job_name=self.name)

            # Wait until all previous jobs installed on the same agents are done
            start_date = InstalledJobCommandResult.objects.get(
                    address=self.address,
                    job_name=self.name).status_install.date
            query = (
                    (
                        db.models.Q(status_install__date__lt=start_date)
                        & db.models.Q(status_install__returncode=202)
                    ) | (
                        db.models.Q(status_uninstall__date__lt=start_date)
                        & db.models.Q(status_uninstall__returncode=202)
                    )
            )
            while InstalledJobCommandResult.objects.filter(query, address=self.address).exists():
                sleep(1)

            # If the job's major version is newer than installed, or older, reinstall
            with suppress(InstalledJob.DoesNotExist):
                installed_job = InstalledJob.objects.get(job=job, agent=agent)
                installed_version = version(installed_job.job_version)
                current_version = version(job.job_version)
                if (installed_version > current_version or installed_version.major != current_version.major):
                    start_playbook(
                            'uninstall_job',
                            agent.address,
                            agent.collector.address,
                            job.name, job.path)

            # Physically install the job on the agent
            start_playbook(
                    'install_job',
                    agent.address,
                    agent.collector.address,
                    agent.collector.logs_port,
                    job.name, job.path,
                    cookie=self.cookie)
            OpenBachBaton(agent.address, agent.port).add_job(self.name)

        installed_job, created = InstalledJob.objects.get_or_create(
                agent=agent, job=job, defaults={'job_version': job.job_version})
        installed_job.job_version = job.job_version
        installed_job.severity = self.severity
        installed_job.local_severity = self.local_severity
        installed_job.update_status = timezone.now()
        installed_job.save()

        if not self.skip_playbook:
            with suppress(errors.ConductorError):
                severity_setter = SetLogSeverityJob(
                        self.address, self.name,
                        self.severity, self.local_severity)
                self.share_user(severity_setter)
                severity_setter._threaded_action(severity_setter._action)

        if not created:
            raise errors.ConductorWarning(
                    'A Job was already installed on an '
                    'Agent, configuration updated',
                    agent_address=self.address, job_name=self.name)


class InstallJobs(InstalledJobAction):
    """Action responsible for installing several Jobs on several Agents"""

    def __init__(self, addresses, names, severity=2, local_severity=2, skip_playbook=False, cookie=None):
        super().__init__(addresses=addresses, names=names,
                         severity=severity, local_severity=local_severity,
                         skip_playbook=skip_playbook, cookie=cookie)

    @require_connected_user()
    def _action(self):
        for name, address in itertools.product(self.names, self.addresses):
            installer = InstallJob(
                    address, name,
                    self.severity,
                    self.local_severity,
                    self.skip_playbook,
                    self.cookie)
            self.share_user(installer)
            installer.action()
        return {}, 202


class UninstallJob(ThreadedAction, InstalledJobAction):
    """Action responsible for uninstalling a Job on an Agent"""

    def __init__(self, address, name):
        super().__init__(address=address, name=name)

    def _create_command_result(self):
        command_result, _ = InstalledJobCommandResult.objects.get_or_create(
                address=self.address,
                job_name=self.name)
        return self.set_running(command_result, 'status_uninstall')

    @require_connected_user()
    def _action(self):
        installed_job = self.get_installed_job_or_not_found_error()
        agent = installed_job.agent
        job = installed_job.job
        self._check_user_can_manage_job(agent, job)

        # Wait until all previous jobs installed on the same agents are done
        start_date = InstalledJobCommandResult.objects.get(
                address=self.address,
                job_name=self.name).status_install.date
        query = (
                (
                    db.models.Q(status_install__date__lt=start_date)
                    & db.models.Q(status_install__returncode=202)
                ) | (
                    db.models.Q(status_uninstall__date__lt=start_date)
                    & db.models.Q(status_uninstall__returncode=202)
                )
        )
        while InstalledJobCommandResult.objects.filter(query, address=self.address).exists():
            sleep(1)

        OpenBachBaton(agent.address, agent.port).remove_job(job.name)
        start_playbook(
                'uninstall_job',
                agent.address,
                agent.collector.address,
                job.name, job.path)
        installed_job.delete()


class UninstallJobs(InstalledJobAction):
    """Action responsible for uninstalling several Jobs on several Agents"""

    def __init__(self, addresses, names):
        super().__init__(addresses=addresses, names=names)

    @require_connected_user()
    def _action(self):
        for name, address in itertools.product(self.names, self.addresses):
            uninstaller = UninstallJob(address, name)
            self.share_user(uninstaller)
            uninstaller.action()
        return {}, 202


class InfosInstalledJob(InstalledJobAction):
    """Action responsible for information retrieval about an Installed Job"""

    def __init__(self, address, name):
        super().__init__(address=address, name=name)

    def _action(self):
        installed_job = self.get_installed_job_or_not_found_error()
        return installed_job.json, 200


class ListInstalledJobs(InstalledJobAction):
    """Action responsible for information retrieval about
    all Installed Job on an Agent.
    """

    def __init__(self, address, update=False):
        super().__init__(address=address, update=update)

    def _action(self):
        agent_infos = InfosAgent(self.address)
        self.share_user(agent_infos)
        agent_infos._check_user_can_use_agent()
        agent = agent_infos.get_agent_or_not_found_error()
        update_errors = []

        if self.update:
            try:
                jobs = set(OpenBachBaton(agent.address, agent.port).list_jobs())
            except errors.ConductorError as error:
                update_errors.append(error.json)
            else:
                date = timezone.now()
                for job in agent.installed_jobs.all():
                    name = job.job.name
                    if name not in jobs:
                        job.delete()  # Not installed anymore
                    else:
                        job.update_status = date
                        job.save()
                        jobs.remove(name)

                # Store remaining installed jobs in the database
                for job_name in jobs:
                    try:
                        job = Job.objects.get(name=job_name)
                    except Job.DoesNotExist:
                        update_errors.append({
                            'message': 'A Job on the Agent '
                            'is not found in the database',
                            'job_name': job_name,
                        })
                    else:
                        InstalledJob.objects.create(
                                agent=agent, job=job,
                                update_status=date,
                                severity=4,
                                local_severity=4)

        infos = [job.json for job in agent.installed_jobs.all()]
        result = {
                'agent': self.address,
                'installed_jobs': infos,
        }
        if update_errors:
            result['errors'] = update_errors
        return result, 200


class SetLogSeverityJob(ThreadedAction, InstalledJobAction):
    """Action responsible for changing the log severity of an Installed Job"""

    def __init__(self, address, name, severity, local_severity=None, date=None):
        super().__init__(address=address, name=name, severity=severity,
                         local_severity=local_severity, date=date)

    def _create_command_result(self):
        command_result, _ = InstalledJobCommandResult.objects.get_or_create(
                address=self.address, job_name=self.name)
        return self.set_running(command_result, 'status_log_severity')

    @require_connected_user()
    def _action(self):
        installed_job = self.get_installed_job_or_not_found_error()

        # Configure the playbook
        local_severity = self.local_severity
        if self.local_severity is None:
            local_severity = installed_job.local_severity
        syslogseverity = convert_severity(int(self.severity))
        syslogseverity_local = convert_severity(int(local_severity))

        # Launch the playbook and the associated job
        start_playbook(
                'enable_logs',
                installed_job.agent.address,
                installed_job.agent.collector.json,
                job=self.name,
                severity=syslogseverity,
                local_severity=syslogseverity_local)

        installed_job.severity = self.severity
        installed_job.local_severity = local_severity
        installed_job.save()


class SetStatisticsPolicyJob(ThreadedAction, InstalledJobAction):
    """Action responsible for changing the log severity of an Installed Job"""

    def __init__(self, address, name, local=None, storage=None,
                 broadcast=None, stat_name=None, config_file=None,
                 path=None):
        super().__init__(address=address, name=name, storage=storage,
                         broadcast=broadcast, statistic=stat_name,
                         local=local, config_file=config_file,
                         path=path)

    def _create_command_result(self):
        command_result, _ = InstalledJobCommandResult.objects.get_or_create(
                address=self.address, job_name=self.name)
        return self.set_running(command_result, 'status_stat_policy')

    @staticmethod
    def _retrieve_statistic(installed_job, statistic_name):
        try:
            statistic = installed_job.job.statistics.get(name=statistic_name)
        except Statistic.DoesNotExist:
            stats_names = [stat.name for stat in installed_job.job.statistics.all()]
            raise errors.NotFoundError(
                    'The statistic is not generated by the Job.',
                    statistic_name=statistic_name,
                    job_name=installed_job.job.name,
                    job_statistics=stats_names)
        statistic_instance, _ = StatisticInstance.objects.get_or_create(job=installed_job, stat=statistic)
        return statistic_instance

    @require_connected_user()
    def _action(self):
        installed_job = self.get_installed_job_or_not_found_error()

        if self.path:
            config = configparser.ConfigParser()
            try:
                config.read(self.path)
            except configparser.Error as e:
                raise errors.UnprocessableError(
                        'Error while reading {}.'.format(self.path),
                        error_message=list(e.args))

            with db.transaction.atomic():
                # Clear everything before recreating them if necessary
                installed_job.statistics.all().delete()
                installed_job.default_stat_local = True
                installed_job.default_stat_storage = True
                installed_job.default_stat_broadcast = False
                installed_job.save()

                for name, section in config.items():
                    if section.values():
                        if name == 'default':
                            installed_job.default_stat_local = section.getboolean('local', True)
                            installed_job.default_stat_storage = section.getboolean('storage', True)
                            installed_job.default_stat_broadcast = section.getboolean('broadcast', False)
                            installed_job.save()
                        else:
                            statistic_instance = self._retrieve_statistic(installed_job, name)
                            statistic_instance.local = section.getboolean('local', True)
                            statistic_instance.storage = section.getboolean('storage', True)
                            statistic_instance.broadcast = section.getboolean('broadcast', False)
                            statistic_instance.save()
        else:
            local = self.local
            storage = self.storage
            broadcast = self.broadcast

            if self.statistic is None:
                if local is not None:
                    installed_job.default_stat_local = local
                if broadcast is not None:
                    installed_job.default_stat_broadcast = broadcast
                if storage is not None:
                    installed_job.default_stat_storage = storage
                installed_job.save()
            else:
                statistic_instance = self._retrieve_statistic(installed_job, self.statistic)
                if storage is None and broadcast is None and local is None:
                    statistic_instance.delete()
                else:
                    if local is not None:
                        statistic_instance.local = local
                    if broadcast is not None:
                        statistic_instance.broadcast = broadcast
                    if storage is not None:
                        statistic_instance.storage = storage
                    statistic_instance.save()

        self._physical_set_policy(installed_job)

    def _physical_set_policy(self, installed_job):
        # Compute destination file path
        destination = Path('/opt/openbach/agent/jobs', self.name)
        if self.config_file is None:
            destination = destination / '{}_rstats_filter.conf'.format(self.name)
        else:
            destination = destination / self.config_file

        # Create the new stats policy file
        with tempfile.NamedTemporaryFile(prefix='openbach_files/rstats_', mode='w', delete=False) as rstats_filter:
            print('[default]', file=rstats_filter)
            print('local =', installed_job.default_stat_local, file=rstats_filter)
            print('storage =', installed_job.default_stat_storage, file=rstats_filter)
            print('broadcast =', installed_job.default_stat_broadcast, file=rstats_filter)
            for stat in installed_job.statistics.all():
                print('[{}]'.format(stat.stat.name), file=rstats_filter)
                print('local =', stat.local, file=rstats_filter)
                print('storage =', stat.storage, file=rstats_filter)
                print('broadcast =', stat.broadcast, file=rstats_filter)

        parameters = {
                'user': 'openbach',
                'source': rstats_filter.name,
                'destination': destination.as_posix(),
        }

        # Launch the playbook and the associated job
        try:
            start_playbook('push_file', self.address, [parameters], True)
        finally:
            with suppress(OSError):
                os.remove(rstats_filter.name)


###############
# JobInstance #
###############

class JobInstanceAction(ConductorAction):
    """Base class that defines helper methods to deal with JobInstances"""

    def get_job_instance_or_not_found_error(self):
        try:
            job_instance_id = self.instance_id
        except AttributeError:
            raise errors.ConductorError(
                    'The JobInstance handler did not store the required '
                    'job instance id for the required job',
                    job_name=self.name, agent_address=self.address)
        try:
            return JobInstance.objects.get(id=job_instance_id)
        except JobInstance.DoesNotExist:
            raise errors.NotFoundError(
                    'The requested Job Instance is not in the database',
                    job_instance_id=self.instance_id)

    def _start_job_instance(self, method):
        job_instance = self.get_job_instance_or_not_found_error()
        scenario_id = job_instance.scenario_id
        owner_id = get_master_scenario_id(scenario_id)
        agent = job_instance.agent

        if agent is None:
            raise errors.UnprocessableError(
                    'The Agent associated to this JobInstance was uninstalled',
                    job_name=self.name, job_instance_id=job_instance.id)

        try:
            baton = OpenBachBaton(agent.address, agent.port)
            getattr(baton, method)(
                    job_instance.job_name,
                    job_instance.id,
                    scenario_id, owner_id,
                    job_instance.arguments,
                    job_instance.start_timestamp,
                    self.interval)
        except errors.UnreachableError:
            job_instance.delete()
            raise
        else:
            job_instance.set_status(JobInstance.Status.RUNNING)


class StartJobInstance(ThreadedAction, JobInstanceAction):
    """Action responsible for launching a Job on an Agent"""

    def __init__(self, address, name, arguments, date=None, interval=None, offset=0):
        super().__init__(address=address, name=name, arguments=arguments,
                         date=date, interval=interval, offset=offset)

    def _create_command_result(self):
        command_result, _ = JobInstanceCommandResult.objects.get_or_create(job_instance_id=self.instance_id)
        return self.set_running(command_result, 'status_start')

    @require_connected_user()
    def action(self):
        """Override the base threaded action handler to build the JobInstance
        first and store its ID in this object instance before launching it.
        """
        self._build_job_instance()
        super().action()
        return {'job_instance_id': self.instance_id}, 202

    def _build_job_instance(self, date=None):
        """Construct the JobInstance in the database and store its ID
        in this object instance. The Job Instance will be retrieved and
        started latter in regular action handling.
        """
        if date is None:
            date = self.date

        installed_infos = InfosInstalledJob(self.address, self.name)
        self.share_user(installed_infos)
        installed_job = installed_infos.get_installed_job_or_not_found_error()

        now = timezone.now()
        agent = installed_job.agent
        entity = getattr(agent, 'entity', None)
        job_instance = JobInstance.objects.create(
                job_name=installed_job.job.name,
                agent=agent, agent_name=agent.name,
                entity_name=entity.name if entity else '',
                collector=agent.collector,
                status=JobInstance.Status.SCHEDULED,
                update_status=now,
                start_date=now,
                periodic=False)
        ofi = self.openbach_function_instance
        if ofi is not None:
            job_instance.openbach_function_instance = ofi
        try:
            job_instance.configure(self.arguments, date, self.interval)
        except (KeyError, ValueError, Job.DoesNotExist) as err:
            job_instance.delete()
            raise errors.BadRequestError(
                    'An error occured when configuring the JobInstance',
                    job_name=self.name, agent_address=self.address,
                    arguments=self.arguments, error_message=str(err))
        else:
            if self.connected_user.is_active:
                job_instance.started_by = self.connected_user
            job_instance.save()
        self.instance_id = job_instance.id

    def _action(self):
        self._start_job_instance('start_job_instance')


class StopJobInstance(ThreadedAction, JobInstanceAction):
    """Action responsible for stopping a launched Job"""

    def __init__(self, instance_id=None, date=None, openbach_function_id=None):
        super().__init__(instance_id=instance_id, date=date,
                         openbach_function_id=openbach_function_id)

    def _create_command_result(self):
        command_result, _ = JobInstanceCommandResult.objects.get_or_create(job_instance_id=self.instance_id)
        return self.set_running(command_result, 'status_stop')

    @require_connected_user()
    def action(self):
        """Override the base threaded action handler to decorate it"""
        return super().action()

    def _action(self):
        job_instance = self.get_job_instance_or_not_found_error()
        owner = job_instance.started_by
        self._assert_user_in([owner])

        was_stopped = job_instance.is_stopped
        instance_id = self.instance_id
        job_name = job_instance.job_name

        if self.date is None:
            date = 'now'
            stop_date = timezone.now()
        else:
            date = self.date
            tz = timezone.get_current_timezone()
            stop_date = datetime.fromtimestamp(date / 1000, tz=tz)

        agent = job_instance.agent
        try:
            baton = OpenBachBaton(agent.address, agent.port)
        except AttributeError:
            raise errors.ConductorWarning(
                    'The Agent associated to this JobInstance was '
                    'uninstalled. Marking the JobInstance stopped anyway.',
                    job_instance_id=instance_id, job_name=job_name)
        else:
            baton.stop_job_instance(job_name, instance_id, date)
        finally:
            job_instance.stop_date = stop_date
            job_instance.save()

        if was_stopped:
            raise errors.ConductorWarning(
                    'The requested JobInstance was already stopped. '
                    'Sent a new stop order to the Agent anyway.',
                    job_instance_id=instance_id, job_name=job_name)


class StopJobInstances(ConductorAction):
    """Action responsible for stopping several launched Job"""

    def __init__(self, instance_ids=None, date=None, openbach_function_ids=None):
        super().__init__(instance_ids=instance_ids, date=date,
                         openbach_function_ids=openbach_function_ids)

    @require_connected_user()
    def _action(self):
        for instance_id in self.instance_ids:
            stop_job = StopJobInstance(instance_id, self.date)
            self.share_user(stop_job)
            stop_job.action()
        return {}, 202


class RestartJobInstance(ThreadedAction, JobInstanceAction):
    """Action responsible for restarting a launched Job"""

    def __init__(self, instance_id, arguments, date=None, interval=None):
        super().__init__(instance_id=instance_id, arguments=arguments,
                         date=date, interval=interval)

    def _create_command_result(self):
        command_result, _ = JobInstanceCommandResult.objects.get_or_create(job_instance_id=self.instance_id)
        return self.set_running(command_result, 'status_restart')

    @require_connected_user()
    def action(self):
        """Override the base threaded action handler to decorate it"""
        return super().action()

    def _action(self):
        job_instance = self.get_job_instance_or_not_found_error()
        owner = job_instance.started_by
        self._assert_user_in([owner])

        with db.transaction.atomic():
            try:
                job_instance.configure(self.arguments, self.date, self.interval)
            except (KeyError, ValueError, Job.DoesNotExist) as err:
                raise errors.BadRequestError(
                        'An error occured when reconfiguring the JobInstance',
                        job_name=job_instance.job_name,
                        job_instance_id=self.instance_id,
                        arguments=self.arguments, error_message=str(err))
            ofi = self.openbach_function_instance
            if ofi is not None:
                job_instance.openbach_function_instance = ofi
            job_instance.save()

        self._start_job_instance('restart_job_instance')


class StatusJobInstance(JobInstanceAction):
    """Action responsible for retrieving the status of a JobInstance"""

    def __init__(self, instance_id, update=False):
        super().__init__(instance_id=instance_id, update=update)

    def _action(self):
        job_instance = self.get_job_instance_or_not_found_error()
        owner = job_instance.started_by
        agent = job_instance.agent
        if not job_instance.is_stopped:
            self._assert_user_in([owner])

        if self.update and agent is not None:
            try:
                job_status = OpenBachBaton(agent.address, agent.port).status_job_instance(
                        job_instance.job_name, self.instance_id)
            except errors.UnreachableError:
                job_status = 'Agent Unreachable'
            except errors.UnprocessableError:
                job_status = 'Error'
            finally:
                job_status = job_instance.get_status(job_status.title())
                job_instance.set_status(job_status)

        status = job_instance.json
        if self.update and agent is None:
            warning_message = 'The Agent of this JobInstance was uninstalled. Status not updated.'
            status['warning'] = warning_message
            warning = errors.ConductorWarning(
                    warning_message,
                    job_instance_id=self.instance_id,
                    job_name=job_instance.job_name)
            syslog.syslog(syslog.LOG_WARNING, str(warning.json))

        return status, 200


class ListJobInstance(JobInstanceAction):
    """Action responsible for listing the JobInstances running on an Agent"""

    def __init__(self, address, update=False):
        super().__init__(address=address, update=update)

    def _action(self):
        agent_infos = InfosAgent(self.address)
        self.share_user(agent_infos)
        agent_infos._check_user_can_use_agent()
        agent = agent_infos.get_agent_or_not_found_error()

        jobs = [
                self._status_instances(installed_job)
                for installed_job in agent.installed_jobs.all()
        ]
        return {
                'address': self.address,
                'installed_jobs': jobs,
        }, 200

    def _status_instances(self, installed_job):
        return {
                'job_name': installed_job.job.name,
                'instances': list(self._status_instances_helper(installed_job)),
        }

    def _status_instances_helper(self, installed_job):
        for job_instance in JobInstance.objects.filter(
                job_name=installed_job.job.name,
                agent_name=installed_job.agent.name,
                stop_date__isnull=True):
            with suppress(errors.ConductorError):
                status = StatusJobInstance(job_instance.id, self.update)
                self.share_user(status)
                yield status.action()[0]


class ListJobInstances(ConductorAction):
    """Action responsible for listing the JobInstances running on several Agents"""

    def __init__(self, addresses, update=False):
        super().__init__(addresses=addresses, update=update)

    def _action(self):
        return {'instances': list(self._status_instances())}, 202

    def _status_instances(self):
        for address in self.addresses:
            list_job = ListJobInstance(address, self.update)
            self.share_user(list_job)
            yield list_job.action()[0]


############
# Scenario #
############

class ScenarioAction(ConductorAction):
    """Base class that defines helper methods to deal with Scenarios"""

    def get_scenario_or_not_found_error(self):
        project = self._get_project_if_own()

        try:
            return Scenario.objects.get(name=self.name, project=project)
        except Scenario.DoesNotExist:
            raise errors.NotFoundError(
                    'The requested Scenario is not in the database',
                    scenario_name=self.name,
                    project_name=self.project)

    def _register_scenario(self, create=False):
        description = self.json_data.get('description')
        project = self._get_project_if_own()

        try:
            with db.transaction.atomic():
                if create:
                    try:
                        scenario = Scenario.objects.create(
                                name=self.name, project=project,
                                description=description)
                    except db.utils.IntegrityError:
                        raise errors.ConflictError(
                                'Trying to create an existing Scenario.',
                                name=self.name, project=project.name)
                else:
                    scenario = Scenario.objects.get(
                            name=self.name, project=project)
                scenario.description = description
                scenario.save()
                scenario.load_from_json(self.json_data)
                scenario.save()
        except Scenario.MalformedError as e:
            raise errors.BadRequestError(
                    'Data of the Scenario are malformed',
                    scenario_name=self.name,
                    error_message=e.error,
                    scenario_data=self.json_data)

    def _get_project_if_own(self):
        project = InfosProject(self.project).get_project_or_not_found_error()
        self._assert_user_in(project.owners.all())
        return project


class CreateScenario(ScenarioAction):
    """Action responsible for creating a new Scenario"""

    def __init__(self, json_data, project):
        name = extract_and_check_name_from_json(json_data, kind='Scenario')
        super().__init__(json_data=json_data, name=name, project=project)

    @require_connected_user()
    def _action(self):
        self._register_scenario(create=True)
        scenario = self.get_scenario_or_not_found_error()
        return scenario.json, 200


class DeleteScenario(ScenarioAction):
    """Action responsible for deleting an existing Scenario"""

    def __init__(self, name, project):
        super().__init__(name=name, project=project)

    @require_connected_user()
    def _action(self):
        scenario = self.get_scenario_or_not_found_error()
        scenario.delete()
        return None, 204


class ModifyScenario(ScenarioAction):
    """Action responsible for modifying an existing Scenario"""

    def __init__(self, json_data, name, project):
        super().__init__(json_data=json_data, name=name, project=project)

    @require_connected_user()
    def _action(self):
        extract_and_check_name_from_json(self.json_data, self.name, kind='Scenario')
        with db.transaction.atomic():
            self._register_scenario(create=False)
        scenario = self.get_scenario_or_not_found_error()
        return scenario.json, 200


class ModifyScenarioFavorite(ScenarioAction):
    """Action responsible for modifying an existing Scenario"""

    def __init__(self, favorite, name, project):
        super().__init__(favorite=favorite, name=name, project=project)

    @require_connected_user()
    def _action(self):
        scenario = self.get_scenario_or_not_found_error()
        if self.connected_user.is_active:
            if self.favorite:
                scenario.favorited_by.add(self.connected_user)
            else:
                scenario.favorited_by.remove(self.connected_user)
        return user_to_json(self.connected_user), 200


class InfosScenario(ScenarioAction):
    """Action responsible for information retrieval about a Scenario"""

    def __init__(self, name, project):
        super().__init__(name=name, project=project)

    def _action(self):
        scenario = self.get_scenario_or_not_found_error()
        return scenario.json, 200


class ListScenarios(ScenarioAction):
    """Action responsible for information retrieval about all Scenarios"""

    def __init__(self, project):
        super().__init__(project=project)

    def _action(self):
        project = self._get_project_if_own()
        scenarios = Scenario.objects.filter(project=project)
        return [scenario.json for scenario in scenarios], 200


####################
# ScenarioInstance #
####################

class ScenarioInstanceAction(ConductorAction):
    """Base class that defines helper methods to deal with ScenarioInstances"""

    def get_scenario_instance_or_not_found_error(self, quiet=False):
        try:
            scenario_instance_id = self.instance_id
        except AttributeError:
            raise errors.ConductorError(
                    'The ScenarioInstance handler did not store the required '
                    'scenario instance id for the required scenario',
                    scenario_name=self.name, project_name=self.project)

        if quiet:
            queryset = ScenarioInstance.objects.select_related('scenario_version__scenario').only('scenario_version__scenario__name', 'id', 'status', 'start_date', 'stop_date')
        else:
            queryset = ScenarioInstance.objects.select_related('scenario_version__scenario__project')

        try:
            instance = queryset.get(id=scenario_instance_id)
        except ScenarioInstance.DoesNotExist:
            raise errors.NotFoundError(
                    'The requested Scenario Instance is not in the database',
                    scenario_instance_id=self.instance_id)
        else:
            if not instance.is_stopped:
                self._assert_user_in([instance.started_by])
            return instance


class StartScenarioInstance(ScenarioInstanceAction):
    """Action responsible of launching new Scenario Instances"""

    def __init__(self, scenario_name, project, arguments=None, date=None):
        if arguments is None:
            arguments = {}
        super().__init__(name=scenario_name, project=project, arguments=arguments, date=date)

    def _action(self):
        self._build_scenario_instance()
        clapper = OpenBachClapperBoard()
        self.share_user(clapper)
        return clapper.start_scenario_instance(self.instance_id)

    def _recurse_subscenario_for_start_job_instances(self, scenario_infos):
        scenario = scenario_infos.get_scenario_or_not_found_error()
        for function in scenario.openbach_functions.all():
            openbach_function = function.get_content_model()
            if isinstance(openbach_function, OpenbachFunctionStartJobInstance):
                yield openbach_function
            elif isinstance(openbach_function, OpenbachFunctionStartScenarioInstance):
                scenario_infos.name = openbach_function.scenario_name
                yield from self._recurse_subscenario_for_start_job_instances(scenario_infos)

    def _check_jobs(self, start_job_instances):
        uninstalled_jobs = {}
        unattached_agents = set()
        for start_job_instance in start_job_instances:
            entity = start_job_instance.entity_name
            job = start_job_instance.job_name
            agent = Entity.objects.get(name=entity).agent
            if agent is None:
                unattached_agents.add(entity)
            else:
                if not InstalledJob.objects.filter(job__name=job, agent=agent).exists():
                    try:
                        uninstalled_jobs[entity]['jobs'].append(job)
                    except KeyError:
                        uninstalled_jobs[entity] = {'agent': agent.json, 'jobs': [job]}

        if unattached_agents:
            raise errors.UnprocessableError(
                    'Cannot start scenario {}: some entities are missing an attached agent.'.format(self.name),
                    entities=list(unattached_agents),
            )
        if uninstalled_jobs:
            raise errors.UnprocessableError(
                    'Cannot start scenario {}: some jobs are missing on agents.'.format(self.name),
                    entities=uninstalled_jobs,
            )

    def _build_scenario_instance(self):
        scenario_infos = InfosScenario(self.name, self.project)
        self.share_user(scenario_infos)

        scenario = scenario_infos.get_scenario_or_not_found_error()
        self._check_jobs(self._recurse_subscenario_for_start_job_instances(scenario_infos))

        scenario = scenario.versions.last()
        starting_user = self.connected_user
        if not self.connected_user.is_active:
            starting_user = None

        scenario_instance = ScenarioInstance.objects.create(
                scenario_version=scenario,
                status=ScenarioInstance.Status.SCHEDULING,
                start_date=timezone.now(),
                started_by=starting_user,
                openbach_function_instance=self.openbach_function_instance)
        self.instance_id = scenario_instance.id

        # Populate values for ScenarioArguments
        for argument, value in self.arguments.items():
            try:
                argument_instance = ScenarioArgument.objects.get(
                        name=argument,
                        scenario_version=scenario)
            except ScenarioArgument.DoesNotExist:
                raise errors.BadRequestError(
                        'A value was provided for an Argument that '
                        'is not defined for this Scenario.',
                        scenario_name=self.name,
                        project_name=self.project,
                        argument_name=argument)
            ScenarioArgumentValue.objects.create(
                    value=value, argument=argument_instance,
                    scenario_instance=scenario_instance)

        # Create instances for each OpenbachFunction of this Scenario
        # and check that the values of the arguments fit
        for openbach_function in scenario.openbach_functions.all():
            openbach_function_instance = OpenbachFunctionInstance.objects.create(
                    openbach_function=openbach_function,
                    scenario_instance=scenario_instance,
                    status=OpenbachFunctionInstance.Status.SCHEDULED)
            try:
                openbach_function_instance.validate_arguments()
            except ValidationError as e:
                raise errors.BadRequestError(
                        'Arguments of an OpenbachFunction have '
                        'the wrong type of values.',
                        openbach_function_name=openbach_function.name,
                        error_message=str(e))
            except Entity.DoesNotExist:
                # Special case of a StartJobInstance
                parameters = scenario_instance.parameters
                entity_name = openbach_function.get_content_model().instance_value('entity_name', parameters)
                raise errors.ConductorError(
                        'Entity does not exist in the project',
                        entity_name=entity_name, project_name=self.project)
            except Agent.DoesNotExist:
                # Special case of a StartJobInstance
                parameters = scenario_instance.parameters
                entity_name = openbach_function.get_content_model().instance_value('entity_name', parameters)
                raise errors.ConductorError(
                        'Entity does not have an associated agent',
                        entity_name=entity_name, project_name=self.project)


class StopScenarioInstance(ScenarioInstanceAction):
    """Action responsible of stopping an existing Scenario Instance"""

    def __init__(self, instance_id=None, date=None, openbach_function_id=None):
        super().__init__(
                instance_id=instance_id, date=date,
                openbach_function_id=openbach_function_id)

    def _action(self):
        clapper = OpenBachClapperBoard()
        self.share_user(clapper)
        return clapper.stop_scenario_instance(self.instance_id)


class RemoveScenarioInstance(ScenarioInstanceAction):
    """Action responsible of removing an existing
    Scenario Instance from the database.
    """

    def __init__(self, instance_id):
        super().__init__(instance_id=instance_id)

    def _action(self):
        scenario_instance = self.get_scenario_instance_or_not_found_error()
        if not scenario_instance.is_stopped:
            raise errors.ConflictError(
                    'Trying to remove a scenario_instance still running',
                    scenario_instance_id=self.instance_id)
        scenario_instance.delete()
        return None, 204


class InfosScenarioInstance(ScenarioInstanceAction):
    """Action responsible for information retrieval about a ScenarioInstance"""

    def __init__(self, instance_id, quiet=False):
        super().__init__(instance_id=instance_id, quiet=quiet)

    def _action(self):
        scenario_instance = self.get_scenario_instance_or_not_found_error(self.quiet)
        if self.quiet:
            result = scenario_instance.limited_json
        else:
            result = scenario_instance.json
        return result, 200


class ListScenarioInstances(ScenarioInstanceAction):
    """Action responsible for information retrieval about all
    ScenarioInstances of a given Scenario.
    """

    def __init__(self, project, name=None, max_per_page=None, page_offset=None, quiet=False):
        super().__init__(name=name, project=project, max_per_page=max_per_page, page_offset=page_offset, quiet=quiet)

    def _action(self):
        scenario_info = InfosScenario(self.name, self.project)
        self.share_user(scenario_info)
        project = scenario_info._get_project_if_own()
        
        if self.name is not None:
            try:
                instances_query = ScenarioInstance.objects.filter(scenario_version__scenario__name=self.name,scenario_version__scenario__project=self.project)
            except Scenario.DoesNotExist:
                raise errors.NotFoundError(
                        'The requested Scenario is not in the database',
                        scenario_name=self.name,
                        project_name=self.project)
        else:
            instances_query = ScenarioInstance.objects.filter(scenario_version__scenario__project=self.project)

        if self.max_per_page is not None:
            offset = self.page_offset or 0
            page = instances_query.order_by('-id')[offset:offset+self.max_per_page]
        else:
            page = instances_query.order_by('-id')

        serialize = operator.attrgetter('limited_json' if self.quiet else 'json')
        instances = [
                serialize(instance) for instance in page
        ]

        return instances, 200



class RecursiveScenarioInstanceAction(ScenarioInstanceAction):
    def _recurse_into_scenario_instance(self, scenario_instance, action, *args):
        functions = scenario_instance.openbach_functions_instances.exclude(
                started_job__isnull=True, started_scenario__isnull=True)
        for openbach_function in functions:
            with suppress(JobInstance.DoesNotExist):
                job_instance = openbach_function.started_job
                dates = {
                        '@job_name': job_instance.job_name,
                        '@scenario_start_date': scenario_instance.start_date,
                        '@job_instance_start_date': job_instance.start_date,
                        '@scenario_stop_date': scenario_instance.stop_date,
                        '@job_instance_stop_date': job_instance.stop_date,
                }
                action(job_instance, *args, dates=dates)
            with suppress(ScenarioInstance.DoesNotExist):
                subscenario_instance = openbach_function.started_scenario
                self._recurse_into_scenario_instance(subscenario_instance, action, *args)


class StatisticsFilesCount(RecursiveScenarioInstanceAction):
    """Action that check the existence of some files
    generated by the jobs of a Scenario.
    """

    def __init__(self, instance_id):
        super().__init__(instance_id=instance_id)

    def _update_files_count(self, start_job_instance, files_found, condition, **kwargs):
        connection = InfluxDBConnection(
                start_job_instance.collector.address,
                start_job_instance.collector.stats_query_port,
                start_job_instance.collector.stats_database_name,
                start_job_instance.collector.stats_database_precision)
        response = connection.raw_statistics(
                job_instance=start_job_instance.id,
                fields='COUNT(*)',
                condition=condition)

        for job, counts in response:
            for key, value in counts.items():
                if key.startswith('count_'):
                    files_found[job] += Counter({key[6:]: value})

    def _action(self):
        files_found = defaultdict(Counter)
        files_only = ConditionTag('@stored_file', Operator.Equal, 'true')

        scenario_instance = self.get_scenario_instance_or_not_found_error()
        self._recurse_into_scenario_instance(scenario_instance, self._update_files_count, files_found, files_only)

        return files_found, 200


class ExportScenarioInstance(RecursiveScenarioInstanceAction):
    """Action responsible for information retrieval about a ScenarioInstance"""

    def __init__(self, instance_id, **files):
        super().__init__(
                instance_id=instance_id, files=files,
                tz=timezone.get_current_timezone())

    def _compute_headers(self, start_job_instance, headers, stats_names, **kwargs):
        job_name = start_job_instance.job_name
        with suppress(KeyError):
            headers |= set(stats_names[job_name])

    def _export_start_job_instance(self, start_job_instance, csv_writer, dates):
        connection = InfluxDBConnection(
                start_job_instance.collector.address,
                start_job_instance.collector.stats_query_port,
                start_job_instance.collector.stats_database_name,
                start_job_instance.collector.stats_database_precision)
        generator = connection.raw_statistics(
                job=start_job_instance.job_name,
                job_instance=start_job_instance.id)
        for job_name, stats in generator:
            stats.update(dates)
            with suppress(KeyError):
                stats['time'] = datetime.fromtimestamp(
                        stats['time'] / 1000,
                        tz=self.tz)
            csv_writer.writerow(stats)

    def _export_scenario_metadata(self, start_job_instance, csv_writer, dates):
        stats = {
                '@agent_name': start_job_instance.agent_name,
                '@scenario_instance_id': start_job_instance.scenario_id,
                '@job_instance_id': start_job_instance.id,
                '@owner_scenario_instance_id': start_job_instance.started_by,
        }
        stats.update(dates)
        csv_writer.writerow(stats)

    def _fetch_generated_files(self, start_job_instance, collect_directory, dates):
        stats_names = self.files.get(start_job_instance.job_name)
        if stats_names and start_job_instance.agent:
            collector = start_job_instance.collector
            connection = InfluxDBConnection(
                collector.address,
                collector.stats_query_port,
                collector.stats_database_name,
                collector.stats_database_precision)
            scenario_id = start_job_instance.scenario_id
            scenarios = connection.statistics(
                job_instance=start_job_instance.id,
                scenario=scenario_id,
                fields=stats_names)
            try:
                scenario = next(s for s in scenarios if s.instance_id == scenario_id)
            except StopIteration:
                # Scenario should have generated the requested
                # statistic but somehow the job failed to do so,
                # so we don't get anything in here. Just bail out!
                return
            job = scenario.get_or_create_job(
                    start_job_instance.job_name,
                    start_job_instance.id,
                    start_job_instance.agent_name)
            normalized_job_name = '{}.{}_({}).'.format(
                    '_'.join(start_job_instance.agent_name.split()),
                    '_'.join(start_job_instance.job_name.split()),
                    start_job_instance.id)
            for stats in job.statistics_data.values():
                for stat_name in stats_names:
                    files_to_fetch = [
                            file_paths[stat_name]
                            for file_paths in stats.dated_data.values()
                            if stat_name in file_paths
                    ]
                    if files_to_fetch:
                        start_playbook(
                                'fetch_file',
                                 start_job_instance.agent.address,
                                 normalized_job_name + '_'.join(stat_name.split()),
                                 collect_directory,
                                 files_to_fetch)

    def _action(self):
        scenario_instance = self.get_scenario_instance_or_not_found_error()
        project = scenario_instance.scenario.project
        self._assert_user_in(project.owners.all())

        if not scenario_instance.is_stopped:
            raise errors.ConflictError(
                    'Trying to export the statistics of a scenario_instance still running',
                    scenario_instance_id=self.instance_id)

        get_stats_names = StatisticsNames(project.name)
        self.share_user(get_stats_names)
        stats_names = get_stats_names.action()[0]

        headers = {
                '@agent_name',
                '@job_instance_id',
                '@scenario_instance_id',
                '@owner_scenario_instance_id',
                '@job_instance_start_date',
                '@job_instance_stop_date',
                '@scenario_start_date',
                '@scenario_stop_date',
                '@stored_file',
                '@job_name',
                '@suffix',
        }
        common_headers_length = len(headers)

        self._recurse_into_scenario_instance(
                scenario_instance,
                self._compute_headers,
                headers,
                stats_names)

        has_jobs_stats = len(headers) > common_headers_length
        if has_jobs_stats:
            headers.add('time')

        csv_path = None
        with tempfile.NamedTemporaryFile('w', newline='', delete=False, prefix='openbach_files/', suffix='.csv') as csvfile:
            csv_writer = csv.DictWriter(csvfile.file, fieldnames=sorted(headers))
            csv_writer.writeheader()
            self._recurse_into_scenario_instance(
                    scenario_instance,
                    self._export_start_job_instance if has_jobs_stats
                    else self._export_scenario_metadata,
                    csv_writer)
            csv_path = csvfile.name

        if not self.files:
            return csv_path, 200

        with tempfile.TemporaryDirectory(prefix='openbach_files/') as generated_dir:
            self._recurse_into_scenario_instance(
                    scenario_instance,
                    self._fetch_generated_files,
                    generated_dir + '/')

            with tempfile.NamedTemporaryFile('wb', prefix='openbach_files/', suffix='.tar.gz', delete=False) as f:
                with tarfile.open(fileobj=f, mode='w:gz') as tar:
                    tar.add(csv_path, 'scenario_instance_{}.csv'.format(self.instance_id))
                    for extra_file in Path(generated_dir).glob('*.tar.gz'):
                        tar.add(extra_file.as_posix(), extra_file.name)

        os.remove(csv_path)

        return f.name, 200


###########
# Project #
###########

class ProjectAction(ConductorAction):
    """Base class that defines helper methods to deal with Projects"""

    def get_project_or_not_found_error(self):
        try:
            return Project.objects.get(name=self.name)
        except Project.DoesNotExist:
            raise errors.NotFoundError(
                    'The requested Project is not in the database',
                    project_name=self.name)

    def _register_project(self, constructor):
        description = self.json_data.get('description')
        try:
            project = constructor(name=self.name)
        except db.utils.IntegrityError:
            raise errors.ConflictError(
                    'Trying to create an existing Project.',
                    name=self.name)
        project.description = description
        project.save()
        try:
            project.load_from_json(self.json_data)
        except Project.MalformedError as e:
            project.delete()
            raise errors.BadRequestError(
                    'Data of the Project are malformed',
                    project_name=self.name,
                    error_message=e.error,
                    project_data=self.json_data)
        else:
            project.save()
            owners_names = self.json_data.get('owners', [])
            owners = User.objects.filter(username__in=owners_names)
            project.owners.set(owners)

    def _gather_topology_facts(self):
        project = self.get_project_or_not_found_error()

        # Gather facts for all Agents
        addresses = [
                entity.agent.address for entity in
                project.entities.exclude(agent__isnull=True)
        ]
        all_facts = {
                address: start_playbook('gather_facts', address)
                for address in addresses
        }

        # Iterate over all interfaces for every agent
        topology = {}
        for agent, facts in all_facts.items():
            for iface in filter('lo'.__ne__, facts['ansible_interfaces']):
                try:
                    infos_ipv4 = facts['ansible_{}'.format(iface)]['ipv4']
                except KeyError:
                    continue
                net = IPv4Network("{}/{}".format(
                        infos_ipv4['network'],
                        infos_ipv4['netmask'],
                ))
                interface = (iface, infos_ipv4['address'], str(net))
                topology.setdefault(agent, []).append(interface)

        return topology

    def _build_topology(self):
        project = self.get_project_or_not_found_error()
        topology = self._gather_topology_facts()

        # Get hidden networks to filter them out
        hidden_networks = {
                hidden_network.name for hidden_network in
                project.hidden_networks.all()
        }
        # Associate Networks to Entities
        for agent_ip, interfaces in topology.items():
            entity = project.entities.get(agent__address=agent_ip)
            entity.networks.clear()
            for interface_name, ip_address, network in interfaces:
                if network in hidden_networks:
                    continue
                network, _ = Network.objects.get_or_create(
                        address=network, project=project,
                        defaults={'name': network})
                Interface.objects.create(
                        entity=entity, network=network,
                        interface=interface_name, ip_address=ip_address)

        # Remove networks associated to interfaces that were removed
        project.networks.filter(entities__isnull=True).exclude(address__in=hidden_networks).delete()

    def _import_topology(self, json_data):
        project = self.get_project_or_not_found_error()

        # Get hidden networks to filter them out
        hidden_networks = {
                hidden_network.name for hidden_network in
                project.hidden_networks.all()
        }

        # Create old networks and associate to entities
        for entity in json_data.get('entity', []):
            try:
                entity_obj = project.entities.get(name=entity['name'])
            except Entity.DoesNotExist:
                project.delete()
                raise errors.BadRequestError(
                        'Data of the Project are malformed. '
                        'Entity \'{}\' does not exist.'.format(entity['name']),
                        project_name=project.name,
                        project_data=json_data)

            except KeyError as e:
                project.delete()
                raise errors.BadRequestError(
                        'Data of the Project are malformed. '
                        'Missing key \'{}\''.format(str(e)),
                        project_name=project.name,
                        project_data=json_data)
            try:
                for network in entity['networks']:
                    if network['address'] in hidden_networks:
                        continue
                    # TODO: use the fact that the Interface will have
                    # a null IP to avoid the 'imported:{}' name?
                    network = Network.objects.get_or_create(
                            address="imported:{}".format(network['address']),
                            project=project, defaults={'name': network['name']})[0]
                    Interface.objects.create(entity=entity_obj, network=network)
            except KeyError as e:
                project.delete()
                raise errors.BadRequestError(
                        'Data of the Project are malformed. '
                        'Missing key \'{}\''.format(str(e)),
                        project_name=project.name,
                        project_data=json_data)

    def _clean_agent(self, entity):
        if not entity:
            return
        entity.networks.exclude(address__startswith="imported").delete()
        entity.agent = None
        entity.save()

    def _enforce_topology(self, modified_entity=None):
        project = self.get_project_or_not_found_error()
        entities = project.entities.exclude(agent__isnull=True)
        entities_without_agents = project.entities.filter(agent__isnull=True)
        topology = self._gather_topology_facts()

        # Get hidden networks to filter them out
        hidden_networks = {
                hidden_network.name for hidden_network in
                project.hidden_networks.all()
        }

        # Remove new networks from entities without agents
        for entity in entities_without_agents:
            entity.networks.exclude(address__startswith="imported").delete()

        # Remove any network not connected to any entity
        project.networks.filter(entities__isnull=True).delete()

        issues = []
        for entity in entities:
            address = entity.agent.address
            # Create new networks
            for interface, ip_address, network_address in topology[address]:
                if network_address in hidden_networks:
                    continue
                network, _ = Network.objects.get_or_create(
                        address=network_address, project=project,
                        defaults={'name': network_address})
                Interface.objects.create(
                        entity=entity, network=network,
                        interface=interface, ip_address=ip_address)

            # Check number of interfaces
            old_networks = entity.networks.filter(address__startswith="imported").count()
            new_networks = entity.networks.exclude(address__startswith="imported").count()
            if (old_networks > new_networks):
                self._clean_agent(entity)
                issues.append(
                        'Network topology is not compatible with the '
                        'scenario\'s imported topology: agent {} doesn\'t '
                        'have enough interfaces (found {}, expected '
                        '{})'.format(address, new_networks, old_networks))

        if issues:
            raise errors.UnprocessableError(
                    'Errors found in proposed topology',
                    errors=issues, project_name=project.name)

        old_networks = project.networks.filter(address__startswith="imported")
        new_networks = project.networks.exclude(address__startswith="imported")
        # Create all potential networks.
        for old_network, new_network in itertools.product(old_networks, new_networks):
            PotentialNetwork.objects.get_or_create(
                    old_network=old_network,
                    new_network=new_network,
                    project=project)

        # Remove inconsistencies
        for potential_network in (project.potential_networks.all()
                                  .prefetch_related("old_network__entities")
                                  .prefetch_related("new_network__entities")):
            if not (set(potential_network.old_network.entities.all()) <=
                    (set(potential_network.new_network.entities.all()) | set(entities_without_agents))):
                potential_network.delete()

        if entities_without_agents:
            return

        # The agent assignment is finished. Check that all is coherent
        # If an old network has no new network candidate, error
        for network in old_networks:
            if not project.potential_networks.filter(old_network=network):
                self._clean_agent(modified_entity)
                raise errors.UnprocessableError(
                        'Network {} wasn\'t found on the '
                        'topology'.format(network.name),
                        project_name=project.name)

        # If there are more old networks(duplicates) than candidates, error
        if project.potential_networks.distinct("new_network").count() < len(old_networks):
            self._clean_agent(modified_entity)
            raise errors.UnprocessableError(
                    'Network topology is not compatible: '
                    'cannot map available networks into '
                    'imported networks.',
                    project_name=project.name)

        # Remove old networks
        old_networks.delete()


class CreateProject(ProjectAction):
    """Action responsible for creating a new Project"""

    def __init__(self, json_data, ignore_topology):
        name = extract_and_check_name_from_json(json_data, kind='Project')
        super().__init__(
                name=name, json_data=json_data,
                ignore_topology=ignore_topology
        )

    @require_connected_user()
    def _action(self):
        if '/' in self.name:
            raise errors.BadRequestError(
                    '\'/\' character forbidden in project name',
                    project_name=self.name)
        with suppress(ValueError):
            integer = int(self.name)
            raise errors.BadRequestError(
                    'Project name cannot be digits only',
                    project_name=integer)
        self._register_project(Project.objects.create)
        if not self.ignore_topology:
            self._import_topology(self.json_data)
        else:
            self._build_topology()
        project = self.get_project_or_not_found_error()
        return project.json, 200


class DeleteProject(ProjectAction):
    """Action responsible for deleting an existing Project"""

    def __init__(self, name):
        super().__init__(name=name)

    @require_connected_user()
    def _action(self):
        project = self.get_project_or_not_found_error()
        self._assert_user_in(project.owners.all())
        project.delete()
        return None, 204


class ModifyProject(ProjectAction):
    """Action responsible for modifying an existing Project"""

    def __init__(self, name, json_data):
        super().__init__(name=name, json_data=json_data)

    @require_connected_user()
    def _action(self):
        extract_and_check_name_from_json(self.json_data, self.name, kind='Project')
        project = self.get_project_or_not_found_error()
        self._assert_user_in(project.owners.all())
        del project

        with db.transaction.atomic():
            self._register_project(Project.objects.get)
        self._build_topology()
        project = self.get_project_or_not_found_error()
        return project.json, 200


class InfosProject(ProjectAction):
    """Action responsible for information retrieval about a Project"""

    def __init__(self, name):
        super().__init__(name=name)

    def _action(self):
        project = self.get_project_or_not_found_error()
        self._assert_user_in(project.owners.all())
        return project.json, 200


class RefreshTopologyProject(ProjectAction):
    """Action responsible for refreshing an existing Project's network topology"""

    def __init__(self, name):
        super().__init__(name=name)

    def _action(self):
        project = self.get_project_or_not_found_error()
        self._assert_user_in(project.owners.all())
        if project.networks.filter(address__startswith='imported'):
            self._enforce_topology()
        else:
            self._build_topology()
        return project.json, 200


class ListProjects(ProjectAction):
    """Action responsible for information retrieval about all Projects"""

    def __init__(self):
        super().__init__()

    def _action(self):
        return list(self._infos_projects()), 200

    def _infos_projects(self):
        for project in Project.objects.all():
            with suppress(errors.ForbiddenError):
                self._assert_user_in(project.owners.all())
                yield project.json


class ModifyNetworks(ProjectAction):
    """Action responsible for modifying an existing Entity"""

    def __init__(self, name, json_data):
        super().__init__(name=name, json_data=json_data)

    @require_connected_user()
    def _action(self):
        project = self.get_project_or_not_found_error()
        self._assert_user_in(project.owners.all())
        for network in self.json_data:
            with suppress(KeyError, Network.DoesNotExist):
                network_obj = Network.objects.get(address=network['address'], project=project)
                network_obj.name = network['name']
                network_obj.save()
        return project.json, 200


##########
# Entity #
##########

class EntityAction(ConductorAction):
    """Base class that defines helper methods to deal with Entities"""

    def get_entity_or_not_found_error(self):
        project = InfosProject(self.project).get_project_or_not_found_error()
        try:
            return Entity.objects.get(name=self.name, project=project)
        except Entity.DoesNotExist:
            raise errors.NotFoundError(
                    'The requested Entity is not in the database',
                    project_name=self.project, entity_name=self.name)

    def _register_entity(self):
        project = InfosProject(self.project).get_project_or_not_found_error()
        self._assert_user_in(project.owners.all())
        description = self.json_data.get('description')
        agent = self.json_data.get('agent')
        if agent:
            address = agent.get('address')
            agent = InfosAgent(address).get_agent_or_not_found_error()
            if agent.project and agent.project.name != project.name:
                raise errors.ConflictError(
                        'Agent already reserved for project {}'
                        .format(agent.project.name))

        entity, _ = Entity.objects.get_or_create(name=self.name, project=project)
        entity.description = description
        entity.agent = agent
        entity.save()


class AddEntity(EntityAction):
    """Action responsible for creating a new Entity"""

    def __init__(self, project, json_data):
        name = extract_and_check_name_from_json(json_data, kind='Entity')
        super().__init__(
                name=name, project=project,
                json_data=json_data)

    @require_connected_user()
    def _action(self):
        self._register_entity()
        entity = self.get_entity_or_not_found_error()
        InfosProject(self.project)._build_topology()
        return entity.project.json, 200


class ModifyEntity(EntityAction):
    """Action responsible for modifying an existing Entity"""

    def __init__(self, name, project, json_data):
        super().__init__(
                name=name, project=project,
                json_data=json_data)

    @require_connected_user()
    def _action(self):
        extract_and_check_name_from_json(self.json_data, self.name, kind='Entity')
        with db.transaction.atomic():
            self._register_entity()

        entity = self.get_entity_or_not_found_error()
        project = InfosProject(self.project)

        if entity.project.networks.filter(address__startswith='imported'):
            project._enforce_topology(entity)
        else:
            project._build_topology()

        return entity.project.json, 200


class DeleteEntity(EntityAction):
    """Action responsible for deleting an existing Entity"""

    def __init__(self, name, project):
        super().__init__(name=name, project=project)

    @require_connected_user()
    def _action(self):
        entity = self.get_entity_or_not_found_error()
        self._assert_user_in(entity.project.owners.all())
        entity.delete()
        project_infos = InfosProject(self.project)
        self.share_user(project_infos)
        project_infos._build_topology()
        project = project_infos.get_project_or_not_found_error()
        return project.json, 200


class InfosEntity(EntityAction):
    """Action responsible for information retrieval about an Entity"""

    def __init__(self, name, project):
        super().__init__(name=name, project=project)

    def _action(self):
        entity = self.get_entity_or_not_found_error()
        self._assert_user_in(entity.project.owners.all())
        return entity.json, 200


class ListEntities(EntityAction):
    """Action responsible for information retrieval about all Entities"""

    def __init__(self, project):
        super().__init__(project=project)

    def _action(self):
        project = InfosProject(self.project).get_project_or_not_found_error()
        self._assert_user_in(project.owners.all())
        entities = Entity.objects.filter(project=project)
        return [entity.json for entity in entities], 200


#########
# State #
#########

class StateCollector(ConductorAction):
    """Action that retrieve the last action done on a Collector"""

    def __init__(self, address):
        super().__init__(address=address)

    def _action(self):
        command_result, _ = CollectorCommandResult.objects.get_or_create(address=self.address)
        return command_result.json, 200


class StateAgent(ConductorAction):
    """Action that retrieve the last action done on a Agent"""

    def __init__(self, address):
        super().__init__(address=address)

    def _action(self):
        command_result, _ = AgentCommandResult.objects.get_or_create(address=self.address)
        return command_result.json, 200


class StateJob(ConductorAction):
    """Action that retrieve the last action done on an Installed Job"""

    def __init__(self, address, name):
        super().__init__(address=address, name=name)

    def _action(self):
        command_result, _ = InstalledJobCommandResult.objects.get_or_create(
                address=self.address,
                job_name=self.name)
        return command_result.json, 200


class StatePushFile(ConductorAction):
    """Action that retrieve the last action done on a Pushed File"""

    def __init__(self, name, path, address):
        super().__init__(name=name, path=path, address=address)

    def _action(self):
        command_result, _ = FileCommandResult.objects.get_or_create(
                filename=self.name,
                remote_path=self.path,
                address=self.address)
        return command_result.json, 200


class StateJobInstance(ConductorAction):
    """Action that retrieve the last action done on a JobInstance"""

    def __init__(self, instance_id):
        super().__init__(instance_id=instance_id)

    def _action(self):
        command_result, _ = JobInstanceCommandResult.objects.get_or_create(job_instance_id=self.instance_id)
        return command_result.json, 200


#########
# Users #
#########

class UpdateUsers(ConductorAction):
    """Action that update permissions of users in the database"""

    def __init__(self, users_permissions=None):
        if users_permissions is None:
            users_permissions = []
        super().__init__(users_permissions=users_permissions)

    @require_connected_user(admin=True)
    def _action(self):
        if not isinstance(self.users_permissions, list):
            raise errors.BadRequestError(
                    'The new permissions of users should be a list of objects')

        issues = list(self._apply_permissions())
        if issues:
            raise errors.ConductorWarning(
                    'Some users in the permissions list could not be updated',
                    errors=issues)

        return None, 204

    def _apply_permissions(self):
        for permissions in self.users_permissions:
            try:
                username = permissions['login']
            except KeyError:
                yield {
                    'permissions': permissions,
                    'error': 'Username not found',
                }
                continue

            try:
                active = permissions['active']
                staff = permissions['admin']
            except KeyError as e:
                yield {
                    'permissions': permissions,
                    'error': 'permission \'{}\' not found'.format(e),
                }
                continue

            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                yield {
                    'permissions': permissions,
                    'error': 'User not found in the database',
                }
            else:
                user.is_active = bool(staff or active)
                user.is_staff = bool(staff)
                user.save()


class DeleteUsers(ConductorAction):
    """Action that removes users from the database"""

    def __init__(self, usernames=None):
        if usernames is None:
            usernames = []
        super().__init__(usernames=usernames)

    @require_connected_user(admin=True)
    def _action(self):
        if not isinstance(self.usernames, list):
            raise errors.BadRequestError(
                    'The users to delete should be a list of usernames')
        User.objects.filter(username__in=self.usernames).delete()
        return None, 204


class ListUsers(ConductorAction):
    """Action that list the registered users in the database"""

    @require_connected_user()
    def _action(self):
        return list(self._users_to_json()), 200

    def _users_to_json(self):
        users = User.objects.all()
        if not self.connected_user.is_staff:
            users = users.filter(is_active=True)

        for user in users:
            yield {
                'username': user.get_username(),
                'name': user.get_full_name(),
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_user': user.is_active,
                'is_admin': user.is_staff,
                'email': user.email,
            }


##############
# Statistics #
##############

class StatisticsNames(ProjectAction):
    """Action that retrieve the names of statistics in InfluxDB"""

    def __init__(self, project):
        super().__init__(name=project)

    def _action(self):
        project = self.get_project_or_not_found_error()
        if project:
            self._assert_user_in(project.owners.all())
            queryset = (
                    project.entities
                    .exclude(agent__isnull=True)
                    .order_by('agent__collector__address')
                    .distinct('agent__collector__address'))
            collectors = [entity.agent.collector for entity in queryset]
        else:
            collectors = Collector.objects.all()

        stats_names = defaultdict(set)
        for collector in collectors:
            connection = InfluxDBConnection(
                    collector.address,
                    collector.stats_query_port,
                    collector.stats_database_name,
                    collector.stats_database_precision)
            for job_name, fields in connection.get_field_keys().items():
                stats_names[job_name].update(fields)

        return {
                job_name: sorted(names)
                for job_name, names in stats_names.items()
        }, 200


class StatisticsAction(JobInstanceAction):
    """Base class that defines helper methods to deal
    with statistics of a JobInstance.
    """

    def _build_connection(self, *, raw=False):
        job_instance = self.get_job_instance_or_not_found_error()
        if job_instance.project is not None:
            self._assert_user_in(job_instance.project.owners.all())

        connection = (InfluxDBConnection if raw else Statistics)(
                job_instance.collector.address,
                job_instance.collector.stats_query_port,
                job_instance.collector.stats_database_name,
                job_instance.collector.stats_database_precision)
        return job_instance.job_name, connection

    def _retrieve_statistics_data(self, origin=None):
        job_name, connection = self._build_connection()
        connection.origin = origin
        return next(connection.fetch(
                fields=[self.name], job=job_name,
                job_instances=[self.instance_id],
                suffix=self.suffix))


class StatisticsOrigin(StatisticsAction):
    """Action that retrieve the first timestamp
    associated to a statistic in InfluxDB.
    """

    def __init__(self, instance_id):
        super().__init__(instance_id=instance_id)

    def _action(self):
        job_name, connection = self._build_connection(raw=True)
        origin = connection.origin(job=job_name, job_instance=self.instance_id)
        return origin, 200


class StatisticsNamesAndSuffixes(StatisticsAction):
    """Action that retrieve both the names of the fields
    and the available suffixes associated to a job
    instance in InfluxDB.
    """

    def __init__(self, instance_id):
        super().__init__(instance_id=instance_id)

    def _action(self):
        job_name, connection = self._build_connection(raw=True)
        names = connection.get_field_keys().get(job_name, [])
        suffixes = connection.suffixes(job=job_name, job_instance=self.instance_id)
        return {'statistics': sorted(names), 'suffixes': sorted(suffixes)}, 200


class StatisticsValues(StatisticsAction):
    """Action that retrieve values associated to a statistic in InfluxDB"""

    def __init__(self, instance_id, name, suffix=None, origin=None):
        super().__init__(
                instance_id=instance_id, name=name,
                suffix=suffix, origin=origin)

    def _action(self):
        try:
            statistics_data = self._retrieve_statistics_data(self.origin)
        except StopIteration:
            return [], 200

        time_series = statistics_data.time_series()
        statistics = {
                name[-1]: time_series[name].tolist()
                for name in time_series
        }
        statistics['time'] = time_series.index.tolist()
        return statistics, 200


class StatisticsHistogram(StatisticsAction):
    """Action that retrieve values associated to a statistic
    in InfluxDB and convert them to an histogram.
    """

    def __init__(self, instance_id, name, buckets, suffix=None, origin=None):
        super().__init__(
                instance_id=instance_id, name=name,
                buckets=buckets, suffix=suffix, origin=origin)

    def _action(self):
        try:
            statistics_data = self._retrieve_statistics_data(self.origin)
        except StopIteration:
            return [], 200

        statistics = statistics_data.histogram(self.buckets).iloc[:, 0]
        return {
                'counts': statistics.tolist(),
                'buckets': statistics.index.tolist(),
        }, 200


class StatisticsComparison(StatisticsAction):
    """Action that retrieve values associated to a statistic
    in InfluxDB and convert them to an histogram.
    """

    def __init__(self, instance_id, name, suffix=None, origin=None):
        super().__init__(
                instance_id=instance_id, name=name,
                suffix=suffix, origin=origin)

    def _action(self):
        try:
            statistics_data = self._retrieve_statistics_data(self.origin)
        except StopIteration:
            return [], 200

        statistics = statistics_data.comparison()
        mean = statistics.Ε.iloc[0]
        variance = statistics.δ.iloc[0]
        if numpy.isnan(mean) or numpy.isnan(variance):
            return None, 200

        return {'mean': mean, 'variance': variance}, 200


################
# Miscelaneous #
################

class PushFile(ConductorAction):
    """Action that send a file from the Controller to an Agent"""

    def __init__(self, local_path, remote_path, address, users=(), groups=(), removes=()):
        if not users:
            users = [None] * len(local_path)

        if not groups:
            groups = [None] * len(local_path)

        if not removes:
            removes = [False] * len(local_path)

        super().__init__(
                local_path=local_path, remote_path=remote_path,
                address=address, users=users, groups=groups, removes=removes)

    @require_connected_user()
    def _action(self):
        if not (len(self.local_path) == len(self.remote_path) == len(self.users) == len(self.groups) == len(self.removes)):
            raise errors.BadRequestError(
                    'amount mismatch between local paths ({}), '
                    'remote paths ({}), users ({}), groups ({}), or removes ({})'
                    .format(len(self.local_path), len(self.remote_path), len(self.users), len(self.groups), len(self.removes)))

        agent_infos = InfosAgent(self.address)
        self.share_user(agent_infos)
        agent_infos._check_user_can_use_agent()
        agent = agent_infos.get_agent_or_not_found_error()

        users = [user if user else 'openbach' for user in self.users]
        groups = [group if group else user for user, group in zip(users, self.groups)]
        removes = [True if remove=="True" else False for remove in self.removes]
        parameters = [
                {
                    'source': local_path,
                    'destination': os.path.join(
                        '/opt/openbach/agent/files/',
                        self.connected_user.username,
                        remote_path),
                    'user': user,
                    'group': group,
                    'remove': remove
                }
                for local_path, remote_path, user, group, remove
                in zip(self.local_path, self.remote_path, users, groups, removes)
        ]
        start_playbook('push_file', agent.address, parameters)

        return None, 204

class PullFile(ConductorAction):
    """Action that send a file from an Agent to the Controller"""

    def __init__(self, local_path, remote_path, address, users=(), groups=(), removes=()):
        if not users:
            users = [None] * len(local_path)

        if not groups:
            groups = [None] * len(local_path)

        if not removes:
            removes = [False] * len(local_path)

        super().__init__(
                local_path=local_path, remote_path=remote_path,
                address=address, users=users, groups=groups, removes=removes)

    @require_connected_user()
    def _action(self):
        if not (len(self.local_path) == len(self.remote_path) == len(self.users) == len(self.groups) == len(self.removes)):
            raise errors.BadRequestError(
                    'amount mismatch between local paths ({}), '
                    'remote paths ({}), users ({}), groups ({}), or removes ({})'
                    .format(len(self.local_path), len(self.remote_path), len(self.users), len(self.groups), len(self.removes)))

        agent_infos = InfosAgent(self.address)
        self.share_user(agent_infos)
        agent_infos._check_user_can_use_agent()
        agent = agent_infos.get_agent_or_not_found_error()

        users = [user if user else 'openbach' for user in self.users]
        groups = [group if group else user for user, group in zip(users, self.groups)]
        removes = [True if remove=="True" else False for remove in self.removes]
        parameters = [
                {
                    'source': remote_path,
                    'destination': local_path,
                    'user': user,
                    'group': group,
                    'remove': remove
                }
                for local_path, remote_path, user, group, remove
                in zip(self.local_path, self.remote_path, users, groups, removes)
        ]
        start_playbook('pull_file', agent.address, parameters)

        return None, 204


class KillAll(ConductorAction):
    """Action that kills all instances: Scenarios and Jobs"""

    def __init__(self, date=None):
        super().__init__(date=date)

    @require_connected_user(admin=True)
    def _action(self):
        for scenario in ScenarioInstance.objects.filter(stop_date__isnull=True):
            stop_scenario = StopScenarioInstance(scenario.id)
            self.share_user(stop_scenario)
            stop_scenario.action()

        for job in JobInstance.objects.filter(stop_date__isnull=True):
            stop_job = StopJobInstance(job.id)
            self.share_user(stop_job)
            stop_job.action()

        return None, 204


class OrphanedLogs(ConductorAction):
    """Action that retrieve orphaned logs from all collectors"""

    def __init__(self, level=7, delay=None, credentials=None):
        super().__init__(level=level, delay=delay, credentials=credentials)

    def _action(self):
        return list(self._retrieve_orphans()), 200

    def _retrieve_orphans(self):
        severity = self.level
        credentials = self.credentials
        if self.delay is None:
            timestamps = None
        else:
            now = int(datetime.now().timestamp() * 1000)
            timestamps = (now - self.delay, now)

        for collector in Collector.objects.all():
            connection = ElasticSearchConnection(collector.address, collector.logs_query_port, credentials)
            try:
                logs = connection.orphans(timestamps=timestamps)
            except Timeout:
                syslog.syslog(
                        syslog.LOG_WARNING,
                        'Cannot retrieve logs from collector at '
                        '{}: Timeout'.format(collector.address))
            else:
                for log in logs.numbered_data.values():
                    if log.severity <= severity:
                        yield log._id, log._timestamp, log.severity_label, log.logsource, log.message


class DatabasesInfos(CollectorAction):
    """Action that retreive some influxdb and elasticsearch infos"""

    def __init__(self, address, influxdb=False, elasticsearch=False, credentials=None):
        super().__init__(
                address=address, influxdb=influxdb,
                elasticsearch=elasticsearch, credentials=credentials)

    def _action(self):
        collector = self.get_collector_or_not_found_error()
        infos = {}

        if self.influxdb:
            connection = InfluxDBConnection(
                collector.address,
                collector.stats_query_port,
                collector.stats_database_name,
                collector.stats_database_precision)
            try:
                infos['influxdb'] = {
                        'measurements': connection.sql_query('SHOW MEASUREMENTS'),
                        'retention_policies': list(parse_influx(connection.sql_query('SHOW RETENTION POLICIES'))),
                }
            except Timeout:
                syslog.syslog(
                        syslog.LOG_WARNING,
                        'Cannot retrieve InfluxDB informations from collector '
                        'at {}: Timeout'.format(collector.address))

        if self.elasticsearch:
            connection = ElasticSearchConnection(collector.address, collector.logs_query_port, self.credentials)
            try:
                infos['elasticsearch'] = {
                        'settings': connection.settings_query(),
                }
            except Timeout:
                syslog.syslog(
                        syslog.LOG_WARNING,
                        'Cannot retrieve ElasticSearch informations from collector '
                        'at {}: Timeout'.format(collector.address))

        return infos, 200


class DeleteDatabases(CollectorAction):
    """Action that clear influxdb and/or elasticsearch databases"""

    def __init__(self, address, influxdb=False, elasticsearch=False, credentials=None):
        super().__init__(
                address=address, influxdb=influxdb,
                elasticsearch=elasticsearch, credentials=credentials)

    def _action(self):
        collector = self.get_collector_or_not_found_error()
        deleted = {'influxdb': False, 'elasticsearch': False}

        if self.influxdb:
            try:
                start_playbook(
                        'manage_retention_policies', self.address, 
                        openbach_influx_database=collector.stats_database_name, 
                        influxdb_port=collector.stats_query_port)
            except errors.ConductorError as err:
                error = err.json()
                syslog.syslog(
                        syslog.LOG_ERR,
                        'Removing data from InfluxDB database failed: {}'.format(error))
                deleted.setdefault('errors', {}).update(influxdb=error)
            else:
                deleted['influxdb'] = True

        if self.elasticsearch:
            connection = ElasticSearchConnection(collector.address, collector.logs_query_port, self.credentials)
            try:
                connection.remove_logs()
            except Timeout:
                syslog.syslog(
                        syslog.LOG_ERR,
                        'Removing data from ElasticSearch database failed: Timeout')
                deleted.setdefault('errors', {}).update(elasticsearch='Timeout')
            else:
                deleted['elasticsearch'] = True

        return deleted, 200


class Reboot(ConductorAction):
    """Reboot on a different kernel"""

    def __init__(self, address, kernel=None):
        super().__init__(kernel=kernel, address=address)

    def _action(self):
        agent_infos = InfosAgent(self.address)
        agent = agent_infos.get_agent_or_not_found_error()
        start_playbook('reboot', agent.address, self.kernel)

        return None, 204
