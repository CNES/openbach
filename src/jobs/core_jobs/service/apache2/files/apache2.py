#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# OpenBACH is a generic testbed able to control/configure multiple
# network/physical entities (under test) and collect data from them. It is
# composed of an Auditorium (HMIs), a Controller, a Collector and multiple
# Agents (one for each network entity that wants to be tested).
#
#
# Copyright © 2016-2020 CNES
#
#
# This file is part of the OpenBACH testbed.
#
#
# OpenBACH is a free software : you can redistribute it and/or modify it under
# the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or (at your option)
# any later version.
#
# This program is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY, without even the implied warranty of MERCHANTABILITY or
# FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# this program. If not, see http://www.gnu.org/licenses/.


"""Sources of the Job apache2"""

__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Francklin SIMO <francklin.simo@viveris.fr>
 * Bastien TAURAN <bastien.tauran@viveris.fr>
'''

import os
import sys
import time
import signal
import syslog
import argparse
import traceback
import subprocess
import contextlib
import collect_agent


HTTP_PORT = 8081
HTT2_PORT = 8082
STOP_JOB = False

DESCRIPTION = ("This job launchs the web server apache2 that provides " 
               "HTTP services in standard http/1.1 and http2 on ports {} and {} "
               "respectively").format(HTTP_PORT, HTT2_PORT)


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


def stop(signalNumber, frame):
    """
    Stop apache2
    Args: 
    Returns:
       NoneType
    """
    cmd = ["systemctl", "stop", "apache2"]
    global STOP_JOB
    try:
        p = subprocess.Popen(cmd, stderr=subprocess.PIPE)
        STOP_JOB = True
    except Exception as ex:
        message = "Error when stopping apache2: {}".format(ex)
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)

    
def start():
    """
    Start apache2 which will listen http/1.1 requests on port 8081 and http2 on port 8082
    Args:
    Returns:
        NoneType
    """

    cmd = ["systemctl", "is-active", "apache2"]
    try:
        p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
        line = p.stdout.readline().decode()
        if "inactive" in line:
            cmd = ["systemctl", "start", "apache2"]
            p = subprocess.Popen(cmd, stderr=subprocess.PIPE)
        else:
            message = "An Apache instance is already running, stopping this instance"
            collect_agent.send_log(syslog.LOG_ERR, message)
            return

    except Exception as ex:
        message = "Error when starting apache2: {}".format(ex)
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)
    
    # Set signal handler
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    # Wait for status to change to active
    cmd = ['systemctl', 'show', '-p', 'SubState', '-p', 'ActiveState', 'apache2']
    global STOP_JOB
    while True:
        time.sleep(0.5)
        status = subprocess.run(cmd, stdout=subprocess.PIPE)
        output = status.stdout.decode()
        if not 'SubState=running' in output:
            if not STOP_JOB:
                message = "Apache2 stopped abnormally : {}".format(output)
                collect_agent.send_log(syslog.LOG_ERR, message)
                sys.exit(message)
            else:
                return


if __name__ == "__main__":
    with use_configuration('/opt/openbach/agent/jobs/apache2/apache2_rstats_filter.conf'):
        # Argument parsing
        parser = argparse.ArgumentParser(description=DESCRIPTION, 
                     formatter_class=argparse.ArgumentDefaultsHelpFormatter
        )
         
        start() 
