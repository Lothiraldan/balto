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

TESTS = {}


class SubprocessRunner(object):

    def __init__(self, base_cmd, working_directory):
        self.working_directory = working_directory
        self.base_cmd = base_cmd
        self.tests = {}
        self.test_number = None
        self.current_test_number = 0

    def run(self, *args):
        final_cmd = self.base_cmd % args

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

    def run_failed_tests(self):
        print("Running only failed tests:")
        test_names = [
            "'%s'" % test_name for (test_name, test_data) in self.tests.items()
            if test_data['outcome'] == 'failed'
        ]

        self.run(" ".join(test_names))      

    def launch_cmd(self, cmd):
        p = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=self.working_directory,
            shell=True)
        return p

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


class LITR(object):

    def __init__(self, repository):
        self.repository = repository
        self.history = InMemoryHistory()
        self.test_runner = SubprocessRunner(CMD, repository)

    def run(self):
        while True:
            command = prompt("> ", history=self.history, completer=completer)

            if command == 'p':
                self.test_runner.status()
            elif command == 'r':
                self.test_runner.run(default_test_args)
            elif command == 'f':
                self.test_runner.run_failed_tests()

            self.test_runner.status_by_status()

def main():
    litr = LITR(abspath(sys.argv[1]))
    litr.run()
