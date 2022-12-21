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


"""Configuration of Django's admin interface"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Adrien THIBAUD <adrien.thibaud@toulouse.viveris.com>
 * Mathias ETTINGER <mathias.ettinger@toulouse.viveris.com>
'''


from django.contrib import admin

from .models import *


class AdminInstances(admin.ModelAdmin):
    list_display = ('__str__', 'is_stopped')


class AdminAgent(admin.ModelAdmin):
    exclude = ('password',)


admin.site.register(Collector)
admin.site.register(Agent, AdminAgent)
admin.site.register(Keyword)
admin.site.register(Job)
admin.site.register(Statistic)
admin.site.register(RequiredJobArgument)
admin.site.register(OptionalJobArgument)
admin.site.register(InstalledJob)
admin.site.register(StatisticInstance)
admin.site.register(JobInstance, AdminInstances)
admin.site.register(RequiredJobArgumentValue)
admin.site.register(OptionalJobArgumentValue)
admin.site.register(Scenario)
admin.site.register(ScenarioVersion)
admin.site.register(ScenarioArgument)
admin.site.register(ScenarioInstance, AdminInstances)
admin.site.register(ScenarioArgumentValue)
admin.site.register(OperandDatabase)
admin.site.register(OperandValue)
admin.site.register(OperandStatistic)
admin.site.register(ConditionOr)
admin.site.register(ConditionAnd)
admin.site.register(ConditionNot)
admin.site.register(ConditionXor)
admin.site.register(ConditionEqual)
admin.site.register(ConditionUnequal)
admin.site.register(ConditionLowerOrEqual)
admin.site.register(ConditionLower)
admin.site.register(ConditionGreaterOrEqual)
admin.site.register(ConditionGreater)
admin.site.register(OpenbachFunction)
admin.site.register(OpenbachFunctionInstance)
admin.site.register(WaitForLaunched)
admin.site.register(WaitForFinished)
admin.site.register(CommandResult)
admin.site.register(AgentCommandResult)
admin.site.register(CollectorCommandResult)
admin.site.register(FileCommandResult)
admin.site.register(InstalledJobCommandResult)
admin.site.register(JobInstanceCommandResult)
admin.site.register(Project)
admin.site.register(Network)
admin.site.register(HiddenNetwork)
admin.site.register(PotentialNetwork)
admin.site.register(Entity)
