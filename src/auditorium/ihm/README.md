# User Manual

This manual will detail how to use OpenBACH through the Web Interface.
OpenBACH can also be used through Command-Line. More details on the Command-Line User Manual can be found in the [OpenBACH-extra project][1].

Using the Web Interface of OpenBACH, you can:
  * List, Create, and Delete projects;
  * List, Create, Manage, and Delete entities;
  * List, Create, and Delete scenarios;
  * List, Start, and Stop scenario instances;
  * Visualize and Export statistics of scenario instances;
  * Start and Stop jobs on agents.

## Reaching the Web Interface

To reach OpenBACH Web Interface (frontend), browse to the IP address of one of your
auditoriums: [http://<auditorium_ip>](). You should land on the project page that ask
you to authenticate if you're not already:

![authenticate](/documents/usage/user/authenticate.png)

If you do not have a registered user yet, or don't want to authenticate, hit the
"Stay Anonymous" button. Note that you will be limited to browsing public projects only
and that your available actions will be restricted to launch scenario instances and
explore data of past instances. You can create a new user using the user menu on the
top-right of the screen; but you will need to reach out to your OpenBACH administrator
(or check the [admin manual](/src/auditorium/README.md) if you are the administrator) in order to
get the account activated.

![create user](/documents/usage/user/create_user.png)

## Managing projects

Once connected, the project page will show you the list of your own private projects alongside the public ones:

![list projects](/documents/usage/user/list_projects.png)

From there, you have several actions possible:

  * **Create** a new, empty, project
  * **Import** an external project from a JSON file
  * **Manage** existing projects:
    * **Delete** a project by clicking on the red trash icon
    * **Download** a JSON file containing all the information, in order to share it
    * **Explore** a project by clicking on its name

When you explore a project, you reach the following page:

![project description](/documents/usage/user/project_description.png)

From this page, you can manage your project:
  * The **Add Entity** form, **Hidden Networks** selector, and **Refresh Topology** button will
    be discussed in the [entities section](#managing-entities-and-network-topology) below
  * The **Project Owners** selector allow you to share a private project with other people. Be
    aware that removing yourself from this list may signify that you won't be able to access
    this project again. You can also turn the project from private to public by clearing each
    entry in this list
  * The **Fetch NTP Offset** button will retrieve NTP information for each entity of your
    project. It is not performed automatically as the operation may be expensive depending
    on how many agents are associated to your project
  * The **Download Project**  will prompt you to download the project's JSON for sharing purposes
  * The **Edit Project** button opens a live editor of the JSON of the project; for ad-hoc modifications
  * The **Delete Project** button prompts you for its removal from the OpenBACH database

## Managing entities and network topology

From the **PROJECT** tab, you can create and manage entities. An entity is an abstraction
of a machine in your OpenBACH installation. You can associate entities to agents, either when
creating an entity or at a later point.

Each time an entity is added, modified or deleted, the network topology is rebuilt by OpenBACH
from the interfaces found on the agents' physical machines. A detailed view of the topology
is present at the bottom of a project description page:

![topology](/documents/usage/user/topology.png)

In the topology area, you can click on all the elements shown, to display information on the right pane:
  * If you click on an entity, you will see:
    * Which agent (if any) is associated to the entity and change it at will. Information about
      the associated machine is displayed (OS, interfaces, etc.)
    * Which jobs are installed on this agent (if any). You can install new ones or uninstall existing ones
    * NTP status if it has been fetched have been fetched
    * A button to remove the entity. Note that this will not remove the associated agent from the
      OpenBACH platform
  * If you click on a network, you will see:
    * A field to add a descriptive name
    * A button to hide it in the topology, if it does not play a role in your use of the platform
  * If you click anywhere else, or on the blue `x` icon at the top-right of an entity or
    network card, you will close the selected node and get the **Add Entity** form back.

> :warning: Note that when importing projects, imported networks will limit what kind of
agent you can associate to your entities.

> :memo: You can also show hidden networks from the **Hidden Networks** selector: remove
the ones that should stay hidden from the list and click the **Show** button.

## Managing scenarios

By clicking on the **SCENARIO** tab, you will be able to see a list of all defined scenarios of your project:

![list scenarios](/documents/usage/user/list_scenarios.png)

From there, you can do the following actions:
  * **Create** a new, empty, scenario
  * **Import** an existing scenario form a JSON file (if you want to use [reference scenarios][2],
    it is advised to build a JSON file with the [executors][3])
  * Manage existing scenarios:
    * **Launch** a scenario by clicking on the green arrow on the left of its name
    * **Delete** a scenario by clicking on the red trash icon on the right of its name
    * **Edit** a scenario by clicking on its name. It will open it in the last tab, that
      takes the name of the scenario

The scenario editor looks as follows:

![build scenario](/documents/usage/user/build_scenario.png)

On the right side of the page, you can see the list of the scenarios instances bound to this
scenario. More on [scenarios instances](#managing-scenarios-instances) in a next section.

On the top left side, you have the management section of the scenario. Several options are available:
  * **Add** a scenario to your favorites, to have it in the top of the list of jobs in the SCENARIO tab
  * **Edit** a scenario to edit directly the JSON associated to this scenario in a new window.
    Do not forget to submit the changes before closing the window
  * **Download** the JSON file of the scenario
  * **Save** your modifications
  * **Launch** a new scenario instance. If your scenario defines some arguments, you will be
    prompted for their values before being able to launch it

More information on the edition of scenarios are given in section [editing a scenario](#editing-a-scenario).

### Editing a scenario

The editor is limited to a subset (the most common) of all possible actions (named OpenBACH
functions) in a scenario. If you have more needs for your scenario, you will need to build
the associated JSON yourself and send it; either by pasting it in the JSON editor or by
[using the auditorium scripts][1].

The top part of the editor will let you add or remove constants or arguments for your scenario.
They are a good way to factor out common information that you can feed as arguments to the
`start_job_instance` OpenBACH function.
  * A **constant** is a name associated to a value that you feed right away
  * An **argument** is a name associated to a value that you will populate
    when starting the scenario

To use these values, just use `${NAME}` anywhere you want them to appear in the
`start_job_instance` arguments; where `NAME` is the name of the argument / constant.

> :warning: You need to use your arguments and constants in your OpenBACH functions to be able to
save your scenario. If you only define an argument or a constant without using it in a function,
the save will fail.

Below is the OpenBACH function selector. The available actions are:
  * Add a new function by clicking on the `+` icon
  * Delete an existing one by clicking on its associated trash icon
  * Edit an existing function by expanding its internal state

For each OpenBACH function, you will need to provide the associated action and to fill in their
parameters. Each function has its own set of parameters that are described below; but some fields
are common to all functions:
  * **label**: add or change the name of the function.
  * Select an OpenBACH function. You can do the following actions:
    * `start_job_instance`: the additional arguments are: a job name, an entity to run this job
      on, an offset to delay the start of the job, and the arguments associated to the job.
    * `stop_job_instances`: you need to add a list of label associated to `start_job_instance`
      OpenBACH functions. This will stop the selected instances.
    * `start_scenario_instance`: you need to chose the scenario to start, and its associated
      arguments if there are some
    * `stop_scenario_instance`: it will stop one scenario instance previously launched
      using `start_scenario_instance`
  * Add scheduling options:
    * `Wait for Started`: a list of other OpenBACH functions (selected by label)
      that must be completed before this one starts
    * `Wait for Finished`: a list of other `start_job_instance` or `start_scenario_instance`
      OpenBACH functions (selected by label); each job/scenario started by these functions
      must reach completion before this function starts
    * `Waiting time`: an amount of time, in seconds, to wait, when the function starts,
      before executing its action

> A typical use case would be to have a "server" job started with a `start_job_instance`,
several other "client" jobs started with a `start_job_instance` configured with `wait for started`:
"server" and a `waiting time` of say 5 seconds, and a last `stop_job_instance` function that stop
the "server" job configured with `wait for finished`: "each client".

> Another use case is to start a persistent job using a `start_job_instance` and to associate
a `stop_job_instance` that stops this job X seconds after it started. You can configure the
`stop_job_instance` using `wait for started` and a `waiting time` of X seconds.

## Managing scenarios instances

Once you launched a Scenario, a new scenario instance will be visible in the **INSTANCES**
tab and the associated scenario editor tab. By clicking on this instance, you will be able
to follow the execution of the scenario. A lexicon of the various icons is available in
the **HELP** menu:

![scenario icons](/documents/usage/user/scenario_icons.png)

A running scenario instance item also provide a red "Stop" icon on its right in case you
need to stop it manually, earlier than its scheduled end.

When clicking on a scenario instance, you will be able to perform 4 distinct actions:

![scenario instance](/documents/usage/user/scenario_instance.png)

  * **Delete** and **Export to CSV** are pretty self explanatory, however they only apply on stopped scenarios
  * **Show logs** will open a kibana dashboards where logs from jobs are filtered for instances
    of this scenario only
  * **Show statistics** will open a grafana dashboad where statistics from jobs of this scenario
    are displayed. You will be prompted beforehand for the data that you are interested in.


[1]: https://github.com/CNES/openbach-extra
[2]: https://github.com/CNES/openbach-extra/tree/master/apis/scenario_builder/scenarios
[3]: https://github.com/CNES/openbach-extra/tree/master/executors/references
