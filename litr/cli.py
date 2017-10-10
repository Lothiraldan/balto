from __future__ import unicode_literals, print_function

import asyncio
import json
import sys
from collections import Counter
from os.path import abspath, join

from litr.runners.docker_runner import DockerRunnerSession
from litr.runners.subprocess_runner import SubprocessRunnerSession
from litr.displayer.cli_simple import SimpleTestInterface
from litr.displayer.curses import CursesTestInterface


class EventEmitter(object):

    def __init__(self, loop):
        self.callbacks = []
        self.loop = loop

    def register(self, callback):
        self.callbacks.append(callback)

    async def emit(self, event):
        awaitables = []
        for callback in self.callbacks:
            # Don't wait for callbacks to finished
            awaitables.append(callback(event))

        # Wait for callbacks in parallel
        await asyncio.gather(*awaitables)


class Tests(dict):
    def __init__(self):
        self.tests = {}

    def get_test_suites(self):
        return ['unit']

    def get_test_files(self, test_suite):
        test_files = set()

        for test in self.tests.values():
            test_files.add(test['file'])

        return test_files

    def get_tests(self, test_suite, test_file=None):
        tests = []

        for test_name, test in self.tests.items():
            if test_file is not None and test['file'] != test_file:
                continue

            tests.append(test_name)

        return tests

    def status(self):
        print("Tests:")
        for test_name, test in self.tests.items():
            print("%s %s: %s" % (test['file'], test['test_name'],
                                 test['outcome']))
        print("")

    def failed_tests(self):
        print("Failed tests:")
        for test_name, test_data in self.tests.items():
            if not test_data['outcome'] == "failed":
                continue

            print("TEST NAME", test_name, test_data)
        print("")

    def status_by_status(self):
        counter = Counter()
        for test_name, test_data in self.tests.items():
            counter[test_data['outcome']] += 1

        print("\n")
        print("Status:")
        for outcome, l in counter.items():
            print("%s\t: %d" % (outcome, l))

        print("\n")

    def get_test_by_outcome(self, outcome):
        return [
            test_name for (test_name, test_data) in self.tests.items()
            if test_data['outcome'] == outcome
        ]

    def __setitem__(self, name, value):
        self.tests[name] = value

    def __getitem__(self, name):
        return self.tests[name]


def get_runner_class(config):
    runner = config['runner']
    if runner == 'subprocess':
        return SubprocessRunnerSession
    elif runner == 'docker':
        return DockerRunnerSession
    else:
        raise NotImplementedError()


def main():
    loop = asyncio.get_event_loop()
    repository_path = sys.argv[1]

    # Read config
    with open(join(repository_path, '.litr.json')) as config_file:
        config = json.load(config_file)

    # Runner class
    runner_class = get_runner_class(config)

    # Tests
    tests = Tests()

    # EM
    em = EventEmitter(loop)

    litr = CursesTestInterface(abspath(repository_path), loop, tests, config, em, runner_class)
    try:
        litr.run()
    finally:
        print("Waiting for cleaning workers before exiting")
        pending = asyncio.Task.all_tasks()
        loop.run_until_complete(asyncio.gather(*pending))
        print("Exiting now")
        loop.close()
