""" BAlto is a Language independent Test Orchestrator.
"""
from __future__ import print_function, unicode_literals

import argparse
import asyncio
from os.path import abspath, join

from balto.config import read_config
from balto.displayer.cli_simple import SimpleTestInterface
from balto.displayer.curses import CursesTestInterface
from balto.event_emitter import EventEmitter
from balto.store import Tests


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

    # EM
    em = EventEmitter(loop)

    # Read config
    config_filepath = join(args.directory, '.balto.json')
    suites = read_config(config_filepath, em)

    # Tests
    tests = Tests(suites)

    if args.simple:
        klass = SimpleTestInterface
    elif args.curses:
        klass = CursesTestInterface

    task_list = []

    balto = klass(abspath(args.directory), loop, tests, suites, em, task_list)
    try:
        balto.run()
    finally:
        print("Waiting for cleaning workers before exiting")
        pending = asyncio.Task.all_tasks()
        loop.run_until_complete(asyncio.gather(*pending))
        print("Exiting now")
        loop.close()

if __name__ == "__main__":
    main()
