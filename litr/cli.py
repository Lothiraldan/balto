from __future__ import unicode_literals

import json
import subprocess
import sys
from collections import Counter
from os.path import abspath

from prompt_toolkit import prompt
from prompt_toolkit.contrib.completers import WordCompleter
from prompt_toolkit.history import InMemoryHistory


default_test_args = "testing/test_cache.py"
CMD = "py.test %s"
completer = WordCompleter(
    ['run', 'r', 'failed', 'f', 'p', 'print'], ignore_case=True)


class SubprocessRunnerSession(object):

    def __init__(self, base_cmd, working_directory, tests, tests_to_run=[]):
        self.working_directory = working_directory
        self.base_cmd = base_cmd
        self.test_number = None
        self.current_test_number = 0
        self.tests = tests
        self.tests_to_run = tests_to_run

    def run(self):
        if self.tests_to_run:
            tests = " ".join(["'%s'" % x for x in self.tests_to_run])
        else:
            tests = ''

        final_cmd = self.base_cmd % tests

        # Reinitialize variables
        self.test_number = None
        self.current_test_number = 0

        p = self.launch_cmd(final_cmd)

        for line in iter(p.stdout.readline, ''):
            try:
                data = json.loads(line)
                self.parse_message(data)
            except ValueError:
                pass

        print("Done")

    def parse_message(self, data):
        msg_type = data.get('_type')

        if msg_type == 'session_start':
            self.test_number = data['test_number']
        elif msg_type == 'test_result':
            # Ignore invalid json
            if 'id' not in data or 'outcome' not in data:
                return

            self.tests[data['id']] = data

            test_number = self.current_test_number + 1
            self.current_test_number = test_number

            if self.test_number is not None:
                ptn = "%d/%d" % (test_number, self.test_number)
            else:
                ptn = "%d" % test_number

            print("%s %r: %s" % (ptn, data['id'], data['outcome']))
        else:
            print(data)

    def launch_cmd(self, cmd):
        p = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=self.working_directory,
            shell=True)
        return p


class Tests(dict):

    def __init__(self):
        self.tests = {}

    def status(self):
        print("Tests:")
        for test_name, test_data in self.tests.items():
            print("%r: %s" % (test_name, test_data['outcome']))
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


class LITR(object):

    def __init__(self, repository):
        self.repository = repository
        self.history = InMemoryHistory()
        self.tests = Tests()

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

    def launch_all_tests(self):
        session = SubprocessRunnerSession(CMD, self.repository, self.tests, [default_test_args])
        session.run()

    def launch_failed_tests(self):
        tests = self.tests.get_test_by_outcome("failed")
        session = SubprocessRunnerSession(CMD, self.repository, self.tests, tests)
        session.run()


def main():
    litr = LITR(abspath(sys.argv[1]))
    litr.run()
