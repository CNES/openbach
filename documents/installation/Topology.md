#  Target topology configuration

Before deploying OpenBACH to your target machines, you need to configure which component
will be installed on which machine. Since the installation of OpenBACH is done through
[Ansible playbooks][1], this configuration uses their [inventory files][2] capabilities.
Just create a file in the `ansible/inventory` folder of your sources and populate it with
your installation instructions.

If you wish to use several inventory files for several platform configuration, you can
limit Ansible to reading only one of them using its `-i` flag on the command-line.

> :warning: Some file extensions in the `ansible/inventory` folder will be ignored
during the installation process. Please do not end your filename by either
`~`, `.orig`, `.bak`, `.ini`, `.cfg`, `.retry`, `.pyc`, `.pyo`, `.rc`, or `.md`.

A [README](/ansible/inventory/README.md) file is also available in this
folder as a quick reminder of this section.

## The basics

Inventory groups are used by the installation playbooks to know which components to install
on which machine. You are free to create any group as necessary to organize your topology but
the installation playbooks will only consider the following groups (which directly map to the
OpenBACH components):

  * agent
  * collector
  * controller
  * auditorium

Not all groups are required, and some groups are included into others; which lead to the
simplest inventory file looking something like:

``` ini
[controller]
172.20.0.1
```

to install all 4 components on a single machine.

> :warning: Note that ansible provide support for dynamic inventories: any executable file
in the `ansible/inventory/` folder will be executed and its output interpretted as an
inventory. See [the ansible documentation][3] for more details.

## Group dependencies

The following rules determines which components will be installed on which machines:

  * the `agent`, `collector`, and `controller` groups always install an agent on the machine;
  * the `controller` group additionally install a controller on the machines;
  * the `collector` group additionally install a collector on the machines;
  * if the `collector` group is missing or empty, the `controller` group also install a
    collector on the machines;
  * the `auditorium` group install an auditorium on the machines;
  * if the `auditorium` group is missing or empty, the `controller` group also
    install an auditorium on the machines.

The corollary of the rules is that you can install an agent, a collector, or an auditorium
(even though it may not perform anything usefull) without a controller; but installing a
controller will always mean having the 4 entities installed (even though not necessarilly
on the same machine).

Any redundancy in these rules are ignored by Ansible internal mechanisms. This means that:

``` ini
[agent]
172.20.0.1
172.20.0.2
172.20.0.3

[collector]
172.20.0.2

[controller]
172.20.0.1

[auditorium]
172.20.0.1
```

is equivalent to the simpler

``` ini
[controller]
172.20.0.1

[collector]
172.20.0.2

[agent]
172.20.0.3
```

## Machine dependencies

The agent and auditorium components need to be associated to a controller (if any) and
a collector (if any). The rules of default association are pretty simple:

  * if a controller and/or a collector is installed on the same machine than the
    agent/auditorium, they are used for the association;
  * otherwise, the first machine in the `controller` group (if any) and/or the
    first machine in the `collector` group (if any) are used for the association.

The defaults can be overriden using Ansible variables; see
[controlling the installation with variables](Ansible.md#ansible-variables)
below for more details. So, the following inventory:

``` ini
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

Will lead to the installation of 7 agents:
  * 192.168.0.1 that relate to the controller 192.168.0.1 and the collector 192.168.0.10
  * 192.168.0.10 that relate to the controller 192.168.0.1 and the collector 192.168.0.10
  * 192.168.0.11 that relate to the controller 192.168.0.1 and the collector 192.168.0.11
  * 192.168.0.100 that relate to the controller 192.168.0.1 and the collector 192.168.0.10
  * 192.168.0.101 that relate to the controller 192.168.0.1 and the collector 192.168.0.11
  * 192.168.0.102 that relate to the controller 192.168.0.1 and the collector 192.168.0.10
  * 192.168.0.103 that relate to the controller 192.168.0.1 and the collector 192.168.0.11


[1]: http://docs.ansible.com/ansible/latest/playbooks.html
[2]: http://docs.ansible.com/ansible/latest/intro_inventory.html
[3]: http://docs.ansible.com/ansible/latest/intro_dynamic_inventory.html#other-inventory-scripts
