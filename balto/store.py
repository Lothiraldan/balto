""" Test store
"""

from collections import Counter


class Tests(dict):
    def __init__(self, suites):
        self.tests = {}
        self.suites = suites

    def get_test_suites(self):
        return self.suites.keys()

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
