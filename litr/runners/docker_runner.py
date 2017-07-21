import json

from docker import DockerClient

DOCKER = DockerClient()


class DockerRunnerSession(object):

    def __init__(self, base_cmd, docker_img, working_directory, displayer, tests_to_run=[]):
        self.working_directory = working_directory
        self.base_cmd = base_cmd
        self.displayer = displayer
        self.tests_to_run = tests_to_run
        self.docker_img = docker_img

    def run(self):
        if self.tests_to_run:
            tests = " ".join(["'%s'" % x for x in self.tests_to_run])
        else:
            tests = ''

        final_cmd = self.base_cmd % tests

        # Launch the container
        volumes = {self.working_directory: {'bind': '/sut', 'mode': 'rw'}}
        container = DOCKER.containers.run(self.docker_img, command=final_cmd, detach=True,
                               volumes=volumes, working_dir="/sut")

        for line in container.logs(stream=True, follow=True):
            try:
                data = json.loads(line)
                self.displayer.parse_message(data)
            except ValueError:
                pass