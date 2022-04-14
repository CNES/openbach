# Using proxies

The installation playbook make use of some `apt` and `pip install` commands that, more often
than not, will retrieve data over the Internet. If (some of) your target machines access the
internet through a proxy, the playbook have the ability to override the values of their
`HTTP_PROXY` and `HTTPS_PROXY` environment variables.

Two options are possible:
  * set the value of the `HTTP_PROXY` and/or `HTTPS_PROXY` environment variable on
    the install machine when launching the playbook: this will set these values on
    all target machines during the installation;
  * use the `openbach_http_proxy` and/or `openbach_https_proxy` ansible variables
    on a per-host basis; see [controlling the installation with variables](Ansible.md#ansible-variables)
    for more details.

In both cases, if only the value for the HTTP proxy is specified, this same value
will be used to populate the `HTTPS_PROXY` environment variable on the target machines.

If your proxy installation needs a password, you might want to use an ansible vault so the password 
isn't in plain text in the command line. In order to do this:
  * Create a vault file inside the `ansible/group_vars` folder: `ansible-vault create vault.yml`
  * Populate the vault file with:
    * A triple dash (`---`)
    * `vault_openbach_http_proxy: http://user:password@proxy.url:port/` 
    * `vault_openbach_https_proxy: https://user:password@proxy.url:port/`
  * Modify the `ansible/group_vars/all` file adding two variables at the end:
    * `openbach_http_proxy: "{{ vault_openbach_http_proxy }}"` 
    * `openbach_https_proxy: "{{ vault_openbach_https_proxy }}"`
  * Launch the ansible playbook using the following command 
    * `ansible-playbook -i inventory/inventory install.yml -u user -k -K -e @group_vars/vault.yml --ask-vault-pass`

