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


from django.urls import path

from . import views

app_name = 'openbach_django'
urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login_view'),
    path('login/users/', views.UsersView.as_view(), name='users_view'),
    path('logs/', views.LogsView.as_view(), name='logs_view'),
    path('version/', views.VersionView.as_view(), name='version_view'),

    path('statistic/<int:job_instance_id>/',
        views.StatisticView.as_view(),
        name='job_statistics'),
    path('statistics/<str:project>/',
        views.StatisticsView.as_view(),
        name='project_statistics'),

    path('collector/<str:address>/state/',
        views.StateView.as_view(state_type='collector'),
        name='state_collector'),
    path('agent/<str:address>/state/',
        views.StateView.as_view(state_type='agent'),
        name='state_agent'),
    path('job/<str:name>/state/',
        views.StateView.as_view(state_type='job'), name='state_job'),
    path('file/state/', views.StateView.as_view(state_type='file'),
        name='state_file'),
    path('job_instance/<int:id>/state/',
        views.StateView.as_view(state_type='job_instance'),
        name='state_job_instance'),

    path('collector/', views.CollectorsView.as_view(),
        name='collectors_view'),
    path('collector/<str:address>/', views.CollectorView.as_view(),
        name='collector_view'),

    path('agent/', views.AgentsView.as_view(), name='agents_view'),
    path('agent/<str:address>/', views.AgentView.as_view(),
        name='agent_view'),

    path('job/', views.JobsView.as_view(), name='jobs_view'),
    path('job/<str:name>/', views.JobView.as_view(), name='job_view'),

    path('job_instance/', views.JobInstancesView.as_view(),
        name='job_instances_view'),
    path('job_instance/<int:id>/', views.JobInstanceView.as_view(),
        name='job_instance_view'),

    path('file/', views.PushFile.as_view(), name='push_file'),

    path('reboot/', views.Reboot.as_view(), name='reboot'),

    path('scenario_instance/<int:id>/',
        views.ScenarioInstanceView.as_view(), name='scenario_instance_view'),
    path('scenario_instance/<int:id>/csv/', views.download_csv, name='download_csv'),
    path('scenario_instance/<int:id>/archive/', views.download_archive, name='download_archive'),

    path('project/', views.ProjectsView.as_view(), name='projects_view'),
    path('project/<str:project_name>/',
        views.ProjectView.as_view(), name='project_view'),
    path('project/<str:project_name>/scenario/',
        views.ScenariosView.as_view(), name='project_scenarios_view'),
    path('project/<str:project_name>/scenario/<str:scenario_name>/',
        views.ScenarioView.as_view(), name='project_scenario_view'),
    path('project/<str:project_name>/scenario_instance/',
        views.ScenarioInstancesView.as_view(),
        name='project_scenario_instance_view'),
    path('project/<str:project_name>/scenario/<str:scenario_name>/scenario_instance/',
        views.ScenarioInstancesView.as_view(),
        name='project_scenario_instance_view_filtered'),
    path('project/<str:project_name>/entity/',
        views.EntitiesView.as_view(), name='entities_view'),
    path('project/<str:project_name>/entity/<str:entity_name>/',
        views.EntityView.as_view(), name='entity_view'),

    path('databases/', views.DatabasesView.as_view(), name='database_view'),
]
