OpenBACH Installation on Ubuntu 20.04
========

Configuration needed
======

* ubuntu-20.04-cloud-vanilla
* Std.lplus (RAM 4Go, 2 VSPU, Disque 30Go)

Required for installation
======

* `sudo -H -E apt install -y libffi-dev libssl-dev python3-pip`
* `sudo -H -E pip3 install -U cryptography`
* `sudo pip3 install ansible==2.10.0`
* `git clone -b openbach_20_04 --recursive https://forge.net4sat.org/openbach/openbach.git`

As some Ansible modules where moved to collections, we need to do `ansible-galaxy collection install ansible.posix` to prepare some jobs installation (apache2 for example). 


Inventory
======

vim openbach/ansible/inventory/inventory
```
[controller]
<ip_controller> openbach_name=Controller

[agent]
<ip_agent> openbach_name=Acq1

[all:vars]
ansible_python_interpreter=/usr/bin/python3
```

Installation
======

* `cd ~/openbach/ansible`
* `ansible-playbook install.yml -i inventory/inventory --private-key=~/.ssh/key_team -vvv`


For now, we need to do the following for the agent: 

**Old method:**

* `cd /opt/openbach/controller/src/agent/collect-agent/client_api/bindings`
* `sudo python3 setup.py install`
* `sudo systemctl restart openbach_agent.service`
* `sudo chown -R openbach:openbach /opt/openbach/controller/src/agent/collect-agent/client_api/bindings/build/`

If we have other agent:
* `scp -i ~/.ssh/key_team build/lib.linux-x86_64-3.8/collect_agent.cpython-38-x86_64-linux-gnu.so ubuntu@<agent_ip>:/home/ubuntu`
* On the other agent: 
    * `sudo mv /home/ubuntu/collect_agent.cpython-38-x86_64-linux-gnu.so /usr/local/lib/python3.8/dist-packages`
    * `sudo systemctl restart openbach_agent.service`


**Recent method:**

We can also copy the .deb directly:
* `cd ~/openbach/src/agent/collect-agent/client_api`
* We compile the collect_agent: `dpkg-buildpackage -rsudo -us -uc`
* `cd ~/openbach/src/agent/collect-agent`
* We install the collect_agent: `dpkg -i collect-agent_1.3.3_amd64.deb`
* `sudo systemctl restart openbach_agent.service`

If we have other agent: 
* `scp -i ~/.ssh/key_team ~/openbach/src/agent/collect-agent/collect-agent_1.3.3_amd64.deb ubuntu@<agent_ip>:/home/ubuntu`
* On the other agent: 
    * `dpkg -i collect-agent_1.3.3_amd64.deb`
    * `sudo systemctl restart openbach_agent.service`

Note
======

Check regularly openbach_conductor.service status. The error "max_client_conn" may happen. For now, we have to restart the conductor: `systemctl restart openbach_conductor.service`. The error is under investigation. -> solved error
