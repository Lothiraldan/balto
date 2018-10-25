""" Base runner class
"""
import json
import logging
import uuid

LOGGER = logging.getLogger(__name__)


def command_formatter(tool, tests_to_run, collect_only):
    base_cmd = "%s-litf" % tool

    args = {}

    if collect_only:
        args["collect-only"] = True

    if tests_to_run.get("files"):
        args["files"] = tests_to_run["files"]

    if tests_to_run.get("nodeids"):
        args["nodeids"] = tests_to_run["nodeids"]

    args = json.dumps(args)
    return base_cmd, args


def parse_line(line):
    # Remove \n and/or whitespace only lines
    line = line.strip()

    # Ignore empty lines
    if not line:
        return

    # Decode bytes if we get bytes
    if hasattr(line, "decode"):
        decodedline = line.decode("utf-8")
    else:
        decodedline = line

    # Parse the JSON
    try:
        data = json.loads(decodedline)
    except (json.JSONDecodeError, ValueError) as e:
        LOGGER.debug("Invalid line: %r", decodedline, exc_info=True)
        return

    return data


class BaseRunner:
    def __init__(
        self,
        config,
        working_directory,
        event_emitter,
        tests_to_run=[],
        collect_only=False,
        loop=None,
        suite_name=None,
    ):
        self.working_directory = working_directory
        self.tool = config.get_tool()
        self.event_emitter = event_emitter
        self.tests_to_run = tests_to_run
        self.loop = loop
        self.collect_only = collect_only
        self.suite_name = suite_name
        self.run_id = uuid.uuid4().hex

    @property
    def command(self):
        return command_formatter(self.tool, self.tests_to_run, self.collect_only)

    async def run(self):
        await self.event_emitter.emit({"_type": "run_start", "run_id": self.run_id})

    async def read_line(self, line):

        data = parse_line(line)

        if data:
            # Add suite name to identify it
            data["suite_name"] = self.suite_name
            # And track run id
            data["run_id"] = self.run_id

            await self.event_emitter.emit(data)
