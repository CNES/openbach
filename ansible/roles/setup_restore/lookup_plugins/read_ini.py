from __future__ import (absolute_import, division, print_function)
__metaclass__ = type

DOCUMENTATION = """
    lookup: read_ini
    author: Mathias Ettinger <mettinger(at)toulouse.viveris.com>
    version_added: "2.7"
    short_description: read a ini file
    description:
      - "The read ini lookup reads the contents of an inventory file in INI format."
    options:
      _terms:
        description: Path(s) to files to read
        required: True
"""

EXAMPLES = """
- debug: msg="Content of file.ini is {{ lookup('read_ini', 'file.ini') }}"

- debug:
    msg: "{{ item }}"
  with_read_ini:
    - foo.ini
    - bar.ini
"""

RETURN = """
_raw:
  description:
    - Dictionary of host names associated to their designated groups"
"""
from ansible.errors import AnsibleError, AnsibleParserError
from ansible.inventory.data import InventoryData
from ansible.plugins.lookup import LookupBase
from ansible.plugins.inventory.ini import InventoryModule

try:
    from __main__ import display
except ImportError:
    from ansible.utils.display import Display
    display = Display()


class LookupModule(LookupBase):

    def run(self, terms, variables=None, **kwargs):

        parsed = []

        for term in terms:
            display.debug("Read ini lookup term: %s" % term)

            # Find the file in the expected search path
            path = self.find_file_in_search_path(variables, 'files', term)
            display.vvvv(u"Read ini lookup using %s as file" % path)
            if not path:
                raise AnsibleError("could not locate file in lookup: %s" % term)

            try:
                inventory = InventoryData()
                parser = InventoryModule()
                parser.parse(inventory, self._loader, path)
                parsed.append(inventory.get_groups_dict())
            except AnsibleParserError as e:
                raise AnsibleError(e)

        ret = {}
        for inventory in parsed:
            for group, hosts in inventory.items():
                for host in hosts:
                    ret.setdefault(host, []).append(group)
        return [ret]
