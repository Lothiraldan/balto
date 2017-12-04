""" Test suite classes and utilities
"""

from litr.runners.docker_runner import DockerRunnerSession
from litr.runners.subprocess_runner import SubprocessRunnerSession


class TestSuite():

    def __init__(self, name, runner, tool):
        self.name = name
        self.runner = runner
        self.tool = tool

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

