OpenBACH
========

OpenBACH is a user-friendly and efficient benchmark to configure, supervise and control your network under test (e.g. terrestrial networks, satellite networks, WAN, LAN, etc.). It provides an efficient modular structure to facilitate the additions of new software tools, monitoring parameters, tasks, etc. The benchmark is able to be integrated in different types of equipments, servers, clients, hardware and software with minimal adaptation effort.

This platform has been promoted by CNES (French Space Center) as a reference open-source software tool within its research and development studies and activities in the domain of satellite network communications systems. OpenBACH has been developped in order to be complementary to OpenSAND, the satellite network emulator.

Read the documentation and more at https://wiki.net4sat.org/doku.php?id=openbach:index

OpenBACH is funded and promoted by CNES (French Space Center) as a reference open-source software tool within its research and development studies and activities in the domain of satellite communication systems and networks.

Design Principles
=================

   * The controller can launch several pre-coded jobs (ping, iperf, rate monitoring) on the remote agents
   * The user can code new jobs, install them on the agents and launch them with the controller
   * OpenBACH provides web interfaces to visualize the results and the logs of the simulations (using Grafana and Kibana)

Get Involved
============

*  See OpenBACH web site : http://www.openbach.org/
*  A mailing list is available : users@openbach.org

Examples of project using OpenBACH
=======
*  A simple example chaining reference scenarios in python is available [here](https://forge.net4sat.org/openbach/openbach-extra/tree/master/executors/examples)
*  A project that let you install, set up and run OpenBACH basic scenarios is available [here](https://forge.net4sat.org/kuhnn/openbach-example-simple)

Project Partners
=======
Vivéris Technologies

Authors
=======
*  Adrien Thibaud      (Vivéris Technologies),      adrien.thibaud@viveris.fr
*  Mathias Ettinger    (Vivéris Technologies),      mathias.ettinger@viveris.fr
*  Léa Thibout         (Vivéris Technologies),      lea.thibout@viveris.fr
*  David Fernandes     (Vivéris Technologies),      david.fernandes@viveris.fr
*  Joaquin Muguerza    (Vivéris Technologies),      joaquin.muguerza@viveris.fr
*  Bastien Tauran      (Vivéris Technologies),      bastien.tauran@viveris.fr
*  Francklin Simo      (Vivéris Technologies),      francklin.simo@viveris.fr
*  Mathieu Petrou      (Vivéris Technologies),      mathieu.petrou@viveris.fr
*  Oumaima Zerrouq     (Vivéris Technologies),      oumaima.zerrouq@viveris.fr
*  David Pradas        (Vivéris Technologies),      david.pradas@viveris.fr
*  Emmanuel Dubois     (CNES),                      emmanuel.dubois@cnes.fr
*  Nicolas Kuhn        (CNES),                      nicolas.kuhn@cnes.fr 
*  Santiago Garcia Guillen (CNES),                  santiago.garciaguillen@cnes.fr

Licence
=======
Copyright © 2016-2020 CNES
OpenBACH is released under GPLv3 (see [LICENSE](LICENSE.md) file).
