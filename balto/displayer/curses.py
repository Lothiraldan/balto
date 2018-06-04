"""Curses interface
"""
from __future__ import print_function

import asyncio

import urwid

from balto.displayer.curses_widgets import (
    FOOTER,
    PALETTE,
    PROGRESS_BAR,
    STATUS,
    RootParentNode,
    get_selected_tests,
    set_selected_tests,
)


class CursesTestDisplayer(object):
    def __init__(self, tests, topnode, walker):
        self.tests = tests
        self.topnode = topnode
        self.walker = walker

        self.test_number = None
        self.current_test_number = 0

    def refresh_screen(self):
        self.topnode.refresh()
        self.walker._modified()

    async def parse_message(self, message):
        msg_type = message.get("_type")

        if msg_type == "session_start":
            self.test_number = message["test_number"]
            self.current_test_number = 0
        elif msg_type == "test_result":
            # Ignore invalid json
            if "id" not in message or "outcome" not in message:
                return

            self.tests[message["id"]] = message

            test_number = self.current_test_number + 1
            self.current_test_number = test_number

            # Update progress bar
            PROGRESS_BAR.set_completion(float(test_number) / self.test_number)

            self.refresh_screen()

        elif msg_type == "test_collection":
            # Ignore invalid json
            if "id" not in message:
                return

            # Force a status
            message["outcome"] = "not_run"

            self.tests[message["id"]] = message

            test_number = self.current_test_number + 1
            self.current_test_number = test_number

            # Update progress bar
            PROGRESS_BAR.set_completion(float(test_number) / self.test_number)

            self.refresh_screen()

        elif msg_type == "session_end":
            # PROGRESS_BAR.set_completion(0)
            pass
        else:
            raise Exception(message)


class CursesTestInterface(object):
    def __init__(self, repository, eventloop, tests, suites, em, task_list):
        self.repository = repository
        self.eventloop = eventloop
        self.tests = tests
        self.suites = suites
        self.em = em
        self.task_list = task_list

        self.urwid_loop = urwid.MainLoop(
            self._get_urwid_view(),
            PALETTE,
            event_loop=urwid.AsyncioEventLoop(loop=self.eventloop),
            unhandled_input=self.unhandled,
        )

        self.displayer = CursesTestDisplayer(self.tests, self.topnode, self.walker)

        # Register the callbacks
        self.em.register(self.displayer.parse_message)

    def _get_urwid_view(self):
        self.topnode = RootParentNode(self.tests)
        self.walker = urwid.TreeWalker(self.topnode)
        listbox = urwid.TreeListBox(self.walker)

        listbox.offset_rows = 1
        footer = urwid.AttrWrap(FOOTER, "foot")
        return urwid.Frame(urwid.AttrWrap(listbox, "body"), footer=footer)

    def run(self):
        if len(self.tests.tests) == 0:
            self.collect_all_tests()

        self.urwid_loop.run()

    def unhandled(self, key):
        if key in ("ctrl c", "q"):
            raise urwid.ExitMainLoop()
        elif key == "a":
            self.select_all_tests()
        elif key in ("r", "enter"):
            tests = list(get_selected_tests())

            if len(tests) == 0:
                self.launch_all_tests()
                return

            self.launch_specific_tests(tests)
        elif key == "f":
            self.select_tests("failed")
        elif key == "s":
            self.select_tests("skipped")
        elif key == "p":
            self.select_tests("passed")
        else:
            STATUS.set_text("Key pressed DEBUG: %s" % repr(key))

    def select_all_tests(self):
        all_tests = []

        for suite in self.suites.values():
            for test_name in suite.get_tests_name():
                all_tests.append((suite, test_name))

        set_selected_tests(all_tests)

        self.displayer.refresh_screen()
        STATUS.set_text("Selected %d tests" % (len(get_selected_tests())))

    def launch_all_tests(self):
        all_tests = []

        for suite in self.suites.values():
            for test_name in suite.get_tests_name():
                all_tests.append((suite, test_name))

        set_selected_tests(all_tests)

        c = self._launch_all_tests()
        task = asyncio.ensure_future(c, loop=self.eventloop)
        asyncio.wait(task)

        PROGRESS_BAR.set_completion(0)
        STATUS.set_text("Running all tests")

    def collect_all_tests(self):
        c = self._collect_all_tests()
        task = asyncio.ensure_future(c, loop=self.eventloop)
        self.task_list.append(task)

        PROGRESS_BAR.set_completion(0)
        STATUS.set_text("Collecting all tests")

    def launch_specific_tests(self, tests):
        c = self._launch_specific_tests(tests)
        task = asyncio.ensure_future(c, loop=self.eventloop)
        self.task_list.append(task)

        PROGRESS_BAR.set_completion(0)
        STATUS.set_text("Running %s tests" % len(get_selected_tests()))

    def select_tests(self, outcome):
        tests = self.tests.get_test_by_outcome(outcome)
        set_selected_tests(tests)

        self.displayer.topnode.refresh()
        self.displayer.walker._modified()
        STATUS.set_text("Selected %d %s tests" % (len(tests), outcome))

    async def _collect_all_tests(self):
        tasks = [
            suite.collect_all(self.repository, self.em, loop=self.eventloop)
            for suite in self.suites.values()
        ]
        return await asyncio.gather(*tasks, loop=self.eventloop)

    async def _launch_all_tests(self):
        tasks = [
            suite.launch_all(self.repository, self.em, loop=self.eventloop)
            for suite in self.suites.values()
        ]
        return await asyncio.gather(*tasks, loop=self.eventloop)

    async def _launch_specific_tests(self, tests):
        # Dispatch test by suite
        test_by_suite = {}

        for suite, test in tests:
            test_by_suite.setdefault(suite, []).append(test)

        tasks = []
        for suite, suite_tests in test_by_suite.items():
            tasks.append(
                suite.launch_tests(
                    self.repository, self.em, self.eventloop, suite_tests
                )
            )

        return await asyncio.gather(*tasks, loop=self.eventloop)
