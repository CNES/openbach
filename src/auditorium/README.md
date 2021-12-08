# Administrator Manual

This manual will detail administrative action of your OpenBACH platform that you can perform
through the Web Interface, such as:
- List, Add, and Remove agents;
- List, Add, and Remove jobs from the controller database;
- List, Add, and Remove collectors;
- Manage Users rights.

 Details of others capabilities of the Web Interface can be found
in the [user manual](ihm/README.md). You can also find the Command-Line Administrator Manual
in the [OpenBACH-extra project][1].

## Manage agents

When logged in as an administrative user, you have the ability to access the "Agent"
page through your user menu:

> :warning: By default the administrator login is "openbach" with password "openbach"

![manage agents](/documents/usage/admin/manage_agents.png)

In this page, you will see a summary of the agents of your OpenBACH platform as well as a
topology of which project an agent belong to.

You can check the status of an agent using the cloud icon associated to them (hollow red:
machine unreachable, solid orange: agent daemon unreachable, green checkmark: all good)
and a detailed description by clicking on it.

You will be able to modify (change its name, IP address, or associated collector) it, uninstall
it, or detach it by clicking on the respective buttons in the detailed description.

To install a new agent, or attach a detached autonomous agent, use the form on the right.

## Manage collectors

The Frontend is light on features related to the collectors. You will only be able to list
the installed collectors of your platform when in the "Agent" page:

![list collectors](/documents/usage/admin/list_collectors.png)

If you want to install a new collector or uninstall an existing one, use the
[auditorium scripts][1].

## Manage jobs

By clicking on the "Job" page of your user menu, you will be able to list the jobs
registered (added) in your controller:

![list jobs](/documents/usage/admin/list_jobs.png)

Using this page, you will be able to add jobs by:
  * clicking on the list on the left (external supported jobs) that are available in [the openbach-extra gitlab][2]
  * providing a compressed `.tar.gz` archive to add a new job.

When you click on a registered jobs, you can select/unselect the Agents where you want
to install/uninstall the job.

When jobs are already registered/added, this page automatically detects if a new version
of the jobs is available on [the openbach-extra project][2] and/or on [the openbach project][3].
If this is the case, when you select the job, you can update the version of the controller,
and then update/install the version on your Agents. Check [the developer manual](/src/jobs/README.md)
for more information on jobs versions.

> :warning: Each time a new **major version** of a job is added to the controller, the job will be
automatically uninstalled on all agent to avoid incompatibility issues with the scenarios.

Managing jobs further and removing them can also be done through the [auditorium scripts][2].

## Manage users

The last action you can perform as an administrator using the Frontend is to manage users
rights. Go to the "Manage Users" page of your user menu:

![list users](/documents/usage/admin/list_users.png)

And you will be able to change the permissions of a users by using the checkboxes on the right of their name.

You will also be able to select them using the checkbox on the left of their name and
delete all selected users in bulk.

These actions are unique to the Frontend and cannot be done using the auditorium scripts.

## Miscellaneous

On top of the regular actions of a user and these administrative actions, as an administrative
user, you will be able to see and interact with projects owned by other users.


[1]: https://github.com/CNES/openbach-extra/blob/master/apis/auditorium_scripts/README.md
[2]: https://github.com/CNES/openbach-extra/tree/master/externals_jobs/stable_jobs
[3]: https://github.com/CNES/openbach/tree/master/src/jobs/core_jobs
