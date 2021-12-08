# OpenBACH is a generic testbed able to control/configure multiple
# network/physical entities (under test) and collect data from them. It is
# composed of an Auditorium (HMIs), a Controller, a Collector and multiple
# Agents (one for each network entity that wants to be tested).
#
#
# Copyright © 2016-2020 CNES
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


from distutils.version import LooseVersion
from ansible import __version__ as ansible_version

if LooseVersion(ansible_version) < LooseVersion('2.9'):
    from ansible.plugins.action.synchronize import ActionModule as SynchronizeModule
else:
    from ansible_collections.ansible.posix.plugins.action.synchronize import ActionModule as SynchronizeModule


class ActionModule(SynchronizeModule):
    def _get_absolute_path(self, path):
        if not path.startswith('rsync://'):
            original_path = path

            path = self._find_needle('files', path)

            if original_path and original_path[-1] == '/' and path[-1] != '/':
                # For rsync consistent behaviour, make sure the path ends
                # in a trailing "/" if the original path did
                path += '/'

        return path
