====== Using Ansible ======

<note>This manual is for the development version of OpenBACH. For the latest version, see the [[openbach:manuals:1.x:installation_manual:index|install manual]].</note>

===== Generalities =====

[[https://docs.ansible.com/ansible/latest/index.html|Ansible]] can use an ''openssh'' SSH client or, as a fallback, the [[http://www.paramiko.org/index.html|paramiko]] module. When using the ''openssh'' SSH client, any configuration in your ''~/.ssh/config'' will be used as well as any public key that are recognized by the target machines. In case the target machines cannot be contacted by public key, you will need to use either the ''-k'' switch of the ''ansible-playbook'' command or the ''ansible_ssh_pass'' ansible variable on a per-host basis (see [[openbach:manuals:2.x:installation_manual:using_ansible:index#ansible_variables|controlling the installation with variables]] for more details). For these options to work, Ansible rely on the ''sshpass'' program that need to be available on the install machine.

The ''sshpass'' program allow Ansible to programatically connect to remote hosts using passwords; but Ansible defaults of [[http://docs.ansible.com/ansible/latest/intro_getting_started.html#host-key-checking|enabling host key checking]] will most likely mean that you need to reach to each agent first before being able to use Ansible to install OpenBACH. You can either ''ssh'' directly onto each agent or use the following command to fetch the remote host key and write it into your ''know_hosts'' file:

<code>$ ssh-keyscan -H <remote_host_address> >> ~/.ssh/known_hosts</code>

Alternatively, if you are willing to, you can disable host key checking when invoking Ansible:

<code>$ ANSIBLE_HOST_KEY_CHECKING=false ansible-playbook ...</code>

===== Ansible variables =====

You can controll most phases of the installation process using ansible variables. Three ways are favored by OpenBACH to define variables:

  * [[http://docs.ansible.com/ansible/latest/intro_inventory.html#host-variables|in the inventory file]] on a per-host basis;
  * [[https://docs.ansible.com/ansible/latest/user_guide/intro_inventory.html#splitting-out-host-and-group-specific-data|in a dedicated host_vars file]] on a per-host basis;
  * using the [[http://docs.ansible.com/ansible/latest/playbooks_variables.html#passing-variables-on-the-command-line|''-e'' option of the ''ansible-playbook'' command]] to apply it to all machines.

The following table list some of the interesting ansible variable and all the openbach ones:

^  Variable Name  ^  Command line option  ^  Effect  ^
| [[http://docs.ansible.com/ansible/latest/intro_inventory.html#list-of-behavioral-inventory-parameters|ansible_user]]   | -u REMOTE_USER, --user=REMOTE_USER   | Use this user for the connection to the remote machine   |
| [[http://docs.ansible.com/ansible/latest/intro_inventory.html#list-of-behavioral-inventory-parameters|ansible_ssh_pass]]   | -k, --ask-pass  | Use this password for the connection to the remote machine  |
| [[http://docs.ansible.com/ansible/latest/intro_inventory.html#list-of-behavioral-inventory-parameters|ansible_ssh_private_key_file]]   | --private-key=PRIVATE_KEY_FILE, --key-file=PRIVATE_KEY_FILE  | Use this SSH key to connect to the remote machine  |
| [[http://docs.ansible.com/ansible/latest/become.html#connection-variables|ansible_become_pass]]   | -K, --ask-become-pass   | Use this password for sudo commands   |
| openbach_name   |    | Use this name when registering an agent into the OpenBACH controller. Must be unique for each agent.   |
| [[openbach:manuals:2.x:installation_manual:topology_configuration:index#machine_dependencies|openbach_controller]]   | -e openbach_controller=CONTROLLER_IP   | Use this controller to associate to the agents/auditoriums   |
| [[openbach:manuals:2.x:installation_manual:topology_configuration:index#machine_dependencies|openbach_collector]]   | -e openbach_collector=COLLECTOR_IP   | Use this collector to associate to the agents/auditoriums   |
| [[openbach:manuals:2.x:installation_manual:topology_configuration:index#machine_dependencies|openbach_auditorium]]   | -e openbach_auditorium=AUDITORIUM_IP   | Use this auditorium to associate to the collectors (for broadcasting purposes)   |
| [[openbach:manuals:2.x:installation_manual:using_proxies:index|openbach_http_proxy]]   | -e openbach_http_proxy=PROXY_URL   | Use this proxy for HTTP connections from the remote machine throughout the install   |
| [[openbach:manuals:2.x:installation_manual:using_proxies:index|openbach_https_proxy]]   | -e openbach_https_proxy=PROXY_URL   | Use this proxy for HTTPS connections from the remote machine throughout the install   |
| [[openbach:manuals:2.x:installation_manual:security:index|openbach_backend_admin_name]]   | -e openbach_backend_admin_name=USERNAME   | Create/Connect as this user on the controller to add jobs and install collectors and agents (default ''openbach'')   |
| [[openbach:manuals:2.x:installation_manual:security:index|openbach_backend_admin_password]]   | -e openbach_backend_admin_password=PASSWORD   | Create/Connect using this password on the controller to add jobs and install collectors and agents (default ''openbach'')   |
| [[openbach:manuals:2.x:installation_manual:using_ansible:index#adding_jobs_from_external_sources|openbach_jobs_folders]]   | -e '{"openbach_jobs_folders": ["FOLDER1", "FOLDER2"]}'   | Add extra jobs founds in this list of folders into the controllers database   |
| [[openbach:manuals:2.x:installation_manual:using_ansible:index#adding_jobs_from_external_sources|default_jobs]]   | -e '{"default_jobs": ["JOB1", "JOB2"]}'   | Install exactly these jobs on each agent instead of the default ones   |
| openbach_backend_retry_delay   | -e openbach_backend_retry_delay=SECONDS   | Sleep this amount of seconds between each retries when waiting for a playbook to finish on the controllers   |
| [[openbach:manuals:2.x:installation_manual:using_ansible:index#uninstalling_an_openbach_platform|openbach_clear_database]]   | -e openbach_clear_database=yes   | Use this switch to clear recorded data during the uninstallation of a controller or collector   |
| [[openbach:manuals:2.x:installation_manual:backup_and_restore:index|openbach_restore_archive]]   | -e openbach_restore_archive=openbach_backup.tar.gz   | Path to an archive file created via a backup of an existing platform to perform its restoration from the collected data instead of a full-blown installation   |

===== Ansible tags =====

The install process also rely on [[http://docs.ansible.com/ansible/latest/playbooks_tags.html|ansible tags]] to fine-tune the behavior of the playbooks. Most of them are meant to be used with the ''skip-tags'' option of the ''ansible-playbook'' command. These tags are:

  * [[openbach:manuals:2.x:installation_manual:ntp_configuration:index|configure_ntp_server]]
  * [[openbach:manuals:2.x:installation_manual:security:index|consider_safe_network]]
  * [[openbach:manuals:2.x:installation_manual:backup_and_restore:index|restore_elasticsearch_database]]
  * [[openbach:manuals:2.x:installation_manual:backup_and_restore:index|restore_influxdb_database]]
  * [[openbach:manuals:2.x:installation_manual:backup_and_restore:index|restore_backend_database]]
  * [[openbach:manuals:2.x:installation_manual:backup_and_restore:index|rerun_jobs_install_playbooks]]

===== Installing an OpenBACH platform =====

Once the inventory script is written and the various variables figured out, you may run the ''ansible-playbook'' command to run the ''install.yml'' playbook located in the ''ansible'' folder of your sources. You can use the ''ansible-playbook'' installed on your system or the ''ansible-playbook'' wrapper shipped in the ''ansible'' folder of your sources. You must <code>$ cd path/to/your/sources/ansible/</code> before using Ansible. Invokation of the command may look like any of the following:

<code>
$ ansible-playbook install.yml
$ ansible-playbook install.yml -u exploit -k -K
$ ansible-playbook install.yml -u exploit --key-file=~/.ssh/openbach_id_rsa -K -e '{"openbach_jobs_folders": ["~/openbach/extra/stable/", "~/openbach/extra/experimental/"]}'
$ ansible-playbook install.yml -u exploit -e openbach_backend_admin_name=openbach -k -K
$ ansible-playbook install.yml --skip-tags configure_ntp_server
</code>

===== Uninstalling an OpenBACH platform =====

Instructions for uninstalling OpenBACH are similar to those for installing it; except that you need to run the ''uninstall.yml'' playbook instead.

Note that if you [[openbach:manuals:2.x:administrator_manual:index#manage_agents|added some Agents]] after the installation of the platform, you will need to add their IP address in your inventory file as well to properly uninstall them. This ''uninstall.yml'' playbook is a shortcut to bulk-uninstall a whole platform at once, it will **not** ask the Controller for the full list of Agents before removing them.

Also note that, by default, databases content are left intact on the Controller (internal SQL database storing projects, scenarios and so on) and the Collector (InfluxDB and ElasticSearch). If you want to also remove these data, you will have to enable the ''openbach_clear_database'' variable. Example:

<code>
$ ansible-playbook uninstall.yml -u exploit -k -K -e openbach_clear_database=yes
</code>

===== Adding Jobs from External Sources =====

As you may have seen from the examples, the ''openbach_jobs_folders'' variable can be used to provide a list of extraneous jobs to add into the controller. This can be particularly usefull in conjunction with the [[https://forge.net4sat.org/openbach/openbach-external-jobs|OpenBACH external jobs]] repository, for instance. It is also usefull if you are [[openbach:manuals:2.x:developer_manual:index#Developping a new Job|developping your own jobs]] and want to try them out in a real context.

You can also extend / limit the jobs that will be installed on the agents by the install playbook. Use the ''default_jobs'' ansible variable to provide a list of the name of the jobs that should be installed on the agents. Example:

<code>
$ ansible-playbook install.yml -u exploit -k -K -e '{"openbach_jobs_folders": ["~/openbach_extra/stable_jobs/", "~/jobs_devel/"], "default_jobs": ["iperf", "fping", "socat", "my_brand_new_job", "mptcp", "squid"]}'
</code>
