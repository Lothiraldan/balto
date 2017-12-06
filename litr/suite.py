""" Test suite classes and utilities
"""

from litr.runners.docker_runner import DockerRunnerSession
from litr.runners.subprocess_runner import SubprocessRunnerSession


class TestSuite():

    def __init__(self, name, runner, tool):
        self.name = name
        self.runner = runner
        self.tool = tool
        self.tests = {}

    def get_runner_class(self):
        if self.runner == 'subprocess':
            return SubprocessRunnerSession
        elif self.runner == 'docker':
            return DockerRunnerSession
        else:
            raise NotImplementedError()

    def get_runner(self, *args, **kwargs):
        klass = self.get_runner_class()
        return klass(self.tool, *args, **kwargs)

    # Test running methods

    async def collect_all(self, directory, event_emitter, loop):
        session = self.get_runner(directory, event_emitter, [], loop=loop,
                                  collect_only=True)
        await session.run()

    async def launch_all(self, directory, event_emitter, loop):
        session = self.get_runner(directory, event_emitter, [], loop=loop)
        await session.run()

    async def launch_tests(self, directory, event_emitter, loop, tests):
        session = self.get_runner(directory, event_emitter, tests, loop=loop)
        await session.run()
