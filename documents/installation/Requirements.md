====== Requirements ======

===== Target Machines (your future agents/controller/collector/auditorium) =====

  * OpenBACH has been developed for and tested with: Ubuntu 16.04 LTS;
  * Each machine should allow SSH connections;
  * Each SSH connection should be made with a user able to run arbitrary sudo commands;
  * The machine for the collector component should have a 64 bits OS;
  * Recommended 2Gb of RAM on each machine.

Targets machines hosting only the agent component may support arbitrary OS installation in the future, but the feature needs contributions yet.


===== Installation Machine (the one from which you install OpenBACH) =====

  * Any Linux flavor;
  * Ansible (between version 2.6 and 2.7.6);
  * Python 3.5 or newer;
  * Optionally the openssh SSH client (see ansible invokation below);
  * Optionally the sshpass program (see ansible invokation below);
  * Optionally the git program (see [[openbach:manuals:2.x:installation_manual_16_04:index#getting_openbach|getting OpenBACH sources]]).

<note important>On recent version of Ubuntu 16.04, the python openssl package is not updated and conflicts with the OpenBACH install. To correct that do: ''sudo apt remove –purge python-openssl'' if this packets exists and ''sudo pip3 install pyopenssl''</note>


Ansible might need the following dependencies on Ubuntu 16.04:

<code>
$ sudo apt install libffi-dev libssl-dev python3-dev python3-pip
$ sudo apt remove python3-cryptography
$ sudo pip3 install cryptography==2.5

</code>


===== Ansible Installation =====

The official [[https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html|Ansible installation guide]] can get you started into installing Ansible on your installation machine. However the existing packets may bundle Ansible to Python 2, which is not advisable for OpenBACH. You need to make sure that your version of Ansible runs with Python 3. You can check which Python version is used by Ansible by issuing:

<code>
$ ansible --version
ansible 2.7.6
  config file = /home/exploit/openbach/ansible/ansible.cfg
  configured module search path = ['/home/exploit/.ansible/plugins/modules', '/usr/share/ansible/plugins/modules']
  ansible python module location = /usr/lib/python3.7/site-packages/ansible
  executable location = /usr/bin/ansible
  python version = 3.7.2 (default, Jan 10 2019, 23:51:51) [GCC 8.2.1 20181127]
</code>

To better control both the Ansible version installed and the Python version used to run it, we advise, [[https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html#what-version-to-pick|as Ansible do]], to use ''pip'', the Python packet manager, to install Ansible:

<code>
$ sudo pip3 install ansible==2.7.6
</code>

pip3 may install the ansible binary in the .local/bin folder. You may want to update your PATH variable accordingly.

If you want to keep several version of Ansible on your system, or don't want to uninstall the version of Ansible provided by your packet manager, we highly recommend to use [[https://docs.python.org/3/library/venv.html|virtual environments]].

==== Troubleshootings on installation - using OpenBACH wrapper ====
In case you have problems with Python and/or Ansible versions (or in order to simplify the whole process), a wrapper around the invocation of the ''ansible-playbook'' command is available in the ''ansible'' directory of the OpenBACH sources ([[openbach:manuals:2.x:installation_manual_16_04:index#getting_openbach|get OpenBACH sources]]). This script create a hidden virtualenv and caches a suitable version of Ansible into it. First invocation is thus slow as it will download Ansible and install it in the virtualenv. Subsequent calls should be seamless, though. This script acts as a drop-in replacement for the ''ansible-playbook'' command; meaning that you can safely replace a system-wide command such as:

<code>
$ ansible-playbook install -u exploit -k -K
</code>

into a local command such as:

<code>
$ ./ansible-playbook install -u exploit -k -K
</code>
