from __future__ import unicode_literals, print_function

import asyncio
import json
import sys
from collections import Counter
from os.path import abspath, join

from litr.runners.docker_runner import DockerRunnerSession
from litr.runners.subprocess_runner import SubprocessRunnerSession
from litr.displayer.cli_simple import SimpleTestInterface


class EventEmitter(object):

    def __init__(self, loop):
        self.callbacks = []
        self.loop = loop

    def register(self, callback):
        self.callbacks.append(callback)

    async def emit(self, event):
        for callback in self.callbacks:
            # Don't wait for callbacks to finished
            self.loop.call_soon(callback, event)


class Tests(dict):
    def __init__(self):
        self.tests = {}

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

    litr = SimpleTestInterface(abspath(repository_path), loop, tests, config, em, runner_class)

    # Register the callbacks
    em.register(litr.displayer.parse_message)

    loop.run_until_complete(litr.run())
