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

from django.test import TestCase
from django.utils import timezone

from .models import (
        Collector, Agent, Project, Job,
        InstalledJob, RequiredJobArgument,
        OptionalJobArgument, JobInstance,
)
from .base_models import ValuesType, OpenbachFunctionParameter


class ProjectCheckerMixin:
    def assertProjectCompliant(self, expected, actual):
        self.assertEqual(expected['name'], actual['name'])
        self.assertEqual(expected.get('description', ''), actual['description'])
        self.assertCountEqual(expected.get('owners', []), actual['owners'])

        for entity in expected.get('entity', []):
            for actual_entity in actual['entity']:
                if entity['name'] == actual_entity['name']:
                    self.assertEqual(entity['description'], actual_entity['description'])
                    break
            else:
                self.fail('Found unknown entity in actual project: {}'.format(entity))

        for scenario in expected.get('scenario', []):
            for actual_scenario in actual['scenario']:
                if scenario['name'] == actual_scenario['name']:
                    self.assertScenarioCompliant(scenario, actual_scenario)
                    break
            else:
                self.fail('Found unknown scenario in actual project: {}'.format(scenario))

    def assertScenarioCompliant(self, expected, actual):
        self.assertDictEqual(expected.get('arguments', {}), actual['arguments'])
        self.assertDictEqual(expected.get('constants', {}), actual['constants'])
        self.assertEqual(expected.get('description', ''), actual['description'])
        self.assertEqual(expected['name'], actual['name'])

        expected_openbach_functions = expected.get('openbach_functions', [])
        actual_openbach_functions = actual['openbach_functions']
        self.assertEqual(len(expected_openbach_functions), len(actual_openbach_functions))

        for expected, actual in zip(expected_openbach_functions, actual_openbach_functions):
            expected = expected.copy()
            expected_id = expected.pop('id')
            self.assertEqual(expected_id, actual['id'])
            self.assertEqual(expected.pop('label', str(expected_id)), actual['label'])

            expected_wait = expected.pop('wait', {})
            actual_wait = actual.get('wait', {})
            self.assertEqual(
                    expected_wait.get('time', 0),
                    actual_wait.get('time', 0))
            self.assertCountEqual(
                    expected_wait.get('launched_ids', []),
                    actual_wait.get('launched_ids', []))
            self.assertCountEqual(
                    expected_wait.get('finished_ids', []),
                    actual_wait.get('finished_ids', []))

            openbach_function, = expected
            expected_function = expected[openbach_function]
            actual_function = expected[openbach_function]
            self.assertCountEqual(expected_function, actual_function)


class OpenbachFunctionArgumentTestCase(TestCase):
    def _check_conversions(self, field, argument, value, serialized):
        self.assertEqual(field.to_python(argument), value)
        self.assertEqual(field.get_prep_value(argument), serialized)

    def _check_interpolation(self, field, argument, expected, **parameters):
        actual = field.validate_openbach_value(argument, parameters)
        self.assertEqual(actual, expected)

    def _prepare_fields(self, *types, **named_types):
        for type_ in types:
            yield OpenbachFunctionParameter(type=type_)

        for name, expected in named_types.items():
            field = OpenbachFunctionParameter.from_type(name)
            self.assertEqual(field.type, expected)
            yield field

    def test_arguments_int(self):
        expected = {ValuesType.INTEGER.value: int}
        for field in self._prepare_fields(int, **expected):
            self._check_conversions(field, 3, 3, '3')
            self._check_conversions(field, '3', 3, '3')
            self._check_conversions(field, 3.0, 3, '3')
            self._check_interpolation(field, '$test', 3, test=3)
            self._check_interpolation(field, '$test', 3, test='3')

    def test_arguments_int_list(self):
        expected = {
                ValuesType.JOB_INSTANCE_ID.value: [int],
                ValuesType.SCENARIO_INSTANCE_ID.value: [int],
        }
        for field in self._prepare_fields([int], **expected):
            self._check_conversions(field, [1, 2, 3], [1, 2, 3], '1 2 3')
            self._check_conversions(field, '1 2 3', [1, 2, 3], '1 2 3')
            self._check_conversions(field, '12 3', [12, 3], '12 3')
            self._check_conversions(field, '123', [123], '123')
            self._check_conversions(field, 123, [123], '123')
            self._check_interpolation(field, '1 $test 3', [1, 2, 3], test=2)
            self._check_interpolation(field, '1 $test 3', [1, 2, 3], test='2')
            self._check_interpolation(field, ['1', '$test', 3], [1, 2, 3], test=2)

    def test_arguments_none(self):
        expected = {ValuesType.NONE_TYPE.value: type(None)}
        for field in self._prepare_fields(type(None), **expected):
            self._check_conversions(field, None, None, None)
            self._check_conversions(field, '', True, 'True')
            self._check_conversions(field, 'None', True, 'True')
            self._check_conversions(field, 'True', True, 'True')
            self._check_conversions(field, True, True, 'True')
            self._check_conversions(field, False, True, 'True')
            self._check_conversions(field, 'False', True, 'True')
            self._check_interpolation(field, '$test', True, test=3)


