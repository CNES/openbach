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

import os
from contextlib import suppress
from collections import namedtuple

import yaml
import requests

from . import errors


ProjectInfos = namedtuple('ProjectInfos', ['id', 'jobs_path', 'dest_dir'])


REF_NAME = 'dev'
API_TOKEN = ''
BASE_URL_TEMPLATE = 'https://api.github.com/repos/CNES/{}/contents/{}'
REPOSITORIES = {
        'openbach': ProjectInfos('openbach', 'src/jobs/', ''),
        'openbach-extra': ProjectInfos('openbach-extra', 'externals_jobs/stable_jobs/', 'src/jobs/private_jobs'),
}


def _build_headers():
    """Build base header dictionnary to communicate with the GitHub API"""

    headers = {'Accept': 'application/vnd.github.v3+json'}
    if API_TOKEN:
        headers['Authorization'] = 'token {}'.format(API_TOKEN)

    return headers


def _read_proxies(group_vars_file):
    """Read proxy configuration from the provided Ansible :vars: file"""

    with open(group_vars_file, encoding='utf-8') as openbach_variables:
        variables = yaml.load(openbach_variables)

    proxies = {}
    proxy_configuration = variables.get('openbach_proxy_env', {})
    for protocol in ('http', 'https'):
        with suppress(KeyError):
            proxies[protocol] = proxy_configuration['{}_proxy'.format(protocol)]

    return proxies


def list_jobs_properties(repository):
    """Retrieve the names and versions of jobs store in the provided :repository:"""

    try:
        project_info = REPOSITORIES[repository]
    except KeyError:
        raise errors.NotFoundError(
                'The project does not exist in the repository',
                project_name=repository)

    files = {
            f['path']
            for f in _list_project_files(project_info.id, project_info.jobs_path)
            if os.path.splitext(f['name'])[1] == '.yml'
    }

    return [
            {
                'display': ' '.join(map(str.title, name.split('_'))),
                'name': name,
                'version': _fetch_version(project_info.id, path),
            } for name, path in sorted(_filter_jobs(files))
    ]


def add_job(name, repository, dest_dir='/opt/openbach/controller'):
    """Add a job from the given :repository: into the :dest_dir: folder of the controller"""

    try:
        project_info = REPOSITORIES[repository]
    except KeyError:
        raise errors.NotFoundError(
                'The project does not exist in the repository',
                project_name=repository)

    yaml = '{}.yml'.format(name)
    project_files = _list_project_files(project_info.id, project_info.jobs_path)
    try:
        file_blob = next(
                f for f in project_files
                if os.path.basename(f['path']) == yaml
        )
    except StopIteration:
        return

    dest_dir = os.path.join(dest_dir, project_info.dest_dir)
    base_directory = os.path.dirname(os.path.dirname(file_blob['path']))
    for blob in _list_project_files(project_info.id, base_directory):
        if blob['type'] == 'file':
            destination = os.path.join(dest_dir, blob['path'])
            _retrieve_file(project_info.id, blob['path'], destination)

    return os.path.join(dest_dir, base_directory)


def _filter_jobs(files):
    """Generate pairs of jobs names and their associated configuration
    files from the whole list of :files: inside a repository.
    """

    for filepath in files:
        folder, filename = os.path.split(filepath)
        job_name, _ = os.path.splitext(filename)
        parent_folder, files_folder = os.path.split(folder)
        if files_folder != 'files':
            continue
        install_filename = 'install_{}.yml'.format(job_name)
        install = os.path.join(parent_folder, install_filename)
        uninstall = os.path.join(parent_folder, 'un' + install_filename)
        if install in files and uninstall in files:
            yield job_name, filepath


def _fetch_raw_content(project_id, file_path):
    """Fetch a file from the repository without wrapping it in a JSON response"""

    return _do_request(project_id, file_path, accept='application/vnd.github.v3.raw').content


def _fetch_version(project_id, file_path):
    """Read a job's configuration file and return its version"""

    content = _fetch_raw_content(project_id, file_path)
    try:
        job = yaml.load(content)
        return job['general']['job_version']
    except (yaml.error.YAMLError, KeyError):
        return None


def _retrieve_file(project_id, path, dest_file):
    """Download a file from the repository and write it at the provided destination"""

    content = _fetch_raw_content(project_id, path)

    dest_folder = os.path.dirname(dest_file)
    os.makedirs(dest_folder, exist_ok=True)

    with open(dest_file, 'wb') as f:
        f.write(content)


def _list_project_files(project_id, path):
    """Generate all entries in the repository that correspond to a file"""

    for entry in _do_request(project_id, path).json():
        if entry['type'] == 'file':
            yield entry
        elif entry['type'] == 'dir':
            yield from _list_project_files(project_id, entry['path'])


def _do_request(project_id, route, accept=None, *, base_headers=_build_headers(), proxies=_read_proxies('/opt/openbach/controller/ansible/group_vars/all')):
    """Hit an API endpoint and return the result"""

    response = requests.get(
            BASE_URL_TEMPLATE.format(project_id, route),
            params={'ref': REF_NAME},
            proxies=proxies,
            headers=base_headers if accept is None else {**base_headers, 'Accept': accept})
    response.raise_for_status()
    return response
