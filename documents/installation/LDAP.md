# Multi-Users and LDAP authentication

By default, OpenBACH user management is kept very simple: users can create themselves but have
to wait for an administrator to activate their account. If your target platform makes use of
an LDAP to authenticate users, you can leverage it to avoid this manual intervention.

A few extra variables control the configuration of using an LDAP server alongside an OpenBACH platform:

| Variable Name             | Required | Effect |
| ---                       | :---:    | ---    |
| `openbach_ldap_auth`      | :negative_squared_cross_mark: | Boolean value to indicate if LDAP configuration is required or not (default: no) |
| `openbach_ldap_server_ip` | :white_check_mark: | IP address of the LDAP server to use |
| `openbach_ldap_tls`       | :negative_squared_cross_mark: | Boolean value to indicate if the LDAP server should be contacted using TLS (default: no) |
| `openbach_ldap_bindDn`    | :negative_squared_cross_mark: | Domain name to authenticate into the LDAP service (default: None) |
| `openbach_ldap_bindPwd`   | :negative_squared_cross_mark: | Password to authenticate into the LDAP service (default: None) |
| `openbach_ldap_filter`    | :negative_squared_cross_mark: | Field to use to filter users with (default: 'uid')   |
| `openbach_ldap_baseDn`    | :white_check_mark: | Domain name to connect to LDAP |
| `openbach_ldap_groupDn`   | :white_check_mark: | LDAP group to fetch users from |

Variables marked required does not need to be provided when LDAP configuration is
deactivated (_i.e._ `openbach_ldap_auth` is not set to `True`).

To properly enable LDAP configuration, you need to [provide these variables](Ansible.md#ansible-variables)
to each Controller/Collector/Auditorium that will use them. Assuming the 3 entities are on the same host,
you could create the following `group_vars/controller` file:

``` yaml
---

openbach_ldap_auth: yes
openbach_ldap_server_uri: ldap://xx.xx.xx.xx
openbach_ldap_tls: no
openbach_ldap_bindDn:
openbach_ldap_bindPwd:
openbach_ldap_filter: uid
openbach_ldap_baseDn: "dc=example,dc=com"
openbach_ldap_groupDn: "cn=standard-users,ou=groups,dc=example,dc=com"
```

The groups are not yet supported in OpenBACH

Be [careful to specify your own admin user](Security.md), otherwise the playbook will crash asking a password. 
