import sys

from prompt_toolkit.contrib.completers import WordCompleter
from prompt_toolkit.history import InMemoryHistory
from prompt_toolkit.interface import CommandLineInterface
from prompt_toolkit.shortcuts import (
    create_asyncio_eventloop,
    create_prompt_application,
    prompt_async,
)

default_test_args = ""
completer = WordCompleter(
    ["run", "r", "failed", "f", "p", "print", "pf"], ignore_case=True
)


class TestDisplayer(object):
    def __init__(self, tests):
        self.tests = tests
        self.test_number = None
        self.current_test_number = 0

    async def parse_message(self, message):
        msg_type = message.get("_type")

        if msg_type == "session_start":
            self.test_number = message["test_number"]
            print("Tests session started, %d tests detected:" % self.test_number)
            sys.stdout.flush()
            self.current_test_number = 0
        elif msg_type == "test_result":
            # Ignore invalid json
            if "id" not in message or "outcome" not in message:
                return

            self.tests[message["id"]] = message

            test_number = self.current_test_number + 1
            self.current_test_number = test_number

            if self.test_number is not None:
                ptn = "%d/%d" % (test_number, self.test_number)
            else:
                ptn = "%d" % test_number

            print(
                "%s %s %s: %s"
                % (ptn, message["file"], message["test_name"], message["outcome"])
            )
            sys.stdout.flush()
        elif msg_type == "session_end":
            print(
                "Tests session end, %d failed, %d passed in %.4f seconds"
                % (message["failed"], message["passed"], message["total_duration"])
            )
            sys.stdout.flush()
        else:
            print(message)
            sys.stdout.flush()


class SimpleTestInterface(object):
    def __init__(self, repository, eventloop, tests, config, em, runner_class):
        self.repository = repository
        self.history = InMemoryHistory()
        self.tests = tests
        self.config = config
        self.displayer = TestDisplayer(self.tests)
        self.eventloop = eventloop
        self.runner_class = runner_class
        self.em = em

        # Register the callbacks
        self.em.register(self.displayer.parse_message)

        self.application = create_prompt_application(
            "> ", history=self.history, completer=completer
        )

        self.cli = CommandLineInterface(
            application=self.application, eventloop=create_asyncio_eventloop(eventloop)
        )

        sys.stdout = self.cli.stdout_proxy()

    def run(self):
        self.eventloop.run_until_complete(self._run())

    async def _run(self):
        while True:
            try:
                result = await self.cli.run_async()
            except (EOFError, KeyboardInterrupt):
                return

            command = result.text

            if command == "p":
                self.tests.status()
            elif command == "pf":
                self.tests.failed_tests()
            elif command == "r":
                await self.launch_all_tests()
            elif command == "f":
                await self.launch_failed_tests()

            self.tests.status_by_status()

    async def launch_all_tests(self):
        session = self._get_runner([default_test_args])
        await session.run()

    async def launch_failed_tests(self):
        tests = self.tests.get_test_by_outcome("failed")
        session = self._get_runner(tests)
        await session.run()

    def _get_runner(self, tests):
        return self.runner_class(
            self.config, self.repository, self.em, tests, loop=self.eventloop
        )
