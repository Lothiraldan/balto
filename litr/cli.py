from __future__ import unicode_literals

import json
import sys
from collections import Counter
from os.path import abspath, join

from prompt_toolkit import prompt
from prompt_toolkit.contrib.completers import WordCompleter
from prompt_toolkit.history import InMemoryHistory

from litr.runners.subprocess_runner import SubprocessRunnerSession
from litr.runners.docker_runner import DockerRunnerSession


default_test_args = "testing/test_cache.py"
completer = WordCompleter(
    ['run', 'r', 'failed', 'f', 'p', 'print'], ignore_case=True)


class Tests(dict):

    def __init__(self):
        self.tests = {}

    def status(self):
        print("Tests:")
        for test_name, test in self.tests.items():
            print("%s %s: %s" % (test['file'], test['test_name'], test['outcome']))
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
            print("Tests session started, %d tests detected:" % self.test_number)
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

            print("%s %s %s: %s" % (ptn, message['file'], message['test_name'], message['outcome']))
        elif msg_type == 'session_end':
            print("Tests session end, %d failed, %d passed in %.4f seconds" % (message['failed'], message['passed'], message['total_duration']))
        else:
            print(message)


class LITR(object):

    def __init__(self, repository):
        self.repository = repository
        self.history = InMemoryHistory()
        self.tests = Tests()
        self.displayer = TestDisplayer(self.tests)

        self.config = {}
        self.read_configuration()

    def run(self):
        while True:
            command = prompt("> ", history=self.history, completer=completer)

            if command == 'p':
                self.tests.status()
            elif command == 'r':
                self.launch_all_tests()
            elif command == 'f':
                self.launch_failed_tests()

            self.tests.status_by_status()

    def read_configuration(self):
        with open(join(self.repository, '.litr.json')) as config_file:
            self.config = json.load(config_file)

    def launch_all_tests(self):
        session = self._get_runner([default_test_args])
        session.run()

    def launch_failed_tests(self):
        tests = self.tests.get_test_by_outcome("failed")
        session = self._get_runner(tests)
        session.run()

    def _get_runner(self, tests):
        if self.config['runner'] == 'subprocess':
            print("SP")
            return SubprocessRunnerSession(self.config['cmd'], self.repository,
                                           self.displayer, tests)
        elif self.config['runner'] == 'docker':
            print("DOCK")
            return DockerRunnerSession(self.config['cmd'], self.config['docker_img'], self.repository,
                                       self.displayer, tests)
        else:
            raise NotImplementedError()


def main():
    litr = LITR(abspath(sys.argv[1]))
    litr.run()