class JobTestCase(TestCase):
    def setUp(self):
        Job.objects.create(name='test_job')

    def test_arguments_create(self):
        job = Job.objects.get(name='test_job')
        arg = RequiredJobArgument.objects.create(
                name='first', type='int',
                subcommand=job.subcommands.get(name=None),
                count='1', rank=0)
        self.assertTrue(arg.check_count(1))
        self.assertFalse(arg.check_count(0))
        for i in range(2, 10):
            self.assertFalse(arg.check_count(i))

        arg = RequiredJobArgument.objects.create(
                name='second', type='str',
                subcommand=job.subcommands.get(name=None),
                count='3-6', rank=1)
        for i in range(3, 7):
            self.assertTrue(arg.check_count(i))
        for i in range(3):
            self.assertFalse(arg.check_count(i))
        for i in range(7, 10):
            self.assertFalse(arg.check_count(i))

        RequiredJobArgument.objects.create(
                name='third', type='ip',
                subcommand=job.subcommands.get(name=None),
                count='+', rank=2)

        arg = OptionalJobArgument.objects.create(
                name='optional', type='bool',
                subcommand=job.subcommands.get(name=None),
                count='*', flag='-o')
        for i in range(10):
            self.assertTrue(arg.check_count(i))

        OptionalJobArgument.objects.create(
                name='flags', type='None',
                subcommand=job.subcommands.get(name=None),
                count='0', flag='-f')

        OptionalJobArgument.objects.create(
                name='star', type='int',
                subcommand=job.subcommands.get(name=None),
                count='*', flag='-s')

        default_subcommand = job.subcommands.get(name=None)
        self.assertEqual(default_subcommand.required_arguments.count(), 3)
        self.assertEqual(default_subcommand.optional_arguments.count(), 3)


class InstalledJobTestCase(TestCase):
    def setUp(self):
        Job.objects.create(name='test_job')
        collector = Collector.objects.create(address='172.20.34.45')
        Agent.objects.create(
                address='172.20.34.45', name='Openbach_Agent',
                reachable=True, collector=collector)

    def test_install_job(self):
        agent = Agent.objects.get(name='Openbach_Agent')
        job = Job.objects.get(name='test_job')
        installed_job = InstalledJob.objects.create(
                agent=agent, job=job,
                severity=1, local_severity=1)
        self.assertEqual(installed_job.job, job)
        self.assertEqual(installed_job.agent, agent)


class JobInstanceTestCase(TestCase):
    def setUp(self):
        job = Job.objects.create(name='test_job')
        collector = Collector.objects.create(address='172.20.34.45')
        agent = Agent.objects.create(
                address='172.20.34.45', name='Openbach_Agent',
                reachable=True, collector=collector)
        InstalledJob.objects.create(
                agent=agent, job=job,
                severity=1, local_severity=1)
        RequiredJobArgument.objects.create(
                name='first', type='int',
                subcommand=job.subcommands.get(name=None),
                count='1', rank=0)
        RequiredJobArgument.objects.create(
                name='second', type='str',
                subcommand=job.subcommands.get(name=None),
                count='3-6', rank=1)
        OptionalJobArgument.objects.create(
                name='optional', type='ip',
                subcommand=job.subcommands.get(name=None),
                count='*', flag='-o')
        OptionalJobArgument.objects.create(
                name='flags', type='None',
                subcommand=job.subcommands.get(name=None),
                count='0', flag='-f')
        OptionalJobArgument.objects.create(
                name='star', type='int',
                subcommand=job.subcommands.get(name=None),
                count='*', flag='-s')

    def test_job_instance(self):
        now = timezone.now()
        installed_job = InstalledJob.objects.all()[0]
        job_instance = JobInstance.objects.create(
                job_name=installed_job.job.name,
                agent_name=installed_job.agent.name,
                agent=installed_job.agent,
                collector=installed_job.agent.collector,
                update_status=now,
                start_date=now,
                periodic=False)

        job_instance.configure({
            'first': 42,
            'second': ['riri', 'fifi', 'loulou'],
            'optional': ['8.8.8.8', '127.0.0.1', '192.168.0.1'],
        })
        job_instance.save()


