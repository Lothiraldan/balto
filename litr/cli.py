""" Language Independent Test Runner is the ultimate test-runner.
"""
from __future__ import print_function, unicode_literals

import argparse
import asyncio
import json
from os.path import abspath, join

from litr.displayer.cli_simple import SimpleTestInterface
from litr.displayer.curses import CursesTestInterface
from litr.event_emitter import EventEmitter
from litr.runners.docker_runner import DockerRunnerSession
from litr.runners.subprocess_runner import SubprocessRunnerSession
from litr.store import Tests


def get_runner_class(config):
    runner = config['runner']
    if runner == 'subprocess':
        return SubprocessRunnerSession
    elif runner == 'docker':
        return DockerRunnerSession
    else:
        raise NotImplementedError()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "directory",
        help="The directory LITR should start looking for its config file")
    parser.add_argument(
        "--curses", help="curses interface", action="store_true", default=True)
    parser.add_argument(
        "--simple",
        help="simple interface",
        action="store_true",
        default=False)
    args = parser.parse_args()

    loop = asyncio.get_event_loop()

    # Read config
    with open(join(args.directory, '.litr.json')) as config_file:
        config = json.load(config_file)

    # Runner class
    runner_class = get_runner_class(config)

    # Tests
    tests = Tests()

    # EM
    em = EventEmitter(loop)

    if args.simple:
        klass = SimpleTestInterface
    elif args.curses:
        klass = CursesTestInterface

    litr = klass(
        abspath(args.directory), loop, tests, config, em, runner_class)
    try:
        litr.run()
    finally:
        print("Waiting for cleaning workers before exiting")
        pending = asyncio.Task.all_tasks()
        loop.run_until_complete(asyncio.gather(*pending))
        print("Exiting now")
        loop.close()
