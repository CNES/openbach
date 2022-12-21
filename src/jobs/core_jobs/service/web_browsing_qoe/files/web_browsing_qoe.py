#!/usr/bin/env python3
# -*- coding: utf-8 -*-

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


"""Sources of the Job web browsing qoe"""

__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Francklin SIMO <francklin.simo@toulouse.viveris.com>
 * Matthieu Petrou <matthieu.petrou@viveris.fr>
'''

import os
import sys
import yaml
import time
import signal
import psutil
import syslog
import argparse
import threading
from seleniumwire import webdriver
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.firefox.firefox_binary import FirefoxBinary
from selenium.webdriver.support.wait import WebDriverWait
from selenium.common.exceptions import WebDriverException
from selenium.webdriver import FirefoxOptions
from functools import partial

import collect_agent


# TODO: Add support for other web browsers
def init_driver(binary_path, binary_type, stop_compression, proxy_add, proxy_port):
    """
    Method to initialize a Selenium driver. Only support Firefox browser for now.
    Args:
        binary_path(str): the path to the 'firefox' executable
        binary_type(str): for now, binary type can only be 'FirefoxBinary'.
    Returns:
        driver(WebDriver): an initialized Selenium WebDriver.
    """
    driver = None
    if binary_type == 'FirefoxBinary':
        binary = FirefoxBinary(binary_path)
        options = FirefoxOptions()
        options.add_argument('--headless')
        if stop_compression:
            options.set_preference('network.http.accept-encoding', '')
            options.set_preference('network.http.accept-encoding.secure', '')
            options.set_preference('devtools.cache.disabled', True)
        if proxy_add and proxy_port:
            options.set_preference('network.proxy.ftp', proxy_add)
            options.set_preference('network.proxy.ftp_port', proxy_port)
            options.set_preference('network.proxy.http', proxy_add)
            options.set_preference('network.proxy.http_port', proxy_port)
            options.set_preference('network.proxy.socks', proxy_add)
            options.set_preference('network.proxy.socks_port', proxy_port)
            options.set_preference('network.proxy.ssl', proxy_add)
            options.set_preference('network.proxy.ssl_port', proxy_port)
            options.set_preference('network.proxy.type', 1)
        driver = webdriver.Firefox(firefox_binary=binary, options=options)
    return driver


def compute_qos_metrics(driver, url_to_fetch, qos_metrics):
    """
    Having retrieved the web page, this method computes QoS metrics by executing their associated javascript scripts.
    Args:
        driver(WebDriver): an initialized Selenium WebDriver.
        url_to_fetch(str): the url address to retrieve prior to compute the different metrics.
        qos_metrics(dict(str,str)): a dictionary where keys are metric names and values are javascript methods.
    Returns: 
        results(dict(str,object)): a dictionary containing the different metrics/values.
    """
    results = dict()
    try:
        driver.get(url_to_fetch)
        for key, value in qos_metrics.items():
            results[key] = driver.execute_script(value)
        for request in driver.requests:
            if request.url in (url_to_fetch, url_to_fetch + '/'):
                results['status_code'] = request.response.status_code
                if results['status_code'] == 404:
                    message = 'Warning : Fetched url {} returned response code 404 (Not Found)'.format(url_to_fetch)
                    collect_agent.send_log(syslog.LOG_WARNING, message)
                    print(message)
                break
    except WebDriverException as ErrorMessage:
        message = 'ERROR when getting url: {}'.format(ErrorMessage)
        print(message)
        collect_agent.send_log(syslog.LOG_ERR, message)
        driver.quit()
        sys.exit(message)
    return results

    
def print_metrics(dict_to_print, config):
    """
    Helper method to print a dictionary of QoS metrics using their pretty names
    Args:
        dict_to_print(dict(str,str)): a dictionary where keys are metric labels and values are metric values 
        config(dict): a dictionary that should be the parsing result of the config.yaml file
    Returns:
        NoneType
    """
    for key, value in dict_to_print.items():
        if key in config['qos_metrics']:
            print('{}: {} {}'.format(config['qos_metrics'][key]['pretty_name'], value, config['qos_metrics'][key]['unit']))
        elif key in config['extra_metrics']:
            print('{}: {} {}'.format(config['extra_metrics'][key]['pretty_name'], value, config['extra_metrics'][key]['unit']))
        else:
            print('{}: {}'.format(key, value))


def kill_children(parent_pid):
    """ kill children processes including geckodriver and firefox"""
    parent = psutil.Process(parent_pid)
    for child in parent.children(recursive=True):
        try:
            child.kill()
        except psutil.NoSuchProcess as ex:
            pass


def kill_all(parent_pid, signum, frame):
    """ kill all children processes as well as parent process"""
    kill_children(parent_pid)
    parent = psutil.Process(parent_pid)
    parent.kill()


def launch_thread(collect_agent, url, config, qos_metrics, stop_compression, proxy_add, proxy_port):
    binary_path = config['driver']['binary_path']
    binary_type =  config['driver']['binary_type']
    try:
        my_driver = init_driver(binary_path, binary_type, stop_compression, proxy_add, proxy_port)
    except Exception as ex:
        message = 'ERROR when initializing the web driver: {}'.format(ex)
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)
    if my_driver is not None:
        timestamp = int(time.time() * 1000)
        statistics = compute_qos_metrics(my_driver, url, qos_metrics)
        my_driver.quit()
        statistics['compression_savings'] = 1 - (statistics['encoded_body_size'] / statistics['decoded_body_size'])
        statistics['overhead'] = statistics['transfer_size'] - statistics['encoded_body_size']
        s = '# Report for web page ' + url + ' #'
        print('\n' + s)
        print_metrics(statistics, config)
        collect_agent.send_stat(timestamp, **statistics, suffix=url)

    else:
        message = 'Sorry, specified driver is not available. For now, only Firefox driver is supported'
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)


def main(nb_runs, max_threads, stop_compression, proxy_address, proxy_port, urls):
    # Set signal handler
    signal_handler_partial = partial(kill_all, os.getpid())
    signal.signal(signal.SIGTERM, signal_handler_partial)
    signal.signal(signal.SIGINT, signal_handler_partial)
    # Init local variables
    qos_metrics_lists = dict()
    qos_metrics = dict()
    # Load config from config.yaml
    config_filepath = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'config.yaml')
    with open(config_filepath) as config_file:
        config = yaml.safe_load(config_file)
    if not urls:
        urls = config['web_pages_to_fetch']
    for metric in config['qos_metrics']:
        qos_metrics[metric] = config['qos_metrics'][metric]['js']
    # Compute qos metrics for each url 'nb_runs' times
    thread_list = []
    try:
        for _ in range(args.nb_runs):
            for url in urls:
                # condition of "max_threads + 1" because seleniumwire uses 1 additional inner thread to monitor requests
                while threading.active_count() > max_threads + 1:
                    time.sleep(1)
                t = threading.Thread(
                        target=launch_thread,
                        args=(collect_agent, url, config, qos_metrics, stop_compression, proxy_address, proxy_port))
                thread_list.append(t)
                t.start()
                time.sleep(2)
    except Exception as ex:
        message = 'An unexpected error occured: {}'.format(ex)
        collect_agent.send_log(syslog.LOG_ERR, message)
        sys.exit(message)
    finally:
        for t in thread_list:
            t.join()
        kill_children(os.getpid())


if __name__ == '__main__':
    with collect_agent.use_configuration('/opt/openbach/agent/jobs/web_browsing_qoe/web_browsing_qoe_rstats_filter.conf'):
        # Argument parsing
        parser = argparse.ArgumentParser()
        parser.add_argument('nb_runs', help='The number of fetches to perform for each website', type=int)
        parser.add_argument('-p', '--nb_parallel_runs', help='The number of fetches that can work simultaneously (default = 1)', type=int, default=1)
        parser.add_argument('-nc', '--no_compression', action='store_true', help = 'Prevent compression for transmission')
        parser.add_argument('-Pa', '--proxy_address', help='Set the proxy address (also needs a proxy port)', type=str)
        parser.add_argument('-Pp', '--proxy_port', help='Set the proxy port (also needs a proxy address)', type=int)
        parser.add_argument('-u', '--urls', nargs='+', help='URLs to fetch (uses config.yaml if not set)', type=str)

        args = parser.parse_args()

        main(args.nb_runs, args.nb_parallel_runs, args.no_compression, args.proxy_address, args.proxy_port, args.urls)
