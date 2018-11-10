import asyncio
import logging
import shlex
import os
from shutil import which

from balto.runners.base import BaseRunner

LOGGER = logging.getLogger(__name__)


async def _read_stream(stream, cb):
    while True:
        line = await stream.readline()
        if line:
            await cb(line)
        elif stream.at_eof():
            break


class CommandNotFound(Exception):
    def __init__(self, command_name, path):
        super().__init__(None)
        self.command_name = command_name
        self.path = path

    def __str__(self):
        return f"Command {self.command_name!r} not found in paths {self.path!r}"


def find_command(command_name, path):
    """Find the full path of the command passed in parameter or raise an
    CommandNotFound exception
    """
    command_path = which(command_name, path=path)

    if command_path is None:
        raise CommandNotFound(command_name, path)

    return command_path


class SubprocessRunnerSession(BaseRunner):
    async def run(self):
        await super().run()
        cmd, args = self.command

        full_cmd = find_command(cmd, os.environ.get("PATH", os.defpath))

        final_cmd = "%s %s" % (full_cmd, shlex.quote(args))

        # print("RUNNING CMD %r from %r" % (cmd, self.working_directory))

        LOGGER.debug(
            "Launching %r from working directory %r", final_cmd, self.working_directory
        )

        await self.launch_cmd(final_cmd)

    async def launch_cmd(self, cmd):
         # Bump the buffer size to be sure to handle big tracebacks
        limit = 1048576
        process = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=self.working_directory,
            loop=self.loop,
            limit=limit
        )

        await asyncio.gather(
            _read_stream(process.stdout, self.read_line),
            _read_stream(process.stderr, self.read_line),
        )

        return_code = await process.wait()

        if return_code != 0:
            LOGGER.warning("CMD %r exited with return code: %d", cmd, return_code)

        await self.event_emitter.emit(
            {"_type": "run_stop", "run_id": self.run_id, "return_code": return_code}
        )

        return return_code
