# Job Developer Manual

## Choosing the name of the job: conventions

Proposed conventions:
  * If the job wraps/launches another tool/software: the job name should
    start with the name of the tool/software.
  * If the job only uses a subfunction of the tool or you want to highlight
    a property of the job, you can add it to the name of the job.
  * If you feel this convention is not adapted to your case, please contact
    the OpenBACH Team to get some advice.

## Writing the job

First off, you’ll need to write a program that perform the actions of your choice. In theory,
any programming language would do. In practice, jobs that emit statistics meant to be stored
in a collector should be written in Python or C++; this is because the `collect_agent` library
is written in C++ and only has Python bindings. This library is used to send statistics from
jobs to the rstats daemon which, in turn, will send them to the collector. Contributions are
welcome if you find the need for a binding with another programming language.

Your program will be invoked by the agent and parameters will be provided on the command line
(setting `argc` and `argv` in C and C++, or populating `sys.argv` in Python). You must parse
these inputs yourself and execute the associated actions.

If your program send statistics, you should call the `register_collect` function after parsing
your arguments. This function will return a boolean value indicating success upon contacting
the rstats daemon. Further uses of the library include the `send_stat` and `send_log` functions.

At any moment, if your program fails, you should follow unix conventions of returning a non-zero
status code. You may use `sys.exit` in Python to do so.

A toy example of Python job could look like:

``` python
import syslog
import argparse
from sys import exit
from time import time, sleep

import collect_agent


def build_parser():
    parser = argparse.ArgumentParser(description='Toy Program Example')
    parser.add_argument('interval', type=int, help='number of seconds between each statistic')
    parser.add_argument('-c', '--count', type=int, default=10, help='number of iterations')
    return parser


def timestamp():
    """Current timestamp in milliseconds"""
    return int(time() * 1000)


def main(interval, count):
    """Toy program body: emit count stats, one each interval seconds"""
    config_file = '/opt/openbach/agent/jobs/toy/toy_rstats_filter.conf'
    success = collect_agent.register_collect(config_file)
    if not success:
        message = 'Could not connect to rstats'
        collect_agent.send_log(syslog.LOG_ERR, message)
        exit(message)

    for i in range(count):
        if i:
            sleep(interval)
        collect_agent.send_stat(timestamp(), toy_statistic='spam')


if __name__ == '__main__':
    args = build_parser().parse_args()
    main(args.interval, args.count)
```

A common pattern, for jobs meant to send statistics is to check whether or not the connection
to rstats succeeded and, if not, fail with an error message; this behavior can be implemented
as follows:

``` python
@contextlib.contextmanager
def use_configuration(filepath):
    success = collect_agent.register_collect(filepath)
    if not success:
        message = 'ERROR connecting to collect-agent'
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)
    collect_agent.send_log(syslog.LOG_DEBUG, 'Starting job ' + os.environ.get('JOB_NAME', '!'))
    try:
        yield
    except Exception:
        message = traceback.format_exc()
        collect_agent.send_log(syslog.LOG_CRIT, message)
        raise
    except SystemExit as e:
        if e.code != 0:
            collect_agent.send_log(syslog.LOG_CRIT, 'Abrupt program termination: ' + str(e.code))
        raise
```

Usage being to wrap your entry point under a `with collect_agent.use_configuration(config_file)` statement.

## Adding metadata

Having written your job, you will need to tell a few informations about it to OpenBACH:

  * How to invoke it;
  * How to use it;
  * How to install it;
  * How to uninstall it.

The invokation and other metadata are to be defined in the job YAML file. This file should
have the following structure:

``` yaml
---

general:
  name: toy
  description:>
      This is a simple job aimed at describing OpenBACH syntax.
  job_version: '1.0'
  keywords:
    - toy
    - example
    - dummy
  persistent: no


platform_configuration:
  - ansible_system: 'Linux'
    ansible_distribution: 'Ubuntu'
    ansible_distribution_version: '20.04'
    command: '/usr/bin/env python3 /opt/openbach/agent/jobs/toy/toy.py'
    command_stop:


arguments:
  required:
    - name: interval
      type: int
      count: 1
      description: The interval in seconds between each statistic.
  optional:
    - name: count
      type: int
      count: 1
      flag: '-c'
      description: Stop after sending count statistics.


statistics:
    - name: toy
      description: Example statistic, the value is always "spam".
      frequency: every *interval* seconds
```

