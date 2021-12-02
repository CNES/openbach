# (c) 2012, Michael DeHaan <michael.dehaan@gmail.com>
# (c) 2017 Ansible Project
# GNU General Public License v3.0+ (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
from __future__ import (absolute_import, division, print_function)
__metaclass__ = type

DOCUMENTATION = """
    lookup: fileglob
    author: Michael DeHaan <michael.dehaan@gmail.com>
    version_added: "1.4"
    short_description: list files matching a pattern
    description:
        - Matches all files in a single directory, non-recursively, that match a pattern.
          It calls Python's "glob" library.
    options:
      _terms:
        description: path(s) of files to read
        required: True
      root:
        description: root directory from where to start the search
        required: False
    notes:
      - If root is not provided, patterns are only supported on files, not directory/paths.
      - Matching is against local system files.
"""

EXAMPLES = """
- name: display content of all .txt files in dir
  debug: msg={{lookup('file_glob', '/my/path/*.txt')}}

- name: display content of all .yml files in subdirectories of /tmp/foo/bar
  debug: msg={{lookup('file_glob', '**/*.yml root=/tmp/foo/bar')}}

- name: Copy each file over that matches the given pattern
  copy:
    src: "{{ item }}"
    dest: "/etc/fooapp/"
    owner: "root"
    mode: 0600
  with_fileglob:
    - "/playbooks/files/fooapp/*"
"""

RETURN = """
  _list:
    description:
      - list of files
"""

import os.path
from pathlib import Path

from ansible.plugins.lookup import LookupBase
from ansible.errors import AnsibleFileNotFound
from ansible.module_utils._text import to_bytes, to_text


def _parse_params(term):
    """Safely split parameter term to preserve spaces"""

    keys = [None, 'root']
    params = dict.fromkeys(keys, '')

    key = None
    for idx, path in enumerate(term.split()):
        for k in filter(None, keys):
            if path.startswith('{}='.format(k)):
                key = k
        if idx == 0 or not params[key]:
            params[key] = path
        else:
            params[key] += ' ' + path

    return [params[x] for x in keys if params[x]]


class LookupModule(LookupBase):

    def run(self, terms, variables=None, **kwargs):

        ret = []

        for term in terms:
            term, *root = _parse_params(term)
            if root:
                _, path = root[0].split('=', 1)
                found = Path(path).glob(term)
            else:
                term_file = os.path.basename(term)
                dwimmed_path = self.find_file_in_search_path(variables, 'files', os.path.dirname(term))
                found = Path(dwimmed_path).glob(term_file) if dwimmed_path else []
            ret.extend(to_text(g, errors='surrogate_or_strict') for g in found)
        return ret
