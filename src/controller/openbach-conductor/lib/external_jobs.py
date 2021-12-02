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
REF_NAME = 'HEAD'
BASE_URL_TEMPLATE = 'https://forge.net4sat.org/api/v4/projects/{}/{}'
REPOSITORIES = {
        'openbach': ProjectInfos(44, 'src/jobs/', ''),
        'openbach-extra': ProjectInfos(102, 'externals_jobs/stable_jobs/', 'src/jobs/private_jobs'),
}


def read_proxies(group_vars_file):
    with open(group_vars_file, encoding='utf-8') as openbach_variables:
        variables = yaml.load(openbach_variables)

    proxies = {}
    proxy_configuration = variables.get('openbach_proxy_env', {})
    for protocol in ('http', 'https'):
        with suppress(KeyError):
            proxies[protocol] = proxy_configuration['{}_proxy'.format(protocol)]

    return proxies


PROXIES = read_proxies('/opt/openbach/controller/ansible/group_vars/all')


def list_jobs_properties(repository):
    raise errors.ConductorError('Net4Sat is down')

    try:
        project_info = REPOSITORIES[repository]
    except KeyError:
        raise errors.NotFoundError(
                'The project does not exist in the repository',
                project_name=repository)

    files = {
            f['path']: f['id']
            for f in _list_project_files(project_info.id, project_info.jobs_path)
            if os.path.splitext(f['path'])[1] == '.yml'
    }

    return [
            {
                'display': ' '.join(map(str.title, name.split('_'))),
                'name': name,
                'version': _fetch_version(project_info.id, checksum),
            } for name, checksum in sorted(_filter_jobs(files))
    ]


def add_job(name, repository, dest_dir='/opt/openbach/controller'):
    raise errors.ConductorError('Net4Sat is down')

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
        if blob['type'] == 'blob':
            destination = os.path.join(dest_dir, blob['path'])
            _retrieve_file(project_info.id, blob['id'], destination)

    return os.path.join(dest_dir, base_directory)


def _filter_jobs(files):
    for filename, checksum in files.items():
        folder, filename = os.path.split(filename)
        job_name, _ = os.path.splitext(filename)
        parent_folder, files_folder = os.path.split(folder)
        if files_folder != 'files':
            continue
        install_filename = 'install_{}.yml'.format(job_name)
        install = os.path.join(parent_folder, install_filename)
        uninstall = os.path.join(parent_folder, 'un' + install_filename)
        if install in files and uninstall in files:
            yield job_name, checksum


def _fetch_raw_content(project_id, file_sha):
    return _do_request(project_id, 'repository/blobs/{}/raw'.format(file_sha))


def _fetch_version(project_id, file_sha):
    response = _fetch_raw_content(project_id, file_sha)
    try:
        content = yaml.load(response.content)
        return content['general']['job_version']
    except (yaml.error.YAMLError, KeyError):
        return None


def _retrieve_file(project_id, file_sha, dest_file):
    response = _fetch_raw_content(project_id, file_sha)

    dest_folder = os.path.dirname(dest_file)
    os.makedirs(dest_folder, exist_ok=True)

    with open(dest_file, 'wb') as f:
        f.write(response.content)


def _list_project_files(project_id, path):
    page = 0
    while True:
        page += 1
        response = _do_request(
                project_id,
                'repository/tree',
                recursive='true',
                ref=REF_NAME,
                path=path,
                per_page=100,
                page=page).json()
        if not response:
            break
        yield from response


def _do_request(project_id, route, **params):
    if not params:
        params = None

    response = requests.get(
            BASE_URL_TEMPLATE.format(project_id, route),
            params=params, proxies=PROXIES)
    response.raise_for_status()
    return response
