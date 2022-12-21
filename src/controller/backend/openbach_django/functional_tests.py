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

import json
import time

from django.db import transaction
from django.test import TransactionTestCase, Client
from django.core.urlresolvers import reverse
from django.contrib.auth.models import User

from .tests import ProjectCheckerMixin
from .models import Collector, Agent


class ConductorTestCase(ProjectCheckerMixin, TransactionTestCase):
    URLS = 'openbach_django.urls'

    def setUp(self):
        User.objects.create_superuser('openbach', 'openbach@openbach.org', 'openbach')

        collector = Collector.objects.create(address='localhost')
        Agent.objects.create(
                address='localhost', name='Controller',
                reachable=True, collector=collector)

        self.project_json = {
            'description': 'Toy project to unit test a freshly '
                           'installed OpenBACH platform',
            'entity': [{
                'agent': {
                    'address': 'localhost',
                    'available': True,
                    'collector_ip': 'localhost',
                    'name': 'Controller',
                    'project': 'Unit Tests',
                    'reachable': True,
                    'status': 'Available',
                },
                'description': 'The agent of the controller used for the sole '
                               'reason that we are guaranteed it exists.',
                'name': 'Tester',
                'networks': [],
            }],
            'hidden_network': [],
            'name': 'Unit Tests',
            'network': [],
            'owners': [],
            'scenario': [
                {
                    'arguments': {'destination': 'The address to ping'},
                    'constants': {},
                    'description': 'Ping a given destination and never stop',
                    'name': 'Endless Ping',
                    'openbach_functions': [{
                        'id': 140844390,
                        'label': '',
                        'start_job_instance': {
                            'entity_name': 'Tester',
                            'fping': {'destination_ip': '$destination'},
                            'offset': 0,
                        },
                    }],
                }, {
                    'arguments': {},
                    'constants': {'destination': 'localhost'},
                    'description': 'Launch jobs and scenarios to test a platform',
                    'name': 'Unit test',
                    'openbach_functions': [
                        {
                            'id': 73447349,
                            'label': '#1',
                            'start_job_instance': {
                                'entity_name': 'Tester',
                                'fping': {'destination_ip': '$destination'},
                                'offset': 0,
                            },
                        }, {
                            'id': 156436599,
                            'label': '',
                            'stop_job_instances': {'openbach_function_ids': [73447349]},
                            'wait': {'launched_ids': [73447349, 119880370], 'time': 30},
                        }, {
                            'id': 119880370,
                            'label': '#2',
                            'start_job_instance': {
                                'entity_name': 'Tester',
                                'fping': {'destination_ip': '$destination'},
                                'offset': 0,
                            },
                        }, {
                            'id': 57781058,
                            'label': '',
                            'stop_job_instances': {'openbach_function_ids': [119880370]},
                            'wait': {'launched_ids': [119880370, 73447349], 'time': 60},
                        }, {
                            'id': 5416389,
                            'label': '#3',
                            'start_job_instance': {
                                'entity_name': 'Tester',
                                'fping': {'count': '30', 'destination_ip': '$destination'},
                                'offset': 0,
                            },
                            'wait': {'finished_ids': [73447349, 119880370]},
                        }, {
                            'id': 195152582,
                            'label': '#4',
                            'start_job_instance': {
                                'entity_name': 'Tester',
                                'fping': {'count': '15', 'destination_ip': '$destination'},
                                'offset': 0,
                            },
                            'wait': {'finished_ids': [5416389]},
                        }, {
                            'id': 122308813,
                            'label': '#5',
                            'start_scenario_instance': {
                                'arguments': {'destination': '$destination'},
                                'scenario_name': 'Endless Ping',
                            },
                            'wait': {'finished_ids': [195152582]},
                        }, {
                            'id': 63047349,
                            'label': '',
                            'stop_scenario_instance': {'openbach_function_id': 122308813},
                            'wait': {'launched_ids': [122308813], 'time': 30},
                        },
                    ],
                },
            ],
        }

    def test_scenario_instance(self):
        # Make database visible to OpenBACH conductor
        transaction.commit()
        agent = Agent.objects.last()
        project = self.project_json['name']
        scenario = self.project_json['scenario'][1]['name']

        # Open session and connect our test user
        client = Client()
        success = client.login(username='openbach', password='openbach')
        self.assertTrue(success)

        # Install the fping job as the scenario need it
        response = client.post(
                reverse('jobs_view', urlconf=self.URLS),
                json.dumps({
                    'name': 'fping',
                    'path': '/opt/openbach/controller/src/jobs/core_jobs/metrology/fping/',
                }),
                content_type='application/json')
        self.assertEqual(response.status_code, 200)

        response = client.post(
                reverse('jobs_view', urlconf=self.URLS),
                json.dumps({
                    'action': 'install',
                    'names': ['fping'],
                    'addresses': [agent.address],
                }),
                content_type='application/json')
        self.assertEqual(response.status_code, 202)

        # Wait until the end of the installation of fping
        while True:
            time.sleep(1)

            response = client.get(
                    reverse('state_job', urlconf=self.URLS, args=('fping',)),
                    {'address': agent.address})
            self.assertEqual(response.status_code, 200)
            install_infos = response.json()['install']
            self.assertIsNotNone(install_infos)

            return_code = install_infos['returncode']
            if return_code in (200, 204):
                break
            self.assertEqual(return_code, 202)

        # Load project
        response = client.post(
                reverse('projects_view', urlconf=self.URLS),
                json.dumps(self.project_json),
                content_type='application/json')
        self.assertEqual(response.status_code, 200)

        # Associate the project's entity with our agent
        entity = self.project_json['entity'][0]
        entity_json = {
            'agent': agent.json,
            'description': entity['description'],
            'name': entity['name'],
            'networks': [],
        }
        url = reverse(
                'entity_view',
                urlconf=self.URLS,
                args=(project, entity['name']))
        response = client.put(
                url,
                json.dumps(entity_json),
                content_type='application/json')
        self.assertEqual(response.status_code, 200)

        # Check scenario exists
        url = reverse(
            'project_scenario_view',
            urlconf=self.URLS,
            args=(project, scenario))
        response = client.get(url)
        self.assertEqual(response.status_code, 200)

        # Run the project's scenario
        url = reverse(
            'project_scenario_instance_view_filtered',
            urlconf=self.URLS,
            args=(project, scenario))
        response = client.post(url, '{}', content_type='application/json')
        self.assertEqual(response.status_code, 200)

        scenario_id = response.json().get('scenario_instance_id')
        self.assertIsNotNone(scenario_id)

        # Wait for the scenario to end
        while True:
            time.sleep(2)

            response = client.get(reverse(
                'scenario_instance_view',
                urlconf=self.URLS,
                args=(scenario_id,)))
            self.assertEqual(response.status_code, 200)

            response = response.json()
            status = response.get('status')
            if status == 'Finished OK':
                # Retrieve the start_scenario_instance function
                for openbach_function in response['openbach_functions']:
                    if 'start_scenario_instance' in openbach_function:
                        status = openbach_function['scenario']['status']
                        self.assertEqual(status, 'Stopped')
                        break
                else:
                    self.fail('Openbach function start_scenario_instance not found')
                break
            self.assertIn(status, ['Running', 'Scheduled'])

        # Check project is still the same
        response = client.get(reverse(
            'project_view',
            urlconf=self.URLS,
            args=(project,)))
        self.assertEqual(response.status_code, 200)
        self.assertProjectCompliant(self.project_json, response.json())
