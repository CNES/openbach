#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# OpenBACH is a generic testbed able to control/configure multiple
# network/physical entities (under test) and collect data from them.
# It is composed of an Auditorium (HMIs), a Controller, a Collector
# and multiple Agents (one for each network entity that wants to be
# tested).
#
#
# Copyright © 2016-2023 CNES
#
#
# This file is part of the OpenBACH testbed.
#
#
# OpenBACH is a free software : you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY, without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
# General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see http://www.gnu.org/licenses/.

"""Collect-Agent API

Collection of tools aimed at OpenBACH agents to send informations
such as logs, files or statistics to their collector.
"""


from setuptools import setup, Extension


MAJOR_VERSION = '2'
MINOR_VERSION = '2'
DEBUG_VERSION = '0'


collect_agent = Extension(
        'collect_agent._collect_agent',
        define_macros=[
            ('MAJOR_VERSION', MAJOR_VERSION),
            ('MINOR_VERSION', MINOR_VERSION),
            ('DEBUG_VERSION', DEBUG_VERSION)],
        libraries=['collectagent'],
        sources=['collectagentmodule.cpp'],
        extra_compile_args=['-std=c++11'])


setup(name='collect_agent',
      version='{}.{}.{}'.format(MAJOR_VERSION, MINOR_VERSION, DEBUG_VERSION),
      description='Collect-Agent API',
      long_description=__doc__,
      author='Viveris Technologies',
      author_email='mettinger@toulouse.viveris.com',
      url='https://openbach.org',
      packages=['collect_agent'],
      ext_modules=[collect_agent])
