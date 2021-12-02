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


"""Collect-Agent API"""


__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Mathias ETTINGER <mathias.ettinger@toulouse.viveris.com>
'''


import sys
import json
import ctypes
from itertools import chain


try:
    library = ctypes.cdll.LoadLibrary('libcollectagent.so')
except OSError:
    library = ctypes.cdll.LoadLibrary('collectagent.dll')


_register_collect = library.collect_agent_register_collect
_register_collect.restype = ctypes.c_bool
_register_collect.argtypes = [ctypes.c_char_p, ctypes.c_int, ctypes.c_int, ctypes.c_bool]

_send_log = library.collect_agent_send_log
_send_log.restype = ctypes.c_void_p
_send_log.argtypes = [ctypes.c_int, ctypes.c_char_p]

_send_stat = library.collect_agent_send_stat
_send_stat.restype = ctypes.c_char_p
_send_stat.argtypes = [ctypes.c_longlong, ctypes.c_char_p, ctypes.c_char_p]

_store_files = library.collect_agent_store_files
_store_files.restype = ctypes.c_char_p

_reload_stat = library.collect_agent_reload_stat
_reload_stat.restype = ctypes.c_char_p
_reload_stat.argtypes = []

_remove_stat = library.collect_agent_remove_stat
_remove_stat.restype = ctypes.c_char_p
_remove_stat.argtypes = []

_reload_all_stats = library.collect_agent_reload_all_stats
_reload_all_stats.restype = ctypes.c_char_p
_reload_all_stats.argtypes = []

_change_config = library.collect_agent_change_config
_change_config.restype = ctypes.c_char_p
_change_config.argtypes = [ctypes.c_bool, ctypes.c_bool]


def register_collect(config_file, log_option=0x01, log_facility=1<<3, new=False):
    return _register_collect(
            config_file.encode(),
            log_option,
            log_facility,
            new)


def connect(config_file):
    # Not importing syslog on purpose to keep the file cross-platform
    if not register_collect(config_file):
        message = 'ERROR connecting to collect-agent'
        send_log(3, message)  # syslog.LOG_ERR
        sys.exit(message)
    send_log(7, 'Starting job')  # syslog.LOG_DEBUG


def send_log(priority, log):
    _send_log(priority, log.encode())


def send_stat(timestamp, suffix=None, **kwargs):
    if suffix is None:
        suffix = ''
    response = _send_stat(
            ctypes.c_longlong(timestamp),
            suffix.encode(),
            json.dumps(kwargs).encode())
    return response.decode(errors='replace')


def store_files(timestamp, suffix=None, **kwargs):
    if suffix is None:
        suffix = ''
    filepaths = map(str.encode, chain.from_iterable(kwargs.items()))
    response = _store_files(
            ctypes.c_longlong(timestamp),
            suffix.encode(),
            len(kwargs),
            *map(str.encode, chain.from_iterable(kwargs.items())))
    return response.decode(errors='replace')


def reload_stat():
    return _reload_stat().decode(errors='replace')


def remove_stat():
    return _remove_stat().decode(errors='replace')


def reload_all_stats():
    return _reload_all_stats().decode(errors='replace')


def change_config(storage, broadcast):
    return _change_config(storage, broadcast).decode(errors='replace')
