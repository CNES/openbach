#  NTP synchronization

All the agents use the `ntpd` (NTP) service to synchronize their date/time with their associated
controller; and the controller synchronizes its time with external servers. This configuration
is performed semi-automatically during the installation of OpenBACH but can be adapted in various ways.

By default, the installation playbook will ask for a server to synchronize the controller to. If
the default NTP configuration of your Contoller machine is suitable to you, you can either press
enter or type `keep` when prompted for this server to keep the NTP configuration untouched. If
you are annoyed by the question and want to keep the default behavior of synchronizing the Agents
with the controller, you can disable the question prompt using the `--skip-tags questions` option
of the `ansible-playbook` command.

In case you don't want to alter the NTP configuration on any machine at all, you can disable NTP
configuration using the `--skip-tags configure_ntp_server` option of the `ansible-playbook` command.

In any case, the install process always make a backup of an existing `/etc/ntp.conf` file before
overwritting it, so you can perform an install of an entire platform and revert back the NTP
configuration on any machine in case the default servers does not suit your needs. This is
especially important on some virtual environment such as OpenStack where the NTP packets to
external services are filtered and you must synchronize using their own ntpd servers.
