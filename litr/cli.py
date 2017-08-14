from __future__ import unicode_literals, print_function

import asyncio
import json
import sys
from collections import Counter
from os.path import abspath, join

from prompt_toolkit import prompt
from prompt_toolkit.contrib.completers import WordCompleter
from prompt_toolkit.history import InMemoryHistory
from prompt_toolkit.interface import CommandLineInterface
from prompt_toolkit.shortcuts import create_prompt_application, create_asyncio_eventloop, prompt_async

from litr.runners.docker_runner import DockerRunnerSession
from litr.runners.subprocess_runner import SubprocessRunnerSession

default_test_args = ""
completer = WordCompleter(
    ['run', 'r', 'failed', 'f', 'p', 'print', 'pf'], ignore_case=True)


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


class TestDisplayer(object):
    def __init__(self, tests):
        self.tests = tests
        self.test_number = None
        self.current_test_number = 0

    def parse_message(self, message):
        msg_type = message.get('_type')

        if msg_type == 'session_start':
            self.test_number = message['test_number']
            print(
                "Tests session started, %d tests detected:" % self.test_number)
            sys.stdout.flush()
            self.current_test_number = 0
        elif msg_type == 'test_result':
            # Ignore invalid json
            if 'id' not in message or 'outcome' not in message:
                return

            self.tests[message['id']] = message

            test_number = self.current_test_number + 1
            self.current_test_number = test_number

            if self.test_number is not None:
                ptn = "%d/%d" % (test_number, self.test_number)
            else:
                ptn = "%d" % test_number

            print("%s %s %s: %s" % (ptn, message['file'], message['test_name'],
                                    message['outcome']))
            sys.stdout.flush()
        elif msg_type == 'session_end':
            print("Tests session end, %d failed, %d passed in %.4f seconds" %
                  (message['failed'], message['passed'],
                   message['total_duration']))
            sys.stdout.flush()
        else:
            print(message)
            sys.stdout.flush()


class LITR(object):
    def __init__(self, repository, eventloop):
        self.repository = repository
        self.history = InMemoryHistory()
        self.tests = Tests()
        self.displayer = TestDisplayer(self.tests)
        self.eventloop = eventloop

        self.application = create_prompt_application(
            '> ', history=self.history, completer=completer)

        self.cli = CommandLineInterface(
            application=self.application,
            eventloop=create_asyncio_eventloop(eventloop)
        )

        sys.stdout = self.cli.stdout_proxy()

        self.config = {}
        self.read_configuration()

    async def run(self):
        while True:
            try:
                result = await self.cli.run_async()
            except (EOFError, KeyboardInterrupt):
                return

            command = result.text

            if command == 'p':
                self.tests.status()
            elif command == 'pf':
                self.tests.failed_tests()
            elif command == 'r':
                await self.launch_all_tests()
            elif command == 'f':
                await self.launch_failed_tests()

            self.tests.status_by_status()

    def read_configuration(self):
        with open(join(self.repository, '.litr.json')) as config_file:
            self.config = json.load(config_file)

    async def launch_all_tests(self):
        session = self._get_runner([default_test_args])
        await session.run()

    async def launch_failed_tests(self):
        tests = self.tests.get_test_by_outcome("failed")
        session = self._get_runner(tests)
        await session.run()

    def _get_runner(self, tests):
        if self.config['runner'] == 'subprocess':
            print("SP")
            return SubprocessRunnerSession(self.config['cmd'],
                                           self.repository, self.displayer,
                                           tests, loop=self.eventloop)
        elif self.config['runner'] == 'docker':
            print("DOCK")
            return DockerRunnerSession(self.config['cmd'],
                                       self.config['docker_img'],
                                       self.repository, self.displayer, tests,
                                       loop=self.eventloop)
        else:
            raise NotImplementedError()


def main():
    loop = asyncio.get_event_loop()
    litr = LITR(abspath(sys.argv[1]), loop)
    loop.run_until_complete(litr.run())
