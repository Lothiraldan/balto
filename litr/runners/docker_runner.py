import json
import tarfile
import tempfile
from os.path import join
from StringIO import StringIO

import docker.utils
from docker import DockerClient

DOCKER = DockerClient()


def prepare_string_for_tar(name, content):
    dfinfo = tarfile.TarInfo(name)
    bytesio = StringIO(content.encode('utf-8'))
    dfinfo.size = len(bytesio.getvalue())
    bytesio.seek(0)
    return dfinfo, bytesio


def docker_context(dockerfile_content, base_path):
    context = tempfile.NamedTemporaryFile()

    archive = tarfile.open(mode='w', fileobj=context)

    archive.addfile(*prepare_string_for_tar('Dockerfile', dockerfile_content))

    root = base_path

    # Process dockerignore
    exclude = []

    # Add root directory
    for path in sorted(docker.utils.exclude_paths(root, exclude)):
        archive.add(join(root, path), arcname=path, recursive=False)

    archive.close()
    context.seek(0)

    return context


class DockerRunnerSession(object):

    def __init__(self, base_cmd, docker_img, working_directory, displayer, tests_to_run=[]):
        self.working_directory = working_directory
        self.base_cmd = base_cmd
        self.displayer = displayer
        self.tests_to_run = tests_to_run
        self.docker_img = docker_img
        self.builded_image = None

    def run(self):
        if self.is_local_docker_host() is True:
            self._launch_container(self.docker_img, local=True)
        else:
            self._build_image()
            self._launch_container(self.builded_image.id)

    def _build_image(self):
        print("BUILDING")

        dockerfile = "FROM %s\nADD . /sut/" % self.docker_img
        context = docker_context(dockerfile, self.working_directory)

        image = DOCKER.images.build(custom_context=True, fileobj=context)

        self.builded_image = image

    def _launch_container(self, docker_img, local=False):
        if self.tests_to_run:
            tests = " ".join(["'%s'" % x for x in self.tests_to_run])
        else:
            tests = ''

        final_cmd = self.base_cmd % tests

        # Launch the container
        volumes = {}

        if local is True:
            volumes = {self.working_directory: {'bind': '/sut', 'mode': 'rw'}}

        container = DOCKER.containers.run(docker_img, command=final_cmd, detach=True,
                                          volumes=volumes, working_dir="/sut")

        for line in container.logs(stream=True, follow=True):
            try:
                data = json.loads(line)
                self.displayer.parse_message(data)
            except ValueError:
                pass

    def is_local_docker_host(self):
        if DOCKER.api.base_url in ('http+docker://localunixsocket',):
            return True

        return False
