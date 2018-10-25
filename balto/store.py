""" Test store
"""

from collections import Counter

from dataclasses import dataclass, field


class Tests(dict):
    def __init__(self, suites):
        self.tests = {}
        self.suites = suites

    def get_test_suites(self):
        return self.suites.keys()

    def get_test_files(self, test_suite):
        test_files = set()

        for test in self.tests.values():
            test_files.add(test["file"])

        return test_files

    def get_tests(self, test_suite, test_file=None):
        tests = []

        for test_name, test in self.tests.items():
            if test_file is not None and test["file"] != test_file:
                continue

            tests.append(test_name)

        return tests

    def status(self):
        print("Tests:")
        for test_name, test in self.tests.items():
            print("%s %s: %s" % (test["file"], test["test_name"], test["outcome"]))
        print("")

    def failed_tests(self):
        print("Failed tests:")
        for test_name, test_data in self.tests.items():
            if not test_data["outcome"] == "failed":
                continue

            print("TEST NAME", test_name, test_data)
        print("")

    def status_by_status(self):
        counter = Counter()
        for test_name, test_data in self.tests.items():
            counter[test_data["outcome"]] += 1

        print("\n")
        print("Status:")
        for outcome, l in counter.items():
            print("%s\t: %d" % (outcome, l))

        print("\n")

    def get_test_by_outcome(self, outcome):
        return [
            test_name
            for (test_name, test_data) in self.tests.items()
            if test_data["outcome"] == outcome
        ]

    def __setitem__(self, name, value):
        self.tests[name] = value

    def __getitem__(self, name):
        return self.tests[name]


@dataclass
class MultipleTestSuite:
    tests_suites: dict = field(default_factory=dict)

    def __getitem__(self, suite_name):
        return self.tests_suites.setdefault(suite_name, TestSuite())


@dataclass
class TestSuite:
    tests: dict = field(default_factory=dict)

    def update_test(self, test_dict):
        if test_dict["id"] not in self.tests:
            self.tests[test_dict["id"]] = SingleTest(**test_dict)
        else:
            self.tests[test_dict["id"]].update(test_dict)


@dataclass
class SingleTest:
    id: str
    suite_name: str
    test_name: str
    file: str
    line: int
    outcome: str = field(default_factory=lambda: "collected")
    duration: str = None
    durations: dict = None
    stdout: str = None
    stderr: str = None
    error: dict = None
    skipped_messages: dict = None

    def update(self, collect_or_result_msg):
        for key, value in collect_or_result_msg.items():
            if key == "id" and value != self.id:
                raise ValueError("Cannot alter test id")
            elif key == "suite_name" and value != self.suite_name:
                raise ValueError("Cannot alter suite name")
            setattr(self, key, value)
