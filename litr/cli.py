""" Language Independent Test Runner is the ultimate test-runner.
"""
from __future__ import print_function, unicode_literals

import argparse
import asyncio
from os.path import abspath, join

from litr.config import read_config
from litr.displayer.cli_simple import SimpleTestInterface
from litr.displayer.curses import CursesTestInterface
from litr.event_emitter import EventEmitter
from litr.store import Tests


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
    config_filepath = join(args.directory, '.litr.json')
    suites = read_config(config_filepath)

    # Tests
    tests = Tests()

    # EM
    em = EventEmitter(loop)

    if args.simple:
        klass = SimpleTestInterface
    elif args.curses:
        klass = CursesTestInterface

    litr = klass(abspath(args.directory), loop, tests, suites, em)
    try:
        litr.run()
    finally:
        print("Waiting for cleaning workers before exiting")
        pending = asyncio.Task.all_tasks()
        loop.run_until_complete(asyncio.gather(*pending))
        print("Exiting now")
        loop.close()
