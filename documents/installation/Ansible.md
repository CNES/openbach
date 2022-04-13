# Using Ansible

## Generalities

[Ansible][1] can use an `openssh` SSH client or, as a fallback, the [paramiko][2] module.
When using the `openssh` SSH client, any configuration in your `~/.ssh/config` will be used
as well as any public key that are recognized by the target machines. In case the target
machines cannot be contacted by public key, you will need to use either the `-k` switch of
the `ansible-playbook` command or the `ansible_ssh_pass` ansible variable on a per-host
basis (see [controlling the installation with variables](#ansible-variables) for more
details). For these options to work, Ansible rely on the `sshpass` program that need to be
available on the install machine.

The `sshpass` program allows Ansible to programatically connect to remote hosts using
passwords; but Ansible defaults of [enabling host key checking][3] will most likely mean
that you need to reach to each agent first before being able to use Ansible to install
OpenBACH. You can either `ssh` directly onto each agent or use the following command to
fetch the remote host key and write it into your `know_hosts` file:

```
$ ssh-keyscan -H <remote_host_address> >> ~/.ssh/known_hosts
```

Alternatively, if you are willing to, you can disable host key checking when invoking Ansible:

```
$ ANSIBLE_HOST_KEY_CHECKING=false ansible-playbook ...
```

## Ansible variables

You can controll most phases of the installation process using ansible variables.
Three ways are favored by OpenBACH to define variables:

  * [in the inventory file][4] on a per-host basis;
  * [in a dedicated `host_vars` file][5] on a per-host basis;
  * using the [`-e` option of the `ansible-playbook` command][6] to apply it to all machines.

The following table list some of the interesting ansible variable and all the openbach ones:

| Variable Name | Command line option | Effect |
| ---           | ---                 | ---    |
| [`ansible_user`][7] | `-u REMOTE_USER`, `--user=REMOTE_USER` | Use this user for the connection to the remote machine |
| [`ansible_ssh_pass`][7] | `-k`, `--ask-pass`  | Use this password for the connection to the remote machine |
| [`ansible_ssh_private_key_file`][7] | `--private-key=PRIVATE_KEY_FILE`, `--key-file=PRIVATE_KEY_FILE` | Use this SSH key to connect to the remote machine |
| [`ansible_become_pass`][8] | `-K`, `--ask-become-pass` | Use this password for sudo commands |
| `openbach_name` | | Use this name when registering an agent into the OpenBACH controller. Must be unique for each agent |
| [`openbach_controller`][9] | `-e openbach_controller=CONTROLLER_IP` | Use this controller to associate to the agents/auditoriums |
| [`openbach_collector`][9] | `-e openbach_collector=COLLECTOR_IP` | Use this collector to associate to the agents/auditoriums |
| [`openbach_auditorium`][9] | `-e openbach_auditorium=AUDITORIUM_IP` | Use this auditorium to associate to the collectors (for broadcasting purposes) |
| [`openbach_http_proxy`](Proxies.md) | `-e openbach_http_proxy=PROXY_URL` | Use this proxy for HTTP connections from the remote machine throughout the install |
| [`openbach_https_proxy`](Proxies.md) | `-e openbach_https_proxy=PROXY_URL` | Use this proxy for HTTPS connections from the remote machine throughout the install |
| [`openbach_backend_admin_name`](Security.md) | `-e openbach_backend_admin_name=USERNAME` | Create/Connect as this user on the controller to add jobs and install collectors and agents (default `openbach`) |
| [`openbach_backend_admin_password`](Security.md) | `-e openbach_backend_admin_password=PASSWORD` | Create/Connect using this password on the controller to add jobs and install collectors and agents (default `openbach`) |
| [`openbach_jobs_folders`](#adding-jobs-from-external-sources) | `-e '{"openbach_jobs_folders": ["FOLDER1", "FOLDER2"]}'` | Add extra jobs founds in this list of folders into the controllers database |
| `project_name` | `-e project_name=openbach_first_project` | Automatically create a project of this name after the installation is complete and associate all the agents from the inventory to this project |
| [`default_jobs`](#adding-jobs-from-external-sources) | `-e '{"default_jobs": ["JOB1", "JOB2"]}'` | Install exactly these jobs on each agent instead of the default ones |
| [`installed_on`](#adding-jobs-from-external-sources) | `-e installed_on=agent`, `-e installed_on=controller` | Override the default list of jobs to install on the specified group and install all the available jobs instead, best used in addition to `openbach_jobs_folders` |
| `openbach_backend_retry_delay` | `-e openbach_backend_retry_delay=SECONDS` | Sleep this amount of seconds between each retries when waiting for a playbook to finish on the controllers |
| [`openbach_clear_database`](#uninstalling-an-openbach-platform) | `-e openbach_clear_database=yes` | Use this switch to clear recorded data during the uninstallation of a controller or collector |
| [`openbach_restore_archive`](Backup.md) | `-e openbach_restore_archive=openbach_backup.tar.gz` | Path to an archive file created via a backup of an existing platform to perform its restoration from the collected data instead of a full-blown installation |

## Ansible tags

The install process also rely on [ansible tags][10] to fine-tune the behavior of the playbooks. Most
of them are meant to be used with the `skip-tags` option of the `ansible-playbook` command. These tags are:

  * [configure_ntp_server](NTP.md)
  * [consider_safe_network](Security.md)
  * [restore_elasticsearch_database](Backup.md)
  * [restore_influxdb_database](Backup.md)
  * [restore_backend_database](Backup.md)
  * [rerun_jobs_install_playbooks](Backup.md)
  * [check_resources](Resources.md)

## Installing an OpenBACH platform ##

Once the inventory script is written and the various variables figured out, you may run the
`ansible-playbook` command to run the `install.yml` playbook located in the `ansible` folder
of your sources. You can use the `ansible-playbook` installed on your system or the
`ansible-playbook` wrapper shipped in the `ansible` folder of your sources. You must
```
$ cd path/to/your/sources/ansible/
```
before using Ansible. Invokation of the command may look like any of the following:

```
$ ansible-playbook install.yml
$ ansible-playbook install.yml -u exploit -k -K
$ ansible-playbook install.yml -u exploit --key-file=~/.ssh/openbach_id_rsa -K -e '{"openbach_jobs_folders": ["~/openbach/extra/stable/", "~/openbach/extra/experimental/"]}'
$ ansible-playbook install.yml -u exploit -e openbach_backend_admin_name=openbach -k -K
$ ansible-playbook install.yml --skip-tags configure_ntp_server
```

## Uninstalling an OpenBACH platform

Instructions for uninstalling OpenBACH are similar to those for installing it; except
that you need to run the `uninstall.yml` playbook instead.

Note that if you [added some Agents](/src/controller/README.md#manage-agents) after
the installation of the platform, you will need to add their IP address in your inventory
file as well to properly uninstall them. This `uninstall.yml` playbook is a shortcut to
bulk-uninstall a whole platform at once, it will **not** ask the Controller for the full
list of Agents before removing them.

Also note that, by default, databases content are left intact on the Controller (internal
SQL database storing projects, scenarios and so on) and the Collector (InfluxDB and
ElasticSearch). If you want to also remove these data, you will have to enable the
`openbach_clear_database` variable. Example:

```
$ ansible-playbook uninstall.yml -u exploit -k -K -e openbach_clear_database=yes
```

## Adding Jobs from External Sources

As you may have seen from the examples, the `openbach_jobs_folders` variable can be used to
provide a list of extraneous jobs to add into the controller. This can be particularly usefull
in conjunction with the [OpenBACH external jobs][11] repository, for instance. It is also
usefull if you are [|developping your own jobs](/src/jobs/README.md#developping-a-new-job)
and want to try them out in a real context.

You can also extend / limit the jobs that will be installed on the agents by the install
playbook. Use the `default_jobs` ansible variable to provide a list of the name of the
jobs that should be installed on the agents. Example:

```
$ ansible-playbook install.yml -u exploit -k -K -e '{"openbach_jobs_folders": ["~/openbach_extra/stable_jobs/", "~/jobs_devel/"], "default_jobs": ["iperf", "fping", "socat", "my_brand_new_job", "mptcp", "squid"]}'
```


[1]: https://docs.ansible.com/ansible/latest/index.html
[2]: http://www.paramiko.org/index.html
[3]: http://docs.ansible.com/ansible/latest/intro_getting_started.html#host-key-checking
[4]: http://docs.ansible.com/ansible/latest/intro_inventory.html#host-variables
[5]: https://docs.ansible.com/ansible/latest/user_guide/intro_inventory.html#splitting-out-host-and-group-specific-data
[6]: http://docs.ansible.com/ansible/latest/playbooks_variables.html#passing-variables-on-the-command-line
[7]: http://docs.ansible.com/ansible/latest/intro_inventory.html#list-of-behavioral-inventory-parameters
[8]: http://docs.ansible.com/ansible/latest/become.html#connection-variables
[9]: Topology.md#machine-dependencies
[10]: http://docs.ansible.com/ansible/latest/playbooks_tags.html
[11]: https://github.com/CNES/openbach-extra/tree/master/externals_jobs
