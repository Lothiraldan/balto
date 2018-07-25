from copy import copy
from balto.store import SingleTest
import pytest


class TestSingleTest(object):
    def setup_method(self):
        self.test_id = "#My-test-id"
        self.suite_name = "My suite name"
        self.test_name = "My test"
        self.file = "Test_file.py"
        self.line = 42

        self.test_collection = {
            "id": self.test_id,
            "suite_name": self.suite_name,
            "test_name": self.test_name,
            "file": self.file,
            "line": self.line,
        }
        self.new_test_collection = {
            "line": 51,
            "file": "test_std.py",
            "test_name": "TestClassFailing.test_stderr",
            "id": self.test_id,
            "suite_name": self.suite_name,
        }

        self.test_result = {
            "file": "test_class.py",
            "line": 7,
            "test_name": "TestClassPassing.test_passing",
            "duration": 0.0007569789886474609,
            "durations": {
                "setup": 0.0003757476806640625,
                "call": 0.00020122528076171875,
                "teardown": 0.0001800060272216797,
            },
            "outcome": "passed",
            "id": self.test_id,
            "stdout": "",
            "stderr": "",
            "error": {"humanrepr": ""},
            "skipped_messages": {},
            "suite_name": self.suite_name,
        }
        self.failed_test_result = {
            "_type": "test_result",
            "file": "test_class.py",
            "line": 18,
            "test_name": "TestClassFailing.test_failing",
            "duration": 0.0019729137420654297,
            "durations": {
                "setup": 0.00028204917907714844,
                "call": 0.0014333724975585938,
                "teardown": 0.0002574920654296875,
            },
            "outcome": "failed",
            "id": self.test_id,
            "stdout": "",
            "stderr": "",
            "error": {
                "humanrepr": "Traceback..."
            },
            "skipped_messages": {},
            "suite_name": self.suite_name,
        }

        self.collect_base_test = SingleTest(**self.test_collection)
        self.result_base_test = SingleTest(**self.test_result)

    def test_default(self):
        assert self.collect_base_test.outcome == "collected"
        assert self.collect_base_test.duration == None
        assert self.collect_base_test.durations == None
        assert self.collect_base_test.stdout == None
        assert self.collect_base_test.stderr == None
        assert self.collect_base_test.error == None
        assert self.collect_base_test.skipped_messages == None

    def test_update_collection(self):
        self.collect_base_test.update(self.new_test_collection)

        for key, value in self.new_test_collection.items():
            assert getattr(self.collect_base_test, key) == value

    def test_dont_update_id(self):
        test_collection = copy(self.new_test_collection)
        test_collection.update({"id": "test_std.py::TestClassFailing::()::test_stderr"})

        with pytest.raises(ValueError):
            self.collect_base_test.update(test_collection)

        assert self.collect_base_test.id == self.test_id

    def test_dont_update_suite_name(self):
        test_collection = copy(self.new_test_collection)
        test_collection.update({"id": "Integration suite"})

        with pytest.raises(ValueError):
            self.collect_base_test.update(test_collection)

        assert self.collect_base_test.suite_name == self.suite_name

    def test_update_result(self):
        self.collect_base_test.update(self.test_result)

        for key, value in self.test_result.items():
            assert getattr(self.collect_base_test, key) == value

    def test_update_result_failing(self):
        self.collect_base_test.update(self.failed_test_result)

        for key, value in self.failed_test_result.items():
            assert getattr(self.collect_base_test, key) == value

    def test_update_passing_result_failing(self):
        self.result_base_test.update(self.failed_test_result)

        for key, value in self.failed_test_result.items():
            assert getattr(self.result_base_test, key) == value

    def test_update_passing_collection(self):
        self.result_base_test.update(self.new_test_collection)

        # Check that values in test collection override values in test
        for key, value in self.new_test_collection.items():
            assert getattr(self.result_base_test, key) == value

        # And check that old values are still there, outcome, duration, etc...
        for key, value in self.test_result.items():
            if key in self.new_test_collection:
                continue

            assert getattr(self.result_base_test, key) == value
