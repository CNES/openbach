#!/usr/bin/env python3

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

"""Sources of the Job d-itg_recv"""


__author__ = 'CNES'
__credits__ = '''Contributor: Guillaume Colombo <guillaume.colombo@cnes.fr>
              Matthieu Petrou <matthieu.petrou@viveris.fr>
              '''
import os
import sys
import syslog
import argparse
import traceback
import subprocess
import contextlib

import collect_agent

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

def main(log_buffer_size, signal_port=9000):
    if log_buffer_size:
        cmd = ['ITGRecv', '-Sp', str(signal_port), '-q', str(log_buffer_size)]
    else:
        cmd = ['ITGRecv', '-Sp', str(signal_port)]

    try:
        subprocess.run(cmd, stderr=subprocess.PIPE)
    except Exception as ex:
        message = 'Error running {} : {}'.format(cmd, ex)
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)


if __name__ == "__main__":
    with use_configuration("/opt/openbach/agent/jobs/d-itg_recv/d-itg_recv_rstats_filter.conf"):
        parser = argparse.ArgumentParser(description='Create a D-ITG command',
                                         formatter_class=argparse.ArgumentDefaultsHelpFormatter)
        parser.add_argument('-P', '--signal_port', type=int, metavar='SIGNAL PORT', default=9000,
                            help='Set port for signal transmission (default=9000)')
        parser.add_argument('-q', '--log_buffer_size', type=int, metavar='LOG BUFFER SIZE',
                            help='Number of packets to push to the log at once (Default: 50)')

        # get args
        args = parser.parse_args()
        log_buffer_size = args.log_buffer_size 
        signal_port = args.signal_port

        main(log_buffer_size, signal_port)
