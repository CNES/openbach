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
