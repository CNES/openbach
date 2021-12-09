# Backup & Restoration

## Backup

OpenBACH has the ability to create an archive file of the content of the databases and jobs
installed on a given machine. You will need to reuse the inventory file that you created to
install the platform, add any Agents installed afterwards and drop the ones you do not want to backup.

The `backup.yml` Ansible playbook can then be used to create an archive suitable to restore the
platform described by this inventory. There is no specific tags for this playbook and a single
variable is meant to be used to control its behavior: `openbach_backup_path`. This path can be
absolute or relative to the location of the playbook and is the path to where the archive should
be created. Examples:

```
$ ansible-playbook backup.yml
$ ansible-playbook backup.yml -u exploit -k -K
$ ansible-playbook backup.yml -u exploit -k -K -e openbach_backup_path=../../openbach_backup_2019_01_01.tar.gz
```

## Restore

Restoring a platform is a sub-behavior of installing a new one and is thus using the same `install.yml` playbook.

To restore a platform from an archive, you must:
  * use the `openbach_restore_archive` variable to indicate what data to restore from;
  * add a `[restore]` section in your inventory file to map old hosts to the new ones.

Example:
```
$ ansible-playbook install.yml -u exploit -k -K -i restore -e openbach_restore_archive=openbach_backup.tar.gz
```

where the `restore` inventory contains

``` ini
[agent]
172.20.0.8
172.20.0.9

[restore]
172.20.0.5 openbach_restore_host=172.20.0.1 openbach_backend_admin_name=openbach openbach_backend_admin_password=openbach
172.20.0.6 openbach_restore_host=172.20.0.2
172.20.0.7 openbach_restore_host=172.20.0.3
```

Every regular section will be installed as usual (such as the 2 Agents above) but the
machines in the `[restore]` section will be installed from the data of the specified host
found in the provided archive. You thus **need** to provide the `openbach_restore_host`
variable for each host in the `[restore]` section. Additionally, for each Controller that
you restore, you will **need** to provide the `openbach_backend_admin_name` and
`openbach_backend_admin_password` variables so databases can be altered to update the
addresses of the Agents being restored.