In this file, the `general` section is mandatory; the rest can be omitted depending on you needs. 

The version of an OpenBACH job is composed of a major and a minor component. For example,
a job version `2.3` has a major version equal to `2`, and a minor version equal to `3`. 

> :warning: **Major version** should be updated when important modifications have been
made on the job, or that can alter compatibility with existing scenarios, e.g.
  * Adding/removing jobs arguments
  * Blocking bug correction 
  * Big modification on the job (_e.g._ added a new mandatory argument)
  * If we consider, the other users should take profit of the update (ask the [mailing list][1] if you hesitate)

> :warning: **Minor version** number should be the one updated on the following cases:
  * Adding/removing a statistic
  * Small improvements/refactoring of the job
  * Minor corrections (minor bugs)

> :warning: Each time a new major version of a job is added to the controller, the job will
be automatically uninstalled on all agents.

In this section, the `persistent` entry describe the behavior of the job: set it to a falsey
value (`false`, `False`, `no`) for jobs that perform some action (optionally sending one or
several statistics doing so) and exit; set it to a truthy value (`true`, `True`, `yes`) for
jobs that keep running until explicitly stopped (by a signal or an external command). You might
find the `need_privileges` entry in some jobs in order to specify if the jobs need to be
launched with sudo privileges or not. However this entry is not yet activated (it has been
added for future evolutions of OpenBACH).

> :warning: All the jobs are launched with sudo privileges

