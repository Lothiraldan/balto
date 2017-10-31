""" Base runner class
"""
import json

def command_formatter(tool, tests_to_run, collect_only):
    base_cmd = "%s-litf" % tool

    args = {}

    if collect_only:
        args["collect-only"] = True

    if tests_to_run:
        args["files"] = tests_to_run

    args = json.dumps(args)
    return base_cmd, args

def parse_line(line):
    # Remove \n and/or whitespace only lines
    line = line.strip()

    # Ignore empty lines
    if not line:
        return

    # Decode bytes if we get bytes
    if hasattr(line, 'decode'):
        decodedline = line.decode('utf-8')
    else:
        decodedline = line

    # Parse the JSON
    try:
        data = json.loads(decodedline)
    except (json.JSONDecodeError, ValueError) as e:
        # print("Invalid line", e, repr(decodedline))
        return

    return data

class BaseRunner():

    def __init__(self, config, working_directory, event_emitter, tests_to_run=[], collect_only=False, loop=None):
        self.working_directory = working_directory
        self.tool = config['tool']
        self.event_emitter = event_emitter
        self.tests_to_run = tests_to_run
        self.loop = loop
        self.collect_only = collect_only

    @property
    def command(self):
        return command_formatter(self.tool, self.tests_to_run, self.collect_only)

    async def read_line(self, line):

        data = parse_line(line)

        if data:
            await self.event_emitter.emit(data)