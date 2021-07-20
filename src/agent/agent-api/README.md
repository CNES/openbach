# Stand-alone Agent Manual

The current page explains how to use the Agent API found in this directory.

You can launch the help of the Agent API with `python3 agent_api.py -h` to see the following options:

```
usage: agent_api.py [-h] [-p PORT] agent action ...

OpenBACH's agent API

positional arguments:
  agent                 IP address of the agent
  action                the action to run on the agent
    start_job           start a job instance
    stop_job            stop a job instance
    restart_job         restart a job instance
    job_status          get the status of a job instance
    list_jobs           list the installed jobs
    restart_agent       restart the agent
    check_connection    check the agent is alive
    assign_collector    change the collector an agent is sending stats to
    dump_into_collector
                        send stats and logs from an agent to a collector

optional arguments:
  -h, --help            show this help message and exit
  -p PORT, --port PORT  port of the agent (default: 1112)
```

You should at least specify and agent IP address and chose one of the options to see the arguments.

## Start/stop/status of jobs instance

For example, go the the help of the `start job instance` option as follow
`python3 agent_api.py *agent_ip* start_job -h`. The help will tell you that
it is necessary to pass the name of the job, and optionally a job ID, date
of execution, interval and the arguments of the job. For example to launch
the job fping (10 ICMP packets to 8.8.8.8 with and an interval of 500ms
between packets) at a specific date and then every 20 seconds, you should do
as follows:

```
python3 agent_api.py *agent_ip* start_job fping -i 12345 -d 2019-04-03 14:30:00.000 -t 20 -a '8.8.8.8,-c,10,-i,500'
```

After that you can check if the job is `'Running'` or `'Scheduled'`:

```
python3 agent_api.py *agent_ip* job_status fping 12345
```

Then stop it:

```
python3 agent_api.py *agent_ip* stop_job fping 12345
```

And check again the status (it should be `'Stopped'`).

## Check Agent

You will be able to check if an agent is alive/reachable with the `check_connection` option:

```
python3 agent_api.py *agent_ip* check_connection
```

If `'None'` value is returned, everything is ok. If the machine is not reachable, it
will return the message `'agent_api.py: error: unable to communicate with agent on 172.20.34.99:1112`'.
If the machine is reachable but the agent is not running, it will return the previous
message and something like `'OSError: [Errno 107] Transport endpoint is not connected'`. 

## Assign Collector to an Agent

You can also assign a new collector to a Stand-alone agent. From the moment you assign a new
collector, the Agent will send the stats/logs to this new Collector (but not the past stats/logs)

```
python3 agent_api.py *agent_ip* assign_collector *collector_ip*
```

## Dump stats/logs to a Collector

If you need to get the stats/logs from a Stand-alone agent to your OpenBACH platform
(_i.e._ your collector), you lust use the `dump_into_collector` option from a specific date as follows:

```
python3 agent_api.py *agent_ip* dump_into_collector *collector_ip* 2019-04-03 14:56:00.000
```

This commands will dump collected data from the given date until now.
