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

from django.dispatch import receiver
from django.db.models.signals import pre_delete, post_init, post_save
from django.contrib.auth.models import User

from .models import StartJobInstanceArgument, Job


@receiver(pre_delete, sender=User)
def assign_private_project_to_superuser(sender, instance, **kwargs):
    super_users = User.objects.filter(is_superuser=True).exclude(id=instance.id)
    if not super_users:
        return

    for project in instance.private_projects.all():
        if project.owners.count() == 1:
            project.owners.add(*super_users)


@receiver(post_save, sender=Job)
def ensure_default_subcommand_exist_on_jobs(sender, instance, **kwargs):
    instance.subcommands.get_or_create(group=None)
