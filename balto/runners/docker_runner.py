import asyncio
import json
import logging
import tarfile
import tempfile
from io import BytesIO
from os.path import join

import docker.utils
from aiodocker.docker import Docker
from aiodocker.exceptions import DockerError
from docker import DockerClient

from balto.runners.base import BaseRunner

DOCKER = DockerClient()
AIODOCKER = Docker()

LOGGER = logging.getLogger(__name__)


def prepare_string_for_tar(name, content):
    dfinfo = tarfile.TarInfo(name)
    bytesio = BytesIO(content.encode("utf-8"))
    dfinfo.size = len(bytesio.getvalue())
    bytesio.seek(0)
    return dfinfo, bytesio


def docker_context(dockerfile_content, base_path):
    context = tempfile.NamedTemporaryFile()

    archive = tarfile.open(mode="w", fileobj=context)

    archive.addfile(*prepare_string_for_tar("Dockerfile", dockerfile_content))

    root = base_path

    # Process dockerignore
    exclude = []

    # Add root directory
    for path in sorted(docker.utils.exclude_paths(root, exclude)):
        archive.add(join(root, path), arcname=path, recursive=False)

    archive.close()
    context.seek(0)

    return context


class DockerRunnerSession(BaseRunner):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.docker_img = "lothiraldan/%s-litf" % self.tool

    async def run(self):
        await super().run()
        if self.is_local_docker_host() is True:
            await self._launch_container(self.docker_img, local=True)
        else:
            await self._build_image()
            await self._launch_container(self.builded_image)

    async def _build_image(self):
        dockerfile = "FROM %s\nADD . /sut/" % self.docker_img
        context = docker_context(dockerfile, self.working_directory)

        # Build an image with a custom Dockerfile and context
        image = await AIODOCKER.images.build(
            fileobj=context, encoding="utf-8", quiet=True
        )
        image_id = image[0]["stream"].strip()

        self.builded_image = image_id

    async def _launch_container(self, docker_img, local=False):
        cmd, args = self.command

        config = {
            "Cmd": [cmd, args],
            "Image": docker_img,
            "AttachStdout": True,
            "AttachStderr": True,
            "Tty": False,
            "OpenStdin": False,
            "WorkingDir": "/sut",
        }

        # Launch the container
        if local is True:
            config["Volumes"] = {"/sut": {}}
            config["HostConfig"] = {"Binds": ["%s:/sut:ro" % self.working_directory]}

        container = await AIODOCKER.containers.create(config=config)
        await container.start()

        logs = await container.log(stdout=True, stderr=True, follow=True)
        async for line in logs:
            await self.read_line(line)

    def is_local_docker_host(self):
        LOGGER.debug("Docker base url: %r", DOCKER.api.base_url)
        if DOCKER.api.base_url in ("http+docker://localunixsocket",):
            return True

        return False
