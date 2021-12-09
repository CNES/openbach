# Developer Manuals

There are multiple developer manuals that are detailed in this page. 

If you want to contribute to OpenBACH, you will have to follow some guidelines. This document
will guide through various development processes.
  * Introduction to [OpenBACH-extra][1] and [OpenBACH API][2]
  * [Job Developer Manual](jobs/README.md)
  * [Scenario Developer Manual][3]
  * [Core Developer Manual](controller/README.md)
  * [Agent Developer Manual](agent/README.md)

**At any step of your development process, do not hesitate to contact
the OpenBACH team through the available [mailing list][3].**

## Contributing to jobs/helpers/scenarios/executors

If you have developed your own jobs/helpers/scenarios/executors and wish to have
them included as reference and maintained by the OpenBach team, please follow these steps:
  * Test your contributions on an OpenBACH platform;
  * Include the standard licence header in your contributed files;
  * Agree to and sign the [INDIVIDUAL CONTRIBUTOR AGREEMENT FOR OpenBACH][5];
  * Create a git branch off the [dev branch][6] and commit your work there;
  * Create a merge request of this branch into `dev`.

Do not hesitate to contact the OpenBACH team through the [mailing list][4] to ensure the
correct localization of your contributions.

## Contributing to the core of OpenBACH

Please get in touch with the maintainers using the [mailing list][4] before being able to create a merge request.

## Modifying Django's Models

When changing Django's models, do not forget to [create migrations][7] so the install process
is aware of the changes. Pay extra attention to how you create your fields as the database
may already contain some data.

For instance, if you are creating a required field on a model, you must either:
  * provide a default value for the field; or
  * populate the field from other values in the database using a [data migration][8].

When creating a data migration, it is a 3 step process:
  * create an initial migration with your field allowing empty values (`null=True`);
  * write the data migration as a function to be passed to [RunPython][9];
  * alter the field to disallow empty values (remove `null=True`) and squash the 3 migrations into a single file.

An example of this use case can be found in
[migration #6](controller/backend/openbach_django/migrations/0006_upgrade_push_file.py)
where the required fields `users` and `groups` were added.

## Debugging a Platform

The components of a platform are started by the `openbach` agent. To mimic the behaviour
and make sure you have the proper rights to use the files you must first become the
`openbach` user using something like:

```
$ sudo su - openbach
```

### On the controller

You must first stop the running instance of the conductor (the brain component of the controller):

```
# systemctl stop openbach_conductor.service
```

You may edit `/opt/openbach/controller/conductor/openbach_conductor.py` to add debug statements as needed.

You can launch the conductor in debug mode using:

```
$ PYTHONPATH=/opt/openbach/controller/backend/ python3 /opt/openbach/controller/conductor/openbach_conductor.py
```

You can do the same with the director service (the component responsible for managing scenario instances):

```
# systectl stop openbach_director.service
$ PYTHONPATH=/opt/openbach/controller/backend/ python3 /opt/openbach/controller/conductor/openbach_director.py
```

You can also use Django's management file to access the content of the database:

```
$ cd /opt/openbach/controller/backend
$ ./manage.py shell
```

### On the agent

You must first stop the running instance of the agent:

```
# systemctl stop openbach_agent.service
```

You may edit `/opt/openbach/agent/openbach_agent.py` to add debug statements as needed.

You can launch the agent in debug mode using:

```
$ python3 /opt/openbach/agent/openbach_agent.py
```

[1]: https://github.com/CNES/openbach-extra
[2]: https://github.com/CNES/openbach-extra/tree/master/apis
[3]: https://github.com/CNES/openbach-extra/tree/master/apis/scenario_builder/scenarios
[4]: http://openbach.org/content/mail.php
[5]: http://openbach.org/content/agreement.php
[6]: https://github.com/openbach-extra/tree/dev
[7]: https://docs.djangoproject.com/en/3.0/topics/migrations/
[8]: https://docs.djangoproject.com/en/3.0/topics/migrations/#data-migrations
[9]: https://docs.djangoproject.com/en/3.0/ref/migration-operations/#django.db.migrations.operations.RunPython
