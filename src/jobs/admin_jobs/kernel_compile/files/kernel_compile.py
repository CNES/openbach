#!/usr/bin/python

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


"""OpenBACH Job kernel_compile

Clone a kernel GIT repository, compile it and install.
Prepare a reboot on the kernel once the job execution is finished.
The reboot currently does not start the reboot.
"""

__author__ = 'Viveris Technologies'
__credits__ = '''Contributors:
 * Léa THIBOUT <lea.thibout@viveris.fr>
'''

import os
import argparse
import subprocess
from pathlib import Path
from urllib.parse import urlsplit


def verify_if_kernel_exists(repo_name):
    cmd = ['awk', '-F', "'", '/menuentry / {print $2}', '/boot/grub/grub.cfg']
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    return repo_name in res.stdout.decode().splitlines()


def main(kernel_url, target_folder, git_branch, tag):
    repo_name = Path(urlsplit(kernel_url).path).stem
    repo_path = target_folder.joinpath(repo_name).as_posix()

    if not verify_if_kernel_exists(repo_name):
        cmd = ['git', 'clone', '--recursive', '-b', git_branch, kernel_url, repo_path]
        subprocess.run(cmd, check=True)
        subprocess.run(['make', 'allyesconfig'], check=True, cwd=repo_path)
        subprocess.run(['make'], check=True, cwd=repo_path)
        subprocess.run(['sudo', 'make', 'modules_install'], check=True, cwd=repo_path)
        subprocess.run(['sudo', 'make', 'install'], check=True, cwd=repo_path)
        subprocess.run(['sudo', 'grub-mkconfig', '-o', '/boot/grub/grub.cfg'], check=True)
        subprocess.run(['sudo', 'update-grub'], check=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
            description=__doc__,
            formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument(
            'kernel_url', metavar='kernel_url', type=str,
            help='(GIT) URL where we retrieve the kernel to compile')
    parser.add_argument(
            '-d', '--target_folder', type=Path, default=Path.home(),
            help='Directory where we want to clone the GIT repository')
    parser.add_argument(
            '-b', '--git_branch', type=str, default='master',
            help='GIT branch where we retrieve the kernel')
    parser.add_argument(
            '-t', '--tag', type=str, default='',
             help='Tag')

    args = parser.parse_args()
    main(args.kernel_url, args.target_folder, args.git_branch, args.tag)
