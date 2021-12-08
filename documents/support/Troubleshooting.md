# Troubleshooting

This page contains some common problems and steps to resolve them.

Be careful to have a good understanding of your tested testbed before to install OpenBACH. 
There usually is many problems of system integration: ansible version (be really careful
about python dependencies), proxy misconfiguration, network configuration. 

## Proxy problem

Be careful to not have many configurations on your system (`http_proxy` variable,
configuration in OpenBACH, configuration through global graphical proxy on some
Linux distributions). They can lead to broken OpenBACH configuration. 

OpenBACH is dependent on Internet access and it has to be well configured.

## Workaround to start more than 10 job instances in an Agent

**Allows to bypass openbach issue #77**

When starting more than 10 job instances on the same Agent, instances started
after the 10th one will immediately come to a stop and further stop job instances
won't work either.

This seems to be related to APScheduler defaults of using a thread pool of 10 workers
to fire scheduled tasks. Increasing the amount of workers or switching to a new way of
managing started jobs (such as using the ProcessPoolScheduler) is required to handle a
larger amount of tasks per agent at once. In this section, we propose a workaround in
the agent code source allowing to temporally launch more than 10 job instances.

  * In your Agent machine, go to `/opt/openbach/agent/openbach_agent.py` and add:
    `from apscheduler.executors.pool import ThreadPoolExecutor`
  * In the same file, line 106 replace: 
    `self.scheduler = BackgroundScheduler()` by
    `self.scheduler = BackgroundScheduler(executors={'default': ThreadPoolExecutor(YOUR_MAX_NUMBER_OF_INSTANCES)})`
    where `YOUR_MAX_NUMBER_OF_INSTANCES` is higher than the number of parallel
    jobs you need to launch on the same Agent.
  * restart the agent:

```
$ sudo systemctl restart openbach_agent.service
```
