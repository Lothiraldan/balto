import json
import tarfile
import tempfile
from os.path import join

try:
    from StringIO import StringIO
except ImportError:
    from io import StringIO

import docker.utils
from docker import DockerClient

from litr.runners import command_formatter

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

    def __init__(self, config, working_directory, event_emitter, tests_to_run=[], collect_only=False, loop=None):
        self.working_directory = working_directory
        self.tool = config['tool']
        self.docker_img = '%s-litf' % self.tool
        self.event_emitter = event_emitter
        self.tests_to_run = tests_to_run
        self.loop = loop
        self.collect_only = collect_only

    async def run(self):
        if self.is_local_docker_host() is True:
            await self._launch_container(self.docker_img, local=True)
        else:
            self._build_image()
            await self._launch_container(self.builded_image.id)

    def _build_image(self):
        dockerfile = "FROM %s\nADD . /sut/" % self.docker_img
        context = docker_context(dockerfile, self.working_directory)

        image = DOCKER.images.build(custom_context=True, fileobj=context)

        self.builded_image = image

    async def _launch_container(self, docker_img, local=False):
        cmd, args = command_formatter(self.tool, self.tests_to_run, self.collect_only)

        final_cmd = "%s %s" % (cmd, args)

        # Launch the container
        volumes = {}

        if local is True:
            volumes = {self.working_directory: {'bind': '/sut', 'mode': 'rw'}}

        container = DOCKER.containers.run(docker_img, command=final_cmd,
                                          detach=True, volumes=volumes,
                                          working_dir="/sut")

        logs = container.logs(stream=True, follow=True)
        for line in logs:
            try:
                line = line.strip()
                data = json.loads(line.decode('utf-8'))
                await self.event_emitter.emit(data)
            except ValueError:
                pass

    def is_local_docker_host(self):
        if DOCKER.api.base_url in ('http+docker://localunixsocket',):
            return True

        return False
