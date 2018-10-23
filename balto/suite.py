""" Test suite classes and utilities
"""

from balto.runners.docker_runner import DockerRunnerSession
from balto.runners.subprocess_runner import SubprocessRunnerSession


class TestSuite:
    def __init__(self, name, runner, em, config):
        self.name = name
        self.runner = runner
        self.tests = {}
        self.em = em
        self.config = config

        self.em.register(self.new_output)

    def get_runner_class(self):
        if self.runner == "subprocess":
            return SubprocessRunnerSession
        elif self.runner == "docker":
            return DockerRunnerSession
        else:
            raise NotImplementedError()

    def get_runner(self, *args, **kwargs):
        klass = self.get_runner_class()
        return klass(self.config, *args, **kwargs)

    def get_test_files(self):
        return set(test["file"] for test in self.tests.values())

    def get_tests(self, test_file=None):
        tests = self.tests.values()

        if test_file:
            tests = [test for test in tests if test["file"] == test_file]

        return tests

    def get_tests_name(self, *args, **kwargs):
        tests = self.get_tests(*args, **kwargs)

        names = [test["id"] for test in tests]
        # print("TEST NAMES", names)
        return names

    def __getitem__(self, test_name):
        return self.tests.get(test_name)

    async def new_output(self, data):
        if (
            data.get("_type") in ("test_collection", "test_result")
            and data["suite_name"] == self.name
        ):
            test_id = data["id"]
            self.tests.setdefault(test_id, {}).update(data)

    # Test running methods

    async def collect_all(self, directory, event_emitter, loop):
        session = self.get_runner(
            directory,
            event_emitter,
            {},
            loop=loop,
            collect_only=True,
            suite_name=self.name,
        )
        await session.run()

    async def launch_all(self, directory, event_emitter, loop):
        session = self.get_runner(
            directory, event_emitter, {}, loop=loop, suite_name=self.name
        )
        await session.run()

    async def launch_tests(self, directory, event_emitter, loop, tests):
        session = self.get_runner(
            directory, event_emitter, tests, loop=loop, suite_name=self.name
        )
        await session.run()
