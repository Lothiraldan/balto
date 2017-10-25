import json
import asyncio

from litr.runners import command_formatter


async def _read_stream(stream, cb):
    while True:
        line = await stream.readline()
        if line:
            await cb(line)
        elif stream.at_eof():
            break


class SubprocessRunnerSession(object):

    def __init__(self, config, working_directory, event_emitter, tests_to_run=[], collect_only=False, loop=None):
        self.working_directory = working_directory
        self.tool = config['tool']
        self.event_emitter = event_emitter
        self.tests_to_run = tests_to_run
        self.loop = loop
        self.collect_only = collect_only

    async def run(self):
        cmd, args = command_formatter(self.tool, self.tests_to_run, self.collect_only)

        final_cmd = "%s %s" % (cmd, args)

        # Reinitialize variables
        self.test_number = None
        self.current_test_number = 0

        await self.launch_cmd(final_cmd)

    async def read_line(self, line):
        # Remove \n and/or whitespace only lines
        line = line.strip()

        if not line:
            return

        decodedline = line.decode('utf-8')
        try:
            data = json.loads(decodedline)
        except json.JSONDecodeError:
            print("Invalid line", repr(decodedline))
            return

        await self.event_emitter.emit(data)

    async def launch_cmd(self, cmd):
        process = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=self.working_directory,
            loop=self.loop
        )

        await asyncio.gather(
            _read_stream(process.stdout, self.read_line),
            _read_stream(process.stderr, self.read_line)
        )

        return await process.wait()
