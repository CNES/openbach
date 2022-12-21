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


"""The URLs available for the user (through the frontend)"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Adrien THIBAUD <adrien.thibaud@toulouse.viveris.com>
 * Mathias ETTINGER <mathias.ettinger@toulouse.viveris.com>
'''


from django.conf.urls import url

from . import views

app_name = 'openbach_django'
urlpatterns = [
    url(r'^login/?$', views.LoginView.as_view(), name='login_view'),
    url(r'^login/users/?$', views.UsersView.as_view(), name='users_view'),
    url(r'^logs/?$', views.LogsView.as_view(), name='logs_view'),
    url(r'^version/?$', views.VersionView.as_view(), name='version_view'),

    url(r'^statistic/(?P<job_instance_id>\d+)/?$',
        views.StatisticView.as_view(),
        name='job_statistics'),
    url(r'^statistic/(?P<project>[^/]+)/?$',
        views.StatisticsView.as_view(),
        name='project_statistics'),

    url(r'^collector/(?P<address>[^/]+)/state/?$',
        views.StateView.as_view(state_type='collector'),
        name='state_collector'),
    url(r'^agent/(?P<address>[^/]+)/state/?$',
        views.StateView.as_view(state_type='agent'),
        name='state_agent'),
    url(r'^job/(?P<name>[^/]+)/state/?$',
        views.StateView.as_view(state_type='job'), name='state_job'),
    url(r'^file/state/?$', views.StateView.as_view(state_type='file'),
        name='state_file'),
    url(r'^job_instance/(?P<id>\d+)/state/?$',
        views.StateView.as_view(state_type='job_instance'),
        name='state_job_instance'),

    url(r'^collector/?$', views.CollectorsView.as_view(),
        name='collectors_view'),
    url(r'^collector/(?P<address>[^/]+)/?$', views.CollectorView.as_view(),
        name='collector_view'),

    url(r'^agent/?$', views.AgentsView.as_view(), name='agents_view'),
    url(r'^agent/(?P<address>[^/]+)/?$', views.AgentView.as_view(),
        name='agent_view'),

    url(r'^job/?$', views.JobsView.as_view(), name='jobs_view'),
    url(r'^job/(?P<name>[^/]+)/?$', views.JobView.as_view(), name='job_view'),

    url(r'^job_instance/?$', views.JobInstancesView.as_view(),
        name='job_instances_view'),
    url(r'^job_instance/(?P<id>\d+)/?$', views.JobInstanceView.as_view(),
        name='job_instance_view'),

    url(r'^file/?$', views.PushFile.as_view(), name='push_file'),

    url(r'^reboot/?$', views.Reboot.as_view(), name='reboot'),

    url(r'^scenario_instance/(?P<id>[^/]+)/?$',
        views.ScenarioInstanceView.as_view(), name='scenario_instance_view'),
    url(r'^scenario_instance/(?P<id>[^/]+)/csv/?$', views.download_csv, name='download_csv'),
    url(r'^scenario_instance/(?P<id>[^/]+)/archive/?$', views.download_archive, name='download_archive'),

    url(r'^project/?$', views.ProjectsView.as_view(),
        name='projects_view'),
    url(r'^project/(?P<project_name>[^/]+)/?$',
        views.ProjectView.as_view(), name='project_view'),
    url(r'^project/(?P<project_name>[^/]+)/scenario/?$',
        views.ScenariosView.as_view(), name='project_scenarios_view'),
    url(r'^project/(?P<project_name>[^/]+)/scenario/(?P<scenario_name>[^/]+)/?$',
        views.ScenarioView.as_view(), name='project_scenario_view'),
    url(r'^project/(?P<project_name>[^/]+)/scenario_instance/?$',
        views.ScenarioInstancesView.as_view(),
        name='project_scenario_instance_view'),
    url(r'^project/(?P<project_name>[^/]+)/scenario/'
        '(?P<scenario_name>[^/]+)/scenario_instance/?$',
        views.ScenarioInstancesView.as_view(),
        name='project_scenario_instance_view_filtered'),
    url(r'^project/(?P<project_name>[^/]+)/entity/?$',
        views.EntitiesView.as_view(), name='entities_view'),
    url(r'^project/(?P<project_name>[^/]+)/entity/(?P<entity_name>[^/]+)/?$',
        views.EntityView.as_view(), name='entity_view'),

    url(r'^databases/?$',
        views.DatabasesView.as_view(), name='database_view'),
]
