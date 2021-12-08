# Requirements

## Target Machines (your future agents/controller/collector/auditorium)

  * OpenBACH has been developed for and tested with: Ubuntu 20.04 LTS;
  * Each machine should allow SSH connections;
  * Each SSH connection should be made with a user able to run arbitrary sudo commands;
  * The machine for the collector component should have a 64 bits OS;
  * Recommended 2Gb of RAM on each machine and 4Gb for controller.

Targets machines hosting only the agent component may support arbitrary OS installation
in the future, but the feature needs contributions yet.

## Installation Machine (the one from which you install OpenBACH)

  * Any Linux flavor;
  * Ansible (at least version 2.10);
  * Python 3.8.5 or newer;
  * Optionally the openssh SSH client (see ansible invokation below);
  * Optionally the sshpass program (see ansible invokation below);
  * Optionally the git program (see [getting OpenBACH sources](/ansible/README.md#getting-openbach)).

## Ansible Installation

The official [Ansible installation guide][1] can get you started into installing Ansible on your
installation machine. However the existing packets may bundle Ansible to Python 2, which is not
advisable for OpenBACH. You need to make sure that your version of Ansible runs with Python 3.
You can check which Python version is used by Ansible by issuing:

```
$ ansible --version
ansible 2.10.5
  config file = None
  configured module search path = ['/home/ubuntu/.ansible/plugins/modules', '/usr/share/ansible/plugins/modules']
  ansible python module location = /usr/local/lib/python3.8/dist-packages/ansible
  executable location = /usr/local/bin/ansible
  python version = 3.8.5 (default, Jul 28 2020, 12:59:40) [GCC 9.3.0]
```

To better control both the Ansible version installed and the Python version used to run it, we
advise, [as Ansible do][2], to use `pip`, the Python packet manager, to install Ansible:

```
$ sudo apt install python3-pip
$ sudo pip3 install "ansible<2.11"
```

`pip3` may install the ansible binary in the `.local/bin` folder. You may want to update your
`PATH` environment variable accordingly.

If you want to keep several version of Ansible on your system, or don't want to uninstall the
version of Ansible provided by your packet manager, we highly recommend to use [virtual environments][3].

### Troubleshootings on installation - using OpenBACH wrapper

In case you have problems with Python and/or Ansible versions (or in order to simplify the whole
process), a wrapper around the invocation of the `ansible-playbook` command is available in the
`ansible` directory of the OpenBACH sources ([get OpenBACH sources](/ansible/README.md#getting-openbach)).
This script create a hidden virtualenv and caches a suitable version of Ansible into it. First
invocation is thus slow as it will download Ansible and install it in the virtualenv. Subsequent
calls should be seamless, though. This script acts as a drop-in replacement for the `ansible-playbook`
command; meaning that you can safely replace a system-wide command such as:

```
$ ansible-playbook install -u exploit -k -K
```

into a local command such as:

```
$ ./ansible-playbook install -u exploit -k -K
```


[1]: https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html
[2]: https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html#what-version-to-pick
[3]: https://docs.python.org/3/library/venv.html
