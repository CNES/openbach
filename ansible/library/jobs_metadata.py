#!/usr/bin/python

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


import os

from ansible.module_utils.basic import AnsibleModule
from ansible.parsing.yaml.objects import yaml


ANSIBLE_METADATA = {
    'metadata_version': '0.1',
    'status': ['preview'],
    'supported_by': 'openbach'
}


DOCUMENTATION = '''
---
module: jobs_metadata

short_description: This module fetches metadata of jobs in the given folders

version_added: "2.4"

description:
    - "This module gathers the names and paths of jobs found in the given folders. It works by recursively searching for .yml files in a files subfolder and checking that the matching install_xxx.yml and uninstall_xxx.yml exist in the parent folder."

options:
    folders:
        description:
            - A list of the folders to search jobs into
        required: true
    substitute:
        description:
            - A path to substitute the root folder name by
        required: false
    limit:
        description:
            - Limit the collected informations to the ones of the jobs in this list
        required: false

author:
    - Mathias Ettinger (mathias.ettinger@toulouse.viveris.fr)
'''


EXAMPLES = '''
# Pass in folders
- name: Test with folders
  jobs_metadata:
    folders:
      - ../src/jobs
      - /opt/jobs

# pass in folders and have a substitute
- name: Test with folders and substitute
  jobs_metadata:
    folders:
      - ../src/jobs
      - /opt/jobs
    substitute: /opt/openbach/controller/src/jobs/

# pass in folders and have a limitating list
- name: Test with folders and limit
  jobs_metadata:
    folders:
      - ../src/jobs
      - /opt/jobs
    limit:
      - fping
      - netcat
      - iperf

# use all the parameters at once
- name: Test with folders, limit, and have a substitute
  jobs_metadata:
    folders:
      - ../src/jobs
      - /opt/jobs
    limit:
      - fping
      - netcat
      - iperf
    substitute: /opt/openbach/controller/src/jobs/

# fail the module
- name: Test failure of the module
  jobs_metadata:
    substitute: /opt/openbach/controller/src/jobs/
'''


RETURN = '''
openbach_jobs:
    description: A list of mapping containing the names and paths of the found jobs.
'''


REQUIRED_KEYS = ('ansible_system', 'ansible_distribution', 'ansible_distribution_version')


def get_jobs_infos(folder):
    for root, folders, filenames in os.walk(folder):
        if os.path.basename(root) != 'files':
            continue

        for filename in filenames:
            name, ext = os.path.splitext(filename)
            if ext != '.yml':
                continue

            parent = os.path.dirname(root)
            install = os.path.join(parent, 'install_{}.yml'.format(name))
            uninstall = os.path.join(parent, 'uninstall_{}.yml'.format(name))
            if os.path.exists(install) and os.path.exists(uninstall):
                yield name, parent


def get_all_jobs_infos(folders, limit, substitute, include_platforms):
    for folder in folders:
        folder = os.path.expanduser(folder)
        for name, path in get_jobs_infos(folder):
            configuration_file = os.path.join(path, 'files', name) + '.yml'
            if substitute:
                path = os.path.join(substitute, path[len(folder):])
            if limit is None or name in limit:
                informations = {'name': name, 'path': path}

                if include_platforms:
                    with open(configuration_file, encoding='utf-8') as config:
                        conf = yaml.safe_load(config)
                    informations['platforms'] = [
                            {key: c[key] for key in REQUIRED_KEYS}
                            for c in conf.get('platform_configuration', [])
                    ]

                yield informations


def run_module():
    # define the available arguments/parameters that a user can pass to
    # the module
    module_args = dict(
        folders=dict(type='list', required=True),
        substitute=dict(type='str', required=False, default=None),
        limit=dict(type='list', required=False, default=None),
        platforms=dict(type='bool', required=False, default=False),
    )

    # seed the result dict in the object
    # we primarily care about changed and state
    # change is if this module effectively modified the target
    # state will include any data that you want your module to pass back
    # for consumption, for example, in a subsequent task
    result = dict(
        changed=False,
        openbach_jobs=[],
    )

    # the AnsibleModule object will be our abstraction working with Ansible
    # this includes instantiation, a couple of common attr would be the
    # args/params passed to the execution, as well as if the module
    # supports check mode
    module = AnsibleModule(
        argument_spec=module_args,
        supports_check_mode=True
    )

    # if the user is working with this module in only check mode we do not
    # want to make any changes to the environment, just return the current
    # state with no modifications
    if module.check_mode:
        return result

    # manipulate or modify the state as needed
    limit_to = module.params['limit']
    if limit_to is not None:
        limit_to = set(limit_to)

    jobs = get_all_jobs_infos(
            module.params['folders'],
            limit_to,
            module.params['substitute'],
            module.params['platforms'])
    result['openbach_jobs'] = list(jobs)

    module.exit_json(**result)


if __name__ == '__main__':
    run_module()
