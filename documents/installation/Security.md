# Security considerations

By default, an OpenBACH installation consider the target machines to be in a safe network and will
make some tradeoff of security for a better user experience: it will allow the controller to connect
to the agents using passwords without checking the remote host key fingerprint first. This may be a
security risk on vulnerable networks. But this allow the administrators of OpenBACH to add new agents
without much hassle.

If you deactivate this feature using `--skip-tags consider_safe_network` you will need to add each
agent fingerprint manually into the `~openbach/.ssh/known_hosts` file of the controller by either:
  * connecting to the agent via SSH using the `openbach` user (created by the
    installation process) on the controller;
  * running the `ssh-keyscan -H *ip_address* >> ~openbach/.ssh/known_hosts` command as root or openbach.

Deactivating this feature also removes the default username and password used to manage the
controller database. In such case, if you don't define the variables `openbach_backend_admin_name`
and `openbach_backend_admin_password`, they will __not__ be defaulted to `"openbach"`; making the
whole process fail at some point. You thus need to provide your own either using
[Ansible variables](Ansible.md#ansible-variables) or using a [Vault][1].


[1]: https://docs.ansible.com/ansible/latest/user_guide/vault.html
