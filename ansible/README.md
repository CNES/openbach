# Installation Manual

This manual explains how to install and upgrade an OpenBACH platform. 

## Requirements

For specific requirements of each kind of machine, see the
[advanced page of requirements](/documents/installation/Requirements.md).

### Target machines (your future agents/controller/collector/auditorium)

  * Ubuntu 20.04 LTS for the target machines;
  * Recommended 2Gb of RAM on the target machines.
  * The machines need to have a default route (check ip route) and Internet access.

### Installation machine

  * Any Linux flavor with Ansible (at least version 2.11.12, but due to the separation of versionning scheme between the core and the modules collections, it is recommended to install version 4.5+) and
    Python 3.8.5 or newer on the installation machine;
  * The installation machine needs to have access to all target
    machines (could e.g. be one of the target machines);
  * Matplotlib and Panda (if you need to launch executors that generate
    figures/plots from this machine) : sudo pip3 install matplotlib / sudo pip3 install pandas


Make sure that the version of ansible you have installed is actually using Python 3
and **not** Python 2. If this is not the case please refer to the
[Ansible installation instructions](/documents/installation/Requirements.md#ansible-installation).

```
$ ansible --version
ansible [core 2.13.4]
  config file = /etc/ansible/ansible.cfg
  configured module search path = ['/home/ubuntu/.ansible/plugins/modules', '/usr/share/ansible/plugins/modules']
  ansible python module location = /usr/local/lib/python3.10/dist-packages/ansible
  ansible collection location = /home/ubuntu/.ansible/collections:/usr/share/ansible/collections
  executable location = /usr/local/bin/ansible
  python version = 3.10.7 (main, Sep  6 2022, 21:22:27) [GCC 12.2.0]
  jinja version = 3.1.2
  libyaml = True
```

## Getting OpenBACH

Before being able to deploy an OpenBACH platform, you must acquire the sources files
hosted on [CNES GITHUB page](https://github.com/CNES/openbach
"To be fair, you might already know that if you're reading this").

You can either:
  * Download an [archive file of the repository][1];
  * Or clone the repository using `git`: `git clone --depth 1 --single-branch https://github.com/CNES/openbach.git`

> :warning: Developpers that want to contribute to the OpenBACH repository should clone
the whole history (i.e.: dropping the `depth` and `single-branch` options)

### Target topology configuration

Before deploying OpenBACH to your target machines, you need to configure which component
will be installed on which machine. Just create a file in the `ansible/inventory` folder
of your sources and populate it with your installation instructions. The name of the file
does not matter, this tutorial considers a file named `my-openbach-inventory`.

We propose herein an example where the Controller, Collector, and Auditorium are installed
in the same machine, and two additional Agents in separate machines. You give a name to
your agents with the option `openbach_name`, otherwise openbach will take the hostname of
the machine to name each agent. For advanced topologies see the
[advanced toplogy guide](/documents/installation/Topology.md) or see the
[README](inventory/README.md) file of this folder as a quick reminder of this section.

``` ini
[controller]
172.20.0.1

[agent]
172.20.0.2 openbach_name=client
172.20.0.3 openbach_name=server
```

## Install procedure

The installation of OpenBACH is performed via [Ansible](https://www.ansible.com/). Be aware
that you need to [learn some Ansible concepts][2] to ease the following procedure.

Before the installation, we highly recommend to test the SSH connectivity between your
installation machine and your OpenBACH platform by means of an Ansible ping. Assuming
you created the topology file `ansible/inventory/my-openbach-inventory`, you can issue
the following command in the `ansible` directory of `openbach`:

```
$ cd openbach/ansible/
$ ansible -i inventory/my-openbach-inventory -u *ssh_username* -k -m ping all 
```

> :warning: Use the option `--private-key=*path_to_private_key*` if
you connect to the machines via a private key.

from the `ansible` folder of the OpenBACH sources. Other means of connecting to the target
machines as well as debugging connection issues are explained in the
[using Ansible guide](/documents/installation/Ansible.md).

Installing OpenBACH itself can then be as simple as issuing:

```
$ cd openbach/ansible/
$ ansible-playbook -i inventory/my-openbach-inventory install.yml -u *ssh_username* -k -K 
```

from the `ansible` folder of the OpenBACH sources. Extra options can be enabled in various
ways, refer to the list of [Ansible variables](/documents/installation/Ansible.md#ansible-variables)
and [tags](/documents/installation/Ansible.md#ansible-tags) for details.

## Upgrading an OpenBACH platform

In case you want to upgrade an existing OpenBACH platform, we recommend to clone the relevant
OpenBACH git repository and repeat the install procedure.

Before upgrading an  OpenBACH platform, you may want to uninstall it as follows, before
repeating the install procedure.

```
$ cd openbach/ansible/
$ ansible-playbook -i inventory/my-openbach-inventory uninstall.yml -u *ssh_username* -k -K
```

More information on the uninstall can be found in the [using Ansible manual](/documents/installation/Ansible.md).

## Miscellaneous topics

  * [Working with proxies guide](/documents/installation/Proxies.md);
  * [NTP configuration guide](/documents/installation/NTP.md);
  * [LDAP configuration guide](/documents/installation/LDAP.md);
  * [Specifying your own admin user](/documents/installation/Security.md);
  * [Backup and Restoration guide](/documents/installation/Backup.md);


[1]: https://github.com/CNES/openbach/repository/archive.tar.gz?ref=master
[2]: https://docs.ansible.com/ansible/latest/index.html
