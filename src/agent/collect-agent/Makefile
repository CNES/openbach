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


BUILD_FLAGS=-pthread -std=c++11 -pedantic -Wall -Wextra -Werror -Wno-unused-variable -fPIC $(CXXFLAGS) -DGENERATE_LIB
ASIO_FLAGS=-DASIO_STANDALONE -I./dependencies/asio-1.12.2/include
LIBS_FLAGS=-pthread $(LDLIBS)

PREFIX?=/usr/

all: build/libcollectagent.so

build/collectagent.o: ./src/collectagent.cpp ./src/collectagent.h ./src/syslog.h
	@mkdir -p build
	g++ $(CPPFLAGS) ${BUILD_FLAGS} ${ASIO_FLAGS} -c $< -o $@

build/libcollectagent.so: ./build/collectagent.o
	@mkdir -p build
	g++ -o $@ $< $(LDFLAGS) -shared ${LIBS_FLAGS}

install: all
	mkdir -p ${DESTDIR}${PREFIX}/lib/
	mkdir -p ${DESTDIR}${PREFIX}/include/
	cp build/libcollectagent.so ${DESTDIR}${PREFIX}/lib/
	cp src/collectagent.h ${DESTDIR}${PREFIX}/include/

clean:
	@rm -rf build/

uninstall:
	@rm -f ${DESTDIR}${PREFIX}/lib/libcollectagent.so
	@rm -f ${DESTDIR}${PREFIX}/include/collectagent.h