class ProjectTestCase(ProjectCheckerMixin, TestCase):
    def setUp(self):
        self.project_json = {
                "name": "OpenSAND",
                "description": "OpenSAND Plateform",
                "entity": [{
                    "name": "Sat",
                    "description": "The satellite",
                    "agent": {
                        "name": "openbach-controller",
                        "address": "172.20.34.39",
                        "username": "opensand",
                        "collector": "172.20.34.39",
                    },
                    "networks": ["emu"],
                }, {
                    "name": "gw",
                    "description": "Gateway",
                    "agent": None,
                    "networks": ["emu", "lan_gw"],
                }, {
                    "name": "st1",
                    "description": "Satellite terminal 1",
                    "agent": None,
                    "networks": ["emu", "lan_st"],
                }, {
                    "name": "st2",
                    "description": "Satellite terminal 2",
                    "agent": None,
                    "networks": ["emu"],
                }, {
                    "name": "ws1",
                    "description": "Workstation 1",
                    "agent": None,
                    "networks": ["lan_st"],
                }, {
                    "name": "ws2",
                    "description": "Workstation 2",
                    "agent": None,
                    "networks": ["lan_st"],
                }, {
                    "name": "ws3",
                    "description": "Workstation 3",
                    "agent": None,
                    "networks": ["lan_gw"],
                }, {
                    "name": "ws4",
                    "description": "Workstation 4",
                    "agent": None,
                    "networks": []
                }],
                "network": ["emu", "lan_gw", "lan_st"],
                "scenario": [{
                    "name": "Ping between machines",
                    "description": "First scenario (for test)",
                    "arguments": {},
                    "constants": {},
                    "openbach_functions": [{
                        "id": 1,
                        "start_job_instance": {
                            "entity_name": "Sat",
                            "fping": {
                                "destination_ip": "172.20.0.83",
                            },
                            "offset": 5,
                        },
                        "wait": {
                            "time": 5,
                        },
                    }, {
                        "id": 2,
                        "start_job_instance": {
                            "entity_name": "Sat",
                            "hping": {
                                "destination_ip": "172.20.0.83",
                            },
                            "offset": 5,
                        },
                        "wait": {
                            "time": 5,
                        },
                    }],
                }, {
                    "name": "Congestion tests",
                    "description": "2 Iperf servs queried by 2 iperf clients",
                    "arguments": {},
                    "constants": {},
                    "openbach_functions": [{
                        "id": 1,
                        "start_job_instance": {
                            "entity_name": "Sat",
                            "pep": {
                                "sat_network": "opensand",
                                "pep_port": 3000,
                            },
                            "offset": 0,
                        },
                    }, {
                        "id": 2,
                        "start_job_instance": {
                            "entity_name": "gw",
                            "iperf": {
                                "mode": "-s",
                                "udp": True,
                                "port": 5000,
                            },
                            "offset": 0,
                        },
                    }, {
                        "id": 3,
                        "start_job_instance": {
                            "entity_name": "gw",
                            "iperf": {
                                "mode": "-s",
                                "port": 5001,
                            },
                            "offset": 0,
                        },
                    }, {
                        "id": 4,
                        "start_job_instance": {
                            "entity_name": "gw",
                            "tcpprobe_monitoring": {
                                "port": 5001,
                                "interval": 10,
                                "path": "/tcp/tcpprobe.out",
                            },
                            "offset": 0,
                        },
                    }, {
                        "id": 5,
                        "start_job_instance": {
                            "entity_name": "gw",
                            "rate_monitoring": {
                                "interval": 1,
                                "chain": "-A INPUT",
                                "jump": "ACCEPT",
                                "in_interface": "eth0",
                                "protocol": "tcp",
                                "source_port": 5001,
                            },
                            "offset": 0,
                        },
                    }, {
                        "id": 6,
                        "start_job_instance": {
                            "entity_name": "ws1",
                            "iperf": {
                                "mode": "-c 192.168.0.7",
                                "udp": True,
                                "port": 5000,
                            },
                            "offset": 0,
                        },
                        "wait": {
                            "time": 5,
                            "launched_ids": [1, 2, 3, 4, 5],
                        },
                    }, {
                        "id": 7,
                        "start_job_instance": {
                            "entity_name": "ws1",
                            "iperf": {
                                "mode": "-c 192.168.0.7",
                                "port": 5001,
                            },
                            "offset": 0,
                        },
                        "wait": {
                            "time": 5,
                            "launched_ids": [1, 2, 3, 4, 5],
                        },
                    }, {
                        "id": 8,
                        "stop_job_instances": {
                            "openbach_function_ids": [5, 6],
                        },
                        "wait": {
                            "time": 500,
                            "launched_ids": [6, 7],
                        },
                    }, {
                        "id": 9,
                        "stop_job_instances": {
                            "openbach_function_ids": [1, 2, 3, 4, 5],
                        },
                        "wait": {
                            "launched_ids": [8],
                        },
                    }],
                }],
        }

    def _create_jobs(self):
        Job.objects.create(name='fping')
        Job.objects.create(name='hping')

    def _create_arguments(self):
        for job in Job.objects.filter(name__iendswith='ping'):
            RequiredJobArgument.objects.create(
                    rank=0, name='destination_ip',
                    subcommand=job.subcommands.get(name=None),
                    type='ip', count='1')

    def _create_scenario_prerequisites(self):
        # Scenario 1
        self._create_jobs()
        self._create_arguments()

        # Scenario 2
        pep = Job.objects.create(name='pep')
        iperf = Job.objects.create(name='iperf')
        tcp = Job.objects.create(name='tcpprobe_monitoring')
        rate = Job.objects.create(name='rate_monitoring')

        RequiredJobArgument.objects.create(
                subcommand=pep.subcommands.get(name=None),
                rank=0, name='sat_network',
                type='str', count='1')
        OptionalJobArgument.objects.create(
                subcommand=pep.subcommands.get(name=None),
                flag='-p', name='pep_port',
                type='int', count='1')

        OptionalJobArgument.objects.create(
                subcommand=iperf.subcommands.get(name=None),
                flag='-s', name='mode',
                type='None', count='0')
        OptionalJobArgument.objects.create(
                subcommand=iperf.subcommands.get(name=None),
                flag='-u', name='udp',
                type='None', count='0')
        OptionalJobArgument.objects.create(
                subcommand=iperf.subcommands.get(name=None),
                flag='-p', name='port',
                type='int', count='1')

        RequiredJobArgument.objects.create(
                subcommand=tcp.subcommands.get(name=None),
                rank=0, name='port',
                type='int', count='1')
        OptionalJobArgument.objects.create(
                subcommand=tcp.subcommands.get(name=None),
                flag='-i', name='interval',
                type='int', count='1')
        OptionalJobArgument.objects.create(
                subcommand=tcp.subcommands.get(name=None),
                flag='-p', name='path',
                type='str', count='1')

        RequiredJobArgument.objects.create(
                subcommand=rate.subcommands.get(name=None),
                rank=0, name='interval',
                type='int', count='1')
        RequiredJobArgument.objects.create(
                subcommand=rate.subcommands.get(name=None),
                rank=1, name='chain',
                type='str', count='1')
        OptionalJobArgument.objects.create(
                subcommand=rate.subcommands.get(name=None),
                flag='-j', name='jump',
                type='str', count='1')
        OptionalJobArgument.objects.create(
                subcommand=rate.subcommands.get(name=None),
                flag='-i', name='in_interface',
                type='str', count='1')
        OptionalJobArgument.objects.create(
                subcommand=rate.subcommands.get(name=None),
                flag='-p', name='protocol',
                type='str', count='1')
        OptionalJobArgument.objects.create(
                subcommand=rate.subcommands.get(name=None),
                flag='--sport', name='source_port',
                type='int', count='1')

    def _test_project_fails_and_get_context_manager(self):
        name = self.project_json['name']
        description = self.project_json['description']
        project = Project.objects.create(name=name, description=description)
        with self.assertRaises(Project.MalformedError) as cm:
            project.load_from_json(self.project_json)
        return cm

    def test_scenario_fail_with_no_job(self):
        cm = self._test_project_fails_and_get_context_manager()
        self.assertEqual(
                cm.exception.error['section'],
                'scenario.Ping between machines')
        self.assertEqual(
                cm.exception.error['message']['error'],
                'No such job in the database')
        self.assertEqual(
                cm.exception.error['message']['offending_entry'],
                'openbach_functions.0.start_job_instance.fping')

    def test_scenario_fail_with_no_job_argument(self):
        self._create_jobs()
        cm = self._test_project_fails_and_get_context_manager()
        self.assertEqual(
                cm.exception.error['section'],
                'scenario.Ping between machines')
        self.assertEqual(
                cm.exception.error['message']['error'],
                'The configured job does not accept the given argument')
        self.assertEqual(
                cm.exception.error['message']['offending_entry'],
                'openbach_functions.0.start_job_instance.fping.destination_ip')

    def test_scenario_succed_with_job_arguments_but_second_fail(self):
        self._create_jobs()
        self._create_arguments()
        cm = self._test_project_fails_and_get_context_manager()
        self.assertEqual(
                cm.exception.error['section'],
                'scenario.Congestion tests')
        self.assertEqual(
                cm.exception.error['message']['error'],
                'No such job in the database')
        self.assertEqual(
                cm.exception.error['message']['offending_entry'],
                'openbach_functions.0.start_job_instance.pep')

    def test_success(self):
        self._create_scenario_prerequisites()
        name = self.project_json['name']
        description = self.project_json['description']
        project = Project.objects.create(name=name, description=description)
        project.load_from_json(self.project_json)
        self.assertProjectCompliant(self.project_json, project.json)
