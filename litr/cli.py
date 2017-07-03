from __future__ import unicode_literals

import sys
import json
import os
import os.path
import subprocess
from collections import Counter

from prompt_toolkit import prompt
from prompt_toolkit.contrib.completers import WordCompleter
from prompt_toolkit.history import InMemoryHistory

cwd = os.path.abspath("pytest")

default_test_args = "testing/test_cache.py"
CMD = "py.test %s"
completer = WordCompleter(
    ['run', 'r', 'failed', 'f', 'p', 'print'], ignore_case=True)

TESTS = {}


def run_tests(*args):
    final_cmd = CMD % args
    p = subprocess.Popen(
        final_cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=cwd,
        shell=True)

    for line in iter(p.stdout.readline, ''):
        try:
            data = json.loads(line)

            # Ignore invalid json
            if 'id' not in data or 'outcome' not in data:
                continue

            TESTS[data['id']] = data
            print("%r: %s" % (data['id'], data['outcome']))
        except ValueError:
            pass

    print("Done")


def run_failed_tests():
    print("Running only failed tests:")
    test_names = [
        "'%s'" % test_name for (test_name, test_data) in TESTS.items()
        if test_data['outcome'] == 'failed'
    ]

    run_tests(" ".join(test_names))


def print_tests():
    print("Tests:")
    for test_name, test_data in TESTS.items():
        print("%r: %s" % (test_name, test_data['outcome']))
    print("")


def print_status():
    counter = Counter()
    for test_name, test_data in TESTS.items():
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

    def run(self):
        while True:
            command = prompt("> ", history=self.history, completer=completer)

            if command == 'p':
                print_tests()
            elif command == 'r':
                run_tests(default_test_args)
            elif command == 'f':
                run_failed_tests()

            print_status()

def main():
    litr = LITR(sys.argv[1])
    litr.run()
