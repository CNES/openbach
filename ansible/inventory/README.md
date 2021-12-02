Basics
======

Any file in this `inventory` directory will be used by the install playbook
to run the OpenBACH installer. Executable files will be executed and their
output considered an inventory too. Exceptions being files with the following
extensions:

 * ~
 * .orig
 * .bak
 * .ini
 * .cfg
 * .retry
 * .pyc
 * .pyo
 * .rc
 * .md

Each inventory will define hosts and groups as per ansible semantics. See
http://docs.ansible.com/ansible/latest/intro_inventory.html#hosts-and-groups
for details.

The install.yml playbook respond to 4 kind of groups:

 * agent
 * collector
 * controller
 * auditorium

Each group is optional and only the relevant parts will be installed
by the playbook. By default agents will be installed on each collector
and each controller, so there is no need to add them into the agent
group as well. This means that

```
[agent]
192.168.0.1
192.168.0.2

[collector]
192.168.0.2

[controller]
192.168.0.1
```

is equivalent to

```
[collector]
192.168.0.2

[controller]
192.168.0.1
```

An other default behaviour is to install a collector on each controller
if no collector is defined; and an auditorium on each controller if no
auditorium is defined.

Controlling related machines
============================

If you want to install several collectors (or even controllers) at once, you
may want to define which agent relates to which collector/controller. The same
is true for auditoriums.

In such cases, two special variables can be used on auditoriums and agents:

 * openbach_controller
 * openbach_collector

Both should be the name of the requested collector/controller. If these variables
are not defined, the first collector/controller defined in the appropriate group
is used as the related machine.

Example
-------

```
[agent]
192.168.0.100
192.168.0.101 openbach_collector=192.168.0.11
192.168.0.102
192.168.0.103 openbach_collector=192.168.0.11

[collector]
192.168.0.10
192.168.0.11

[controller]
192.168.0.1

[auditorium]
192.168.0.2
```

Will install 7 agents:

 * 192.168.0.1 that relate to the controller 192.168.0.1 and the collector 192.168.0.10
 * 192.168.0.10 that relate to the controller 192.168.0.1 and the collector 192.168.0.10
 * 192.168.0.11 that relate to the controller 192.168.0.1 and the collector 192.168.0.11
 * 192.168.0.100 that relate to the controller 192.168.0.1 and the collector 192.168.0.10
 * 192.168.0.101 that relate to the controller 192.168.0.1 and the collector 192.168.0.11
 * 192.168.0.102 that relate to the controller 192.168.0.1 and the collector 192.168.0.10
 * 192.168.0.103 that relate to the controller 192.168.0.1 and the collector 192.168.0.11

Naming machines in the OpenBACH backend
=======================================

OpenBACH can make use of a use-defined name for an Agent that is neither the
machine hostname nor its IP address. This name can be controlled by the
`openbach_name` variable. By default the name used is the concatenation of
the machine hostname and the IP address of its default interface.

Example
-------

```
[agent]
192.168.0.2

[controller]
192.168.0.1 openbach_name=Controller
```

Will install two agents:

 * 192.168.0.1 whose name is "Controller"
 * 192.168.0.2 whose name is the default name for this machine

Proxies
=======

The install playbook will install a few apt packages. Some jobs installed by
default on the agents may also require some pip modules. For such cases, each
apt command and each job installation that are run by the playbook have the
ability to override the `HTTP_PROXY` and `HTTPS_PROXY` environment variables
on the remote machine.

Two options are there to control the value of these variables:

 * Run the playbook with these variables already set on the install machine;
 * Use the ansible variables `openbach_http_proxy` and `openbach_https_proxy`
   on a per-host basis.

By default, if only `HTTP_PROXY` or `openbach_http_proxy` is defined, the
HTTPS proxy used will be the same.

Example
-------

```
[controller]
192.168.0.1 openbach_name=Controller openbach_http_proxy=http://example.com:1234/
```

Ansible trivia
==============

Defining variables
------------------

All previous examples define variables in the inventory file but you can
define them using two other ways:

 * the `-e` switch on the command-line when launching the playbook: this will
   set this variable for each host;
 * the `host_vars` directory that can contain a file per host name and define
   variables for this host only.

See http://docs.ansible.com/ansible/latest/intro_inventory.html#splitting-out-host-and-group-specific-data
for details.

Dynamic inventories
-------------------

Since executable files in this `inventory` directory will be executed, it is
possible to retrieve hosts/groups dynamically from an external service. Full
details at http://docs.ansible.com/ansible/latest/intro_dynamic_inventory.html#other-inventory-scripts

More often than not, the provided scripts will define machines using groups.
This is the case for the OpenStack script, for instance. In such cases,
you will need to use the special declaration `:children` in the openbach
groups to add machines from an other group defined by the script. You will
also need to manually define the group (even if empty) beforehand so the
current file is valid and self-contained and it will be populated later
by the script.

For instance:

```
# Dynamic group populated at a later point by the OpenStack script
[controller_vm]

[controller:children]
controller_vm
```

This suppose that a machine named `controller_vm` exists in your OpenStack
network and that the OpenStack script from
https://raw.githubusercontent.com/ansible/ansible/devel/contrib/inventory/openstack.py
has been placed in this `inventory` folder.

Defining users and password per host
------------------------------------

In case each (or some) machine have a different login/password, you can no
longer rely on the `-u`, `--key-file=`, `-k` or `-K` options of the
command-line. In such case, you can use the following ansible variables
on a per-host basis:

 * [ansible_user](http://docs.ansible.com/ansible/latest/intro_inventory.html#list-of-behavioral-inventory-parameters)
 * [ansible_ssh_private_key_file](http://docs.ansible.com/ansible/latest/intro_inventory.html#list-of-behavioral-inventory-parameters)
 * [ansible_ssh_pass](http://docs.ansible.com/ansible/latest/intro_inventory.html#list-of-behavioral-inventory-parameters)
 * [ansible_become_pass](http://docs.ansible.com/ansible/latest/become.html#connection-variables)
