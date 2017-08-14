import json
import asyncio


async def _read_stream(stream, cb):
    while True:
        line = await stream.readline()
        if line:
            await cb(line)
        elif stream.at_eof():
            break


class SubprocessRunnerSession(object):

    def __init__(self, base_cmd, working_directory, displayer, tests_to_run=[], loop=None):
        self.working_directory = working_directory
        self.base_cmd = base_cmd
        self.displayer = displayer
        self.tests_to_run = tests_to_run
        self.loop = loop

    async def run(self):
        if self.tests_to_run:
            tests = " ".join(["'%s'" % x for x in self.tests_to_run])
        else:
            tests = ''

        final_cmd = self.base_cmd % tests

        # Reinitialize variables
        self.test_number = None
        self.current_test_number = 0

        await self.launch_cmd(final_cmd)

        print("Done")

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

        self.displayer.parse_message(data)

    async def launch_cmd(self, cmd):
        process = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=self.working_directory,
        )

        await asyncio.wait([
            _read_stream(process.stdout, self.read_line),
            _read_stream(process.stderr, self.read_line)
        ])

        return await process.wait()
