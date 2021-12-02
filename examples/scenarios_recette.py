#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Author: Adrien THIBAUD / <adrien.thibaud@toulouse.viveris.com>

"""
scenarios_recette.py - <+description+>
"""


import argparse
import scenario_builder as sb


def main(ws_gw, ws_st):
    ## Scenario "Ping with While"
    # Create the scenario
    scenario = sb.Scenario('Ping with While', 'Comparaison of 2 Pings')
    # Create and configure the openbach-function 'start_job_instance' to start a
    # Job 'rate_monitoring'
    rate_monitoring = scenario.add_function('start_job_instance')
    rate_monitoring.configure('rate_monitoring', ws_gw, offset=0,
                              interval=2, chain='OUTPUT',
                              destination=ws_st)
    # Create and configure the openbach-function 'retrieve_status_agent' to
    # update the status of our two ws
    status = scenario.add_function('retrieve_status_agents')
    status.configure(ws_gw, ws_st, update=True)
    # Create the openbach-function 'while' and define its condition
    while_function = scenario.add_function('while', wait_launched=[status])
    while_function.configure(
        sb.Condition(
            'or', sb.Condition(
                '!=', sb.Operand('database', 'Agent', ws_st, 'status'),
                sb.Operand('value', 'Available')),
            sb.Condition(
                '!=', sb.Operand('database', 'Agent', ws_gw, 'status'),
                sb.Operand('value', 'Available'))
        )
    )
    # Create and configure the openbach-function 'retrieve_status_agent' to
    # update the status of our two ws
    status_in_while = scenario.add_function('retrieve_status_agents')
    status_in_while.configure(ws_st, ws_gw, update=True)
    # Add this new openbach-function to the body of the while
    while_function.configure_while_body(status_in_while)
    # Create and configure the openbach-function 'start_job_instance' to start a
    # Job 'hping'
    hping = scenario.add_function('start_job_instance')
    hping.configure('hping', ws_gw, destination_ip=ws_st)
    # Create and configure the openbach-function 'start_job_instance' to start a
    # Job 'fping'
    fping = scenario.add_function('start_job_instance')
    fping.configure('fping', ws_gw, offset=0,
                    destination_ip=ws_st)
    # Add this new openbach-functions to the end of the while
    while_function.configure_while_end(hping, fping)

    # Write the scenario in a file in a json format
    scenario.write('ping_with_while.json')


    ## Scenario "Ping with While and iperf"
    # Take the previous scenario and modify the name
    scenario.name = 'Ping with While and iperf'
    # Create and configure the openbach-function 'start_job_instance' to start a
    # Job 'iperf' as a server
    iperf_server = scenario.add_function('start_job_instance',
                                         wait_launched=[fping, hping])
    iperf_server.configure('iperf', ws_st, offset=0, mode='-s', udp=True)
    # Prepare some variable for the loop
    bandwidth = [5, 10, 20]
    wait_function = [iperf_server]
    # Add 3 iperf client
    for i in range(3):
        # Create and configure the openbach-function 'start_job_instance' to
        # start a Job 'iperf' as a client
        if i == 0:
            iperf_client = scenario.add_function('start_job_instance',
                                                 wait_launched=wait_function)
        else:
            iperf_client = scenario.add_function('start_job_instance',
                                                 wait_finished=wait_function)
        iperf_client.configure('iperf', ws_gw, offset=0,
                               mode='-c', server_ip='172.20.42.63', udp=True,
                               bandwidth=bandwidth[i])
        # Create and configure the openbach-function 'stop_job_instance' to
        # stop the Job 'iperf' (the client)
        stop_iperf_client = scenario.add_function(
            'stop_job_instance', wait_delay=30, wait_launched=[iperf_client])
        stop_iperf_client.configure(iperf_client)
        # Update the varible
        wait_function = [iperf_client]
    # Create and configure the openbach-function 'stop_job_instance' to
    # stop the Job 'iperf' (the server)
    stop_iperf_server = scenario.add_function(
        'stop_job_instance', wait_delay=30, wait_finished=wait_function)
    stop_iperf_server.configure(iperf_server)

    # Write the scenario in a file in a json format
    scenario.write('ping_with_while_and_iperf.json')


    ## Scenario "MPTCP"
    scenario = sb.Scenario('MPTCP', 'MPTCP')
    mptcp_gw0_ws1 = scenario.add_function('start_job_instance')
    mptcp_gw0_ws1.configure('mptcp', ws_gw, offset=0,
                            iface_link1='eth0', iface_link2='eth1',
                            network_link1='172.20.42.0/24',
                            network_link2='172.20.41.0/24',
                            gw_link1='172.20.42.1', gw_link2='172.20.41.1',
                            ip_link1='172.20.42.62',
                            ip_link2='172.20.41.62', conf_up=1)
    mptcp_st1_ws1 = scenario.add_function('start_job_instance')
    mptcp_st1_ws1.configure('mptcp', ws_gw, offset=0,
                            iface_link1='eth0', iface_link2='eth1',
                            network_link1='172.20.42.0/24',
                            network_link2='172.20.41.0/24',
                            gw_link1='172.20.42.1', gw_link2='172.20.41.1',
                            ip_link1='172.20.42.63',
                            ip_link2='172.20.41.63', conf_up=1)
    http_server = scenario.add_function('start_job_instance',
                                        wait_finished=[mptcp_gw0_ws1,
                                                       mptcp_st1_ws1])
    http_server.configure('http_server', ws_gw, offset=0, port=8080)
    http_client_plt = scenario.add_function(
        'start_job_instance', wait_delay=10, wait_launched=[http_server])
    http_client_plt.configure('http_client_plt', ws_st, offset=0,
                              server_address=ws_gw, port=8080)
    stop_http_client = scenario.add_function(
        'stop_job_instance', wait_delay=10, wait_launched=[http_client_plt])
    stop_http_client.configure(http_client_plt)
    stop_http_server = scenario.add_function(
        'stop_job_instance', wait_finished=[http_client_plt])
    stop_http_server.configure(http_server)
    stop_mptcp_gw0_ws1 = scenario.add_function('start_job_instance')
    stop_mptcp_gw0_ws1.configure('mptcp', ws_gw, offset=0,
                            iface_link1='eth0', iface_link2='eth1',
                            network_link1='172.20.42.0/24',
                            network_link2='172.20.41.0/24',
                            gw_link1='172.20.42.1', gw_link2='172.20.41.1',
                            ip_link1='172.20.42.62',
                            ip_link2='172.20.41.62', conf_up=0)
    stop_mptcp_st1_ws1 = scenario.add_function('start_job_instance')
    stop_mptcp_st1_ws1.configure('mptcp', ws_st, offset=0,
                            iface_link1='eth0', iface_link2='eth1',
                            network_link1='172.20.42.0/24',
                            network_link2='172.20.41.0/24',
                            gw_link1='172.20.42.1', gw_link2='172.20.41.1',
                            ip_link1='172.20.42.63',
                            ip_link2='172.20.41.63', conf_up=0)

    scenario.write('mptcp.json')

    ## Scenario "HTTP"
    scenario = sb.Scenario('HTTP', 'HTTP')
    http_server = scenario.add_function('start_job_instance')
    http_server.configure('http_server', ws_gw, offset=0, port=8080)
    http_client_plt = scenario.add_function(
        'start_job_instance', wait_delay=10, wait_launched=[http_server])
    http_client_plt.configure('http_client_plt', ws_st, offset=0,
                              server_address=ws_gw, port=8080)
    stop_http_client = scenario.add_function(
        'stop_job_instance', wait_delay=10, wait_launched=[http_client_plt])
    stop_http_client.configure(http_client_plt)
    stop_http_server = scenario.add_function(
        'stop_job_instance', wait_finished=[http_client_plt])
    stop_http_server.configure(http_server)

    scenario.write('http.json')


if __name__ == '__main__':
    # Define Usage
    parser = argparse.ArgumentParser(description='',
                                     formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument('ws_gw', metavar='ws_gw', type=str,
                        help='IP address of the WorkStation of the GW')
    parser.add_argument('ws_st', metavar='ws_st', type=str,
                        help='IP address of the WorkStation of the ST')

    # get args
    args = parser.parse_args()
    ws_gw = args.ws_gw
    ws_st = args.ws_st

    main(ws_gw, ws_st)
