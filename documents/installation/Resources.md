# Physical Resources Check before Installation

## Requirements

On the controller:

 * Disk >= 30Gb
 * Ram >= 4Gb
 * CPU >= 2
 * Default route defined (IPv4 or IPv6)

On the agents:

 * Disk >= 15Gb
 * Ram >= 1Gb
 * CPU >= 1
 * Default route defined (IPv4 or IPv6)

## Checks

The `check_resources` Ansible tag will scan the gathered informations about remote hosts to warn
you if one or several machines you are trying to install OpenBACH into does not meet the criterion.
You will be prompted to continue or abort the installation, unless all the machines meet the
requirements.

You can disable this behaviour by using the Ansible command-line option `--skip-tag check_resources`.