The `platform_configuration` section describe OS on which this job can be installed and
how to invoke them on such OS. OpenBACH will check if the target agent meet the needs of
the job before installing it. You can put more than one entry in this list. The `command_stop`
entry is optional and (if set) will be called __instead of sending a signal__ to the job to
stop it (so it's more usefull for persistent jobs). When the `command_stop` is called, it is
called with the same arguments than those provided when starting the job.

The `arguments` section describe what kind of arguments the job expect. They are split into
mandatory and optional ones so OpenBACH can perform some error checking before trying to
start the job. See the [arguments section](#specifying-arguments) for more details.

>>>
:warning: Guidelines concerning the arguments names:
  * Do not add spaces in the name
  * Avoid special characters
  * Do not name arguments as keywords used in Python: 'False', 'await',
    'else', 'import', 'pass', 'None', 'break', 'except', 'in', 'raise',
    'True', 'class', 'finally', 'is', 'return', 'and', 'continue', 'for',
    'lambda', 'try', 'as', 'def', 'from', 'nonlocal', 'while', 'assert',
    'del', 'global', 'not', 'with', 'async', 'elif', 'if', 'or', 'yield'.
  * The arguments (and the statistics) must always begin with a letter.

We propose these recommendations 

If these guidelines are not followed, the jobs will work but it will be difficult
to use them in the [scenario_builder / helpers, etc][2].
>>>

Finally, the `statistics` section is only informational and describe which statistics
the callers of the job can expect.

After writing this description file, you must tell OpenBACH how to install your job on
an agent. Since OpenBACH uses [Ansible][3] to deploy a job, you must write a play that
will be included by the `install_job` playbook:

``` yaml
---

- name: Create the Toy Job Folder
  file: path=/opt/openbach/agent/jobs/{{ job_name }} state=directory mode=0755

- name: Install Toy Job
  copy: src={{ item.file }} dest=/opt/openbach/agent/jobs/{{ job_name }}/ mode={{ item.mode }}
  with_items:
    - { file: 'toy_rstats_filter.conf', mode: '0644' }
    - { file: 'toy.help', mode: '0644' }
    - { file: 'toy.py', mode: '0755' }
```

as well as a play to uninstall it


``` yaml
---

- name: Remove the Toy Job Folder
  file: path=/opt/openbach/agent/jobs/{{ job_name }} state=absent
```

> :warning: The install_<job_name>.yml and uninstall_<job_name>.yml will be run on the agent
under the `openbach` user. This user have sudo right so you can use `become: yes` in your
tasks if need be.

Finally, the fourth file you must create is a `README.md`. This file is important to tell other
users how to use the job, what it can do, its limitations and it proposes as well different examples.
It will be rendered in GitLab when the folder it's in is opened and, as such, we advise you put it
directly in the job's root folder. It has to follow the rules presented in [Formatting Syntax][4]
to be correctly displayed. Please, use the following structure:

~~~ markdown
# Job Description

The job toy does not do anything, except showing how to create a job.

## Examples

### Example 1

Launch the job with an interval of 1 second and 60 statistics measurements.

In the web interface, set the following parameters:

  * **interval** = 1
  * **count** = 60

Or launch the job manually from the Agent as follows:

```
JOB_NAME=iperf3 sudo -E python3 /opt/openbach/agent/jobs/toy/toy.py 1 -c 60
```

### Example 2

You can add as many examples as you want.

## Additional information

You can write here the limitations. 
~~~

These 4 files must follow the naming convention presented here: README.md, install_<job_name>.yml,
uninstall_<job_name>.yml and <job_name>.yml. Besides, the job description files **must** be in a
`files` folder next to the install and uninstall files. The layout of the toy job folder look like:

```
toy
 + files
 |  + toy.py
 |  + toy.yml
 |  + toy_rstats_filter.conf
 + README.md
 + install_toy.yml
 + uninstall_toy.yml
```

To finish with metadata, the `toy_rstats_filter.conf` file contains informations about how to
handle a statistic generated by the job. Its content must look like:

``` ini
[default]
storage=true
broadcast=false
```

Where you can tweak `true` and `false` values. You can name this file however you want, install
it wherever you want, as long as you specify its full path to the `collect_agent.register_collect` call.

## Specifying Arguments

The `arguments` section is composed of a dictionary having the following 3 optional entries:
  * `required`: a list of positional arguments. The order in which the arguments are
    described here correspond to the order in which they will be sent to the job.
    Trying to start a job without specifying all of its required arguments fails.
  * `optional`: a list of optional arguments. Optional arguments have no implicit ordering
    and are sent to the job only if a value is provided for them.
  * `subcommand`: a list of additional alternative actions. Subcommands are meant to handle
    the [equivalent feature of the `argparse` Python parser][5].

### Required arguments

A required argument have the following attributes:

| Attribute Name | Required | Default Value | Description |
| ---            | :---:    | ---           | ---         |
| name | :white_check_mark: | | Name of the argument for OpenBACH. Use this name in the JSON of a request to specify a value when starting the job. |
| type | :white_check_mark: | | Type of the argument, validated by OpenBACH when starting a job or saving a scenario. Valid types are int, str, float, ip, job, and scenario. |
| count | :white_check_mark: | | The number of values required for this argument. Can be a single interger, a range (_e.g._ '2-4'), '+', or '\*'. |
| description | :negative_squared_cross_mark: | "" | A helper description displayed in the OpenBACH frontend when configuring this job in a scenario. |
| password | :negative_squared_cross_mark: | False | A helper field indicating to the OpenBACH frontend that the field should be rendered with a password type. |
| choices | :negative_squared_cross_mark: | None | A list of acceptable values for the argument. Values outside of this list will be rejected by OpenBACH. The frontend will provide a select field with these values to choose from. |

### Optional arguments

An optional argument have the following attributes

| Attribute Name | Required | Default Value | Description |
| ---            | :---:    | ---           | ---         |
| name | :white_check_mark: | | Name of the argument for OpenBACH. Use this name in the JSON of a request to specify a value when starting the job. |
| type | :white_check_mark: | | Type of the argument, validated by OpenBACH when starting a job or saving a scenario. Valid types are int, str, float, ip, None, job, and scenario. |
| flag | :white_check_mark: | | The name of the command-line switch used by the job to accept this argument. |
| count | :white_check_mark: | | The number of values required for this argument. Can be a single interger, a range (_e.g._ '2-4'), '+', or '\*'. This value is ignored if the type of the argument is 'None'. |
| repeatable | :negative_squared_cross_mark: | False | Whether or not the job accept several use of this argument. Most common example being a verbose switch that can be activated multiple times: '-v', '-v -v', or '-vvv'. |
| description | :negative_squared_cross_mark: | "" | A helper description displayed in the OpenBACH frontend when configuring this job in a scenario. |
| password | :negative_squared_cross_mark: | False | A helper field indicating to the OpenBACH frontend that the field should be rendered with a password type. |
| choices | :negative_squared_cross_mark: | None | A list of acceptable values for the argument. Values outside of this list will be rejected by OpenBACH. The frontend will provide a select field with these values to choose from. |

### Subcommand arguments

Subcommands are sections that define a list of potential additional arguments. Subcommands
define groups that each define a list of arguments section. When a section is selected for
a given group, only arguments of said section are considered for launching the job.

| Attribute Name | Required | Default Value | Description |
| ---            | :---:    | ---           | ---         |
| group_name | :white_check_mark: | | Name of the subcommand group for OpenBACH. Use this name in the JSON of a request to specify a value when starting the job. |
| choices | :white_check_mark: | | A list of arguments sections that are suitable for this subcommand group. |
| optional | :negative_squared_cross_mark: | False | Whether or not the job requires a value (and required arguments, if any) for this group. |

#### Subcommand choice arguments

The choice argument of a subcommand group contains the same kind of entries than the `arguments`
section: the `required`, `optional`, and `subcommand` entries described above. In addition to
these optional entries, a subcommand group choice argument **must** define a `name` entry that
will be value provided to the job when this group is selected.

### Example

See the content of the configuration file for the [iperf3](core_jobs/metrology/iperf3/files/iperf3.yml)
job for an example using most of these capabilities.

## Installing a job

Installing a job can be done through:
  * a Web Interface (see the "Manage jobs" section of the [[openbach:manuals:2.x:administrator_manual:web_interface:index|Web Interface Administrator Manual]])
  * a Command Line Interface (see the [[openbach:manuals:2.x:administrator_manual:command_line_interface:index|Command Line Interface Administrator Manual]])

## Debugging

### Debugging the installation of job

To test and debug a job, it is recommended you install it on an agent (to check that the
install play is understood correctly) and start it manually. Doing so, the statistics
emitted by the job will be gathered under the `job_debug` measurement on the collector
with a `job_instance_id`, `scenario_instance_id` and `owner_scenario_instance_id` of 0. You
can tweak these values by using the following environment variables:

  * `JOB_NAME`
  * `JOB_INSTANCE_ID`
  * `SCENARIO_INSTANCE_ID`
  * `OWNER_SCENARIO_INSTANCE_ID`

Example:

```
$ JOB_NAME=toy JOB_INSTANCE_ID=12 SCENARIO_INSTANCE_ID=42 OWNER_SCENARIO_INSTANCE_ID=42 python3 /opt/openbach/agent/job/toy/toy.py -c 50 2
```

### Debugging an installed job

You can directly edit the job in the `/opt/openbach/agent/jobs/` folder of the agent on which the job is installed.

#### Miscellaneous

OpenBACH specific structure around Ansible invokation make it rather tedious to use the
[synchronize module][6]. More details are available on the associated [Github issue][7].
A simple wrapper module, named `openbach_synchronize` is available to easily provide
relative path within the `files` folder of a job; this wrapper takes the exact same
arguments than the original `synchronize` module.


[1]: users@openbach.org
[2]: https://github.com/CNES/openbach-extra/tree/master/apis/scenario_builder
[3]: http://docs.ansible.com/ansible/latest/playbooks.html
[4]: https://docs.gitlab.com/ee/user/markdown.html
[5]: https://docs.python.org/3/library/argparse.html#sub-commands
[6]: http://docs.ansible.com/ansible/latest/synchronize_module.html
[7]: https://github.com/ansible/ansible/issues/26586
