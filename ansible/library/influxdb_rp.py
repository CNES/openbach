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


from ansible.module_utils.basic import AnsibleModule

ANSIBLE_METADATA = {
    'metadata_version': '0.1',
    'status': ['preview'],
    'supported_by': 'openbach'
}


DOCUMENTATION = '''
---
module: influxdb_rp

short_description: This module delete an influxdb retention policy to delete all measurement in the database

version_added: "2.10"

description:
    - "This module drop the retention policy on a certain database. Then by restarting Influxdb service all the measurements are deleted, we can recreate the rentention policy with the same name, duration and replication."

options:
    database_name:
        description:
            - The database name on which we want to drop the retention policy
        required: true
        type: str
    policy_name:
        description:
            - The retention policy name which we want to drop
        required: true
        type: str
    state:
        description:
            - If C(absent), retention policy will be removed
            - If C(show), DEFAULT retention policy will only be shown
        type: str
        choices: [ absent, show ]

author:
    - Léa Thibout (lea.thibout@viveris.fr)
    - Mathias Ettinger (mathias.ettinger@toulouse.viveris.fr)
'''


EXAMPLES = '''
# Remove policy testing
- name: Remove retention policy from 'projects' database
  influxdb_rp:
    database_name: "{{influxdb_database_name}}"
    policy_name: "testing"
    state: absent

# Show retention policy
- name: Retrieve DEFAULT retention policies on 'projects' database
  influxdb_rp:
    database_name: "{{influxdb_database_name}}"
    policy_name:
    state: show
  register: default_retention_policy

# fail the module
- name: Test failure of the module
  influxdb_rp:
    policy_name: "testing"
'''


RETURN = '''
default_policy:
    description: The default_policy requested by show
    returned: state=show
    type: str
    sample: default
deleted:
    description: Status of the deleted retention policy
    returned: state:absent
    type: str
    sample: ok
'''

from ansible_collections.community.general.plugins.module_utils.influxdb import InfluxDb

def delete_retention_policy(module, client):
    database_name = module.params['database_name']
    policy_name = module.params['policy_name']

    try:
        deleted = client.drop_retention_policy(policy_name, database_name)
    except exceptions.InfluxDBClientError as e:
        module.fail_json(msg=econtent)

    return {'deleted': policy_name}

def retrieve_default_policy(module, client):
    database_name = module.params['database_name']

    try:
        rps = client.get_list_retention_policies(database_name)
        default_policy = [rp for rp in rps if rp['default']]
    except exceptions.InfluxDBClientError as e:
        module.fail_json(msg=e.content)

    if len(default_policy)==0:
        module.fail_json(msg="No default policy")

    return default_policy[0]


def run_module():
    # define the available arguments/parameters that a user can pass to
    # the module
    argument_spec = InfluxDb.influxdb_argument_spec()
    argument_spec.update(
        database_name=dict(type='str', required=True),
        policy_name=dict(type='str', required=True),
        state=dict(type='str', choices=['absent', 'show']),
    )

    # seed the result dict in the object
    # we primarily care about changed and state
    # change is if this module effectively modified the target
    # state will include any data that you want your module to pass back
    # for consumption, for example, in a subsequent task
    result = dict(
        changed=False,
    )

    # the AnsibleModule object will be our abstraction working with Ansible
    # this includes instantiation, a couple of common attr would be the
    # args/params passed to the execution, as well as if the module
    # supports check mode
    module = AnsibleModule(
        argument_spec=argument_spec,
        supports_check_mode=True
    )

    # if the user is working with this module in only check mode we do not
    # want to make any changes to the environment, just return the current
    # state with no modifications

    # manipulate or modify the state as needed
    params = module.params
    state = params['state']

    influxdb = InfluxDb(module)
    client = influxdb.connect_to_influxdb()

    if state == 'absent':
        result = delete_retention_policy(module, client)
    elif state == 'show':
        result = retrieve_default_policy(module, client)

    module.exit_json(**result)


if __name__ == '__main__':
    run_module()
