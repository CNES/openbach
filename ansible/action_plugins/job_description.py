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

from __future__ import (absolute_import, division, print_function)
__metaclass__ = type

import os.path
import tempfile
import traceback

from ansible.config.manager import ensure_type
from ansible.module_utils._text import to_text, to_bytes
from ansible.errors import AnsibleError, AnsibleFileNotFound, AnsibleAction, AnsibleActionFail
from ansible.module_utils.parsing.convert_bool import boolean
from ansible.module_utils.six import string_types
from ansible.plugins.action import ActionBase
from ansible.plugins.filter.core import from_yaml, to_yaml


class ActionModule(ActionBase):
    def run(self, tmp=None, task_vars=None):
        if task_vars is None:
            task_vars = dict()

        result = super(ActionModule, self).run(tmp, task_vars)
        del tmp

        if 'src' not in self._task.args:
            raise AnsibleActionFail("src is required")

        for s_type in ('src', 'dest', 'os_family', 'os_distribution', 'os_distribution_version'):
            if s_type in self._task.args:
                value = ensure_type(self._task.args[s_type], 'string')
                if value is not None and not isinstance(value, string_types):
                    raise AnsibleActionFail("%s is expected to be a string, but got %s instead" % (s_type, type(value)))
                self._task.args[s_type] = value

        source = self._task.args.get('src', None)
        dest = self._task.args.get('dest', None)
        output_encoding = self._task.args.get('output_encoding', 'utf-8') or 'utf-8'
        os_family = self._task.args.get('os_family', None)
        os_distribution = self._task.args.get('os_distribution', None)
        os_distribution_version = self._task.args.get('os_distribution_version', None)

        try:
            if source is None or dest is None:
                raise AnsibleActionFail("src and dest are required")
            if os_family is None or os_distribution is None or os_distribution_version is None:
                raise AnsibleActionFail("missing mandatory OS description: os_family, os_distribution, or os_distribution_version")

            try:
                source = self._find_needle('files', source)
            except AnsibleError as e:
                raise AnsibleActionFail(to_text(e))

            try:
                source_full = self._loader.get_real_file(source)
            except AnsibleFileNotFound as e:
                raise AnsibleActionFail("could not find src=%s, %s" % (source, to_text(e)))

            with open(source_full, encoding='utf-8') as stream:
                content = from_yaml(stream.read())

            for config in content.pop('platform_configuration', []):
                if (config['ansible_system'] == os_family
                    and config['ansible_distribution'] == os_distribution
                    and config['ansible_distribution_version'] == os_distribution_version):
                    break
            else:
                raise AnsibleActionFail("No suitable platform found in provided src")

            content.setdefault('general', {})['command'] = config['command']
            content['general']['command_stop'] = config['command_stop']
            transformed = to_yaml(content, default_flow_style=False, explicit_start=True)

            new_task = self._task.copy()
            for remove in ('os_family', 'os_distribution', 'os_distribution_version', 'output_encoding'):
                new_task.args.pop(remove, None)

            with tempfile.TemporaryDirectory() as local_tempdir:
                result_file = os.path.join(local_tempdir, os.path.basename(source))
                with open(to_bytes(result_file, errors='surrogate_or_strict'), 'wb') as f:
                    f.write(to_bytes(transformed, encoding=output_encoding, errors='surrogate_or_strict'))

                new_task.args.update(dict(src=result_file, dest=dest))
                copy_action = self._shared_loader_obj.action_loader.get('copy',
                                                                        task=new_task,
                                                                        connection=self._connection,
                                                                        play_context=self._play_context,
                                                                        loader=self._loader,
                                                                        templar=self._templar,
                                                                        shared_loader_obj=self._shared_loader_obj)
                result.update(copy_action.run(task_vars=task_vars))
        except AnsibleAction as e:
            result.update(e.result)
        finally:
            self._remove_tmp_path(self._connection._shell.tmpdir)

        return result
