#!/usr/bin/env python3

# OpenBACH is a generic testbed able to control/configure multiple
# network/physical entities (under test) and collect data from them. It is
# composed of an Auditorium (HMIs), a Controller, a Collector and multiple
# Agents (one for each network entity that wants to be tested).
#
#
# Copyright © 2016-2023 CNES
#
#
# This file is part of the OpenBACH testbed.
#
#
# OpenBACH is a free software : you can redistribute it and/or modify it under
# the terms of the GNU General Public License as published by the Free Software
# Foundation, either version 3 of the License, or (at your option) any later
# version.
#
# This program is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY, without even the implied warranty of MERCHANTABILITY or FITNESS
# FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
# details.
#
# You should have received a copy of the GNU General Public License along with
# this program. If not, see http://www.gnu.org/licenses/.


"""Sources of the Job iptables"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * David PRADAS <david.pradas@toulouse.viveris.com>
'''

import sys
import syslog
import argparse
import subprocess

import collect_agent


def run_command(rule):
    """ Run a command, return error """
    cmd = ['iptables', *rule]
    try:
        p = subprocess.run(cmd, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError as ex:
        collect_agent.send_log(syslog.LOG_ERR, "Error when executing command {}: {}".format(cmd, ex))
    if p.returncode:
        message = 'WARNING: {} exited with non-zero return value ({}): {}'.format(cmd, p.returncode, p.stderr.decode())
        collect_agent.send_log(syslog.LOG_WARNING, message)
        sys.exit(0)


def main(rule):
    collect_agent.send_log(syslog.LOG_DEBUG, 'Starting iptables job with rule: iptables {}'.format(rule))
    run_command(rule)


if __name__ == '__main__':
    with collect_agent.use_configuration('/opt/openbach/agent/jobs/iptables/iptables_rstats_filter.conf'):
        # Define Usage
        parser = argparse.ArgumentParser(
                description=__doc__,
                formatter_class=argparse.ArgumentDefaultsHelpFormatter)
        parser.add_argument(
                'rule', nargs=argparse.REMAINDER,
                help='The rule to apply. e.g.: -A INPUT -p tcp -m tcp --dport 80 -j ACCEPT')

        # get args
        args = parser.parse_args() 
        main(args.rule)
