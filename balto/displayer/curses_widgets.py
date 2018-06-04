from __future__ import print_function

from contextlib import suppress

import urwid

from balto.suite import TestSuite

STATUS = urwid.Text("")
PROGRESS_BAR = urwid.ProgressBar("pg normal", "pg complete", 0, 1)
FOOTER = urwid.Columns([STATUS, PROGRESS_BAR])
SELECTED_TEST = set()


def set_selected_tests(tests):
    global SELECTED_TEST
    SELECTED_TEST = set(tests)


def get_selected_tests():
    global SELECTED_TEST
    return SELECTED_TEST


PALETTE = [
    ("body", "black", "light gray"),
    ("flagged", "black", "dark green", ("bold", "underline")),
    ("focus", "light gray", "dark blue", "standout"),
    ("focus Passing", "light green", "dark blue", "standout"),
    ("focus Failing", "light red", "dark blue", "standout"),
    ("flagged focus", "yellow", "dark cyan", ("bold", "standout", "underline")),
    ("head", "yellow", "black", "standout"),
    ("foot", "light gray", "black"),
    ("key", "light cyan", "black", "underline"),
    ("title", "white", "black", "bold"),
    ("dirmark", "black", "dark cyan", "bold"),
    ("flag", "dark gray", "light gray"),
    # Outcomes
    ("failed", "dark red", "light gray"),
    ("passed", "dark green", "light gray"),
    ("error", "dark red", "light gray"),
    ("skipped", "dark blue", "light gray"),
    ("not_run", "black", "light gray"),
    ("pg normal", "white", "black", "standout"),
    ("pg complete", "white", "dark blue"),
    ("pg smooth", "dark blue", "black"),
]


def on_flagged(test_id, flagged):
    if flagged:
        SELECTED_TEST.add(test_id)
    else:
        with suppress(KeyError):
            SELECTED_TEST.remove(test_id)


class SingleTestWidget(urwid.TreeWidget):
    def __init__(self, *args, **kwargs):
        self.selected_w = urwid.Text("[ ]")
        super().__init__(*args, **kwargs)
        # insert an extra AttrWrap for our own use
        self._w = urwid.AttrWrap(self._w, None)
        self.update_w()

    def selectable(self):
        return True

    def load_inner_widget(self):
        main_w = urwid.Text(self.get_display_text())
        return urwid.Columns([("fixed", 3, self.selected_w), main_w], dividechars=1)

    def keypress(self, size, key):
        """allow subclasses to intercept keystrokes"""
        key = self.__super.keypress(size, key)
        if key:
            key = self.unhandled_keys(size, key)
        return key

    def unhandled_keys(self, size, key):
        """
        Override this method to intercept keystrokes in subclasses.
        Default behavior: Toggle flagged on space, ignore other keys.
        """
        if key == " ":
            self.get_node().toggle_flag()
        else:
            return key

    def update_w(self):
        """Update the attributes of self.widget based on self.flagged.
        """
        suite = self.get_node().get_value()
        test = suite[self.get_node()._key]
        outcome = test.get("outcome")
        self._w.focus_attr = "focus %s" % outcome
        self._w.attr = outcome

        if self.get_node().flagged:
            self.selected_w.set_text("[x]")
        else:
            self.selected_w.set_text("[ ]")

    def get_display_text(self):
        return self.get_node().get_key()


class SingleTestNode(urwid.TreeNode):
    def __init__(self, *args, flagged=False, test_suite=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.flagged = flagged
        self.test_suite = test_suite
        self.test_id = (self.test_suite, self._key)

    def toggle_flag(self):
        self.set_flag(not self.flagged)

    def set_flag(self, flag):
        self.flagged = flag
        self.get_widget().update_w()

        on_flagged(self.test_id, flag)

        self.get_parent().check_flag()

    def load_widget(self):
        return SingleTestWidget(self)

    def check_flag(self):
        if self.test_id in SELECTED_TEST:
            self.flagged = True
        else:
            self.flagged = False

    def refresh(self):
        self.check_flag()

        self.get_widget().update_w()


class TestFileWidget(urwid.TreeWidget):

    unexpanded_icon = urwid.SelectableIcon("▹", 0)
    expanded_icon = urwid.SelectableIcon("▿", 0)

    def __init__(self, *args, **kwargs):
        self.selected_w = urwid.Text("[ ]")
        super().__init__(*args, **kwargs)
        # insert an extra AttrWrap for our own use
        self._w = urwid.AttrWrap(self._w, None)
        self._w.attr = "body"
        self._w.focus_attr = "focus"
        self.update_w()

        self.expanded = True
        self.update_expanded_icon()

    def load_inner_widget(self):
        main_w = urwid.Text(self.get_display_text())
        return urwid.Columns([("fixed", 3, self.selected_w), main_w], dividechars=1)

    def get_display_text(self):
        return self.get_node().get_key()

    def selectable(self):
        return True

    def keypress(self, size, key):
        """allow subclasses to intercept keystrokes"""
        key = self.__super.keypress(size, key)
        if key:
            key = self.unhandled_keys(size, key)
        return key

    def unhandled_keys(self, size, key):
        """
        Override this method to intercept keystrokes in subclasses.
        Default behavior: Toggle flagged on space, ignore other keys.
        """
        if key == " ":
            self.get_node().toggle_flag()
        else:
            return key

    def update_w(self):
        """Update the attributes of self.widget based on self.flagged.
        """
        node = self.get_node()
        if node.flagged:
            if node.all_flagged:
                icon = "x"
            elif node.any_flagged:
                icon = "~"
            else:
                raise ValueError()
            self.selected_w.set_text("[%s]" % icon)
        else:
            self.selected_w.set_text("[ ]")


class TestFileNode(urwid.ParentNode):
    def __init__(self, *args, flagged=False, test_suite=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.flagged = flagged
        self.test_suite = test_suite
        self.all_flagged = False
        self.any_flagged = False

    def load_widget(self):
        return TestFileWidget(self)

    def load_child_keys(self):
        data = self.get_value()
        return sorted(data.get_tests_name(test_file=self._key))

    def set_flag(self, flag):
        self.flagged = flag

        for child_key in self.get_child_keys():
            child = self.get_child_node(child_key)
            child.set_flag(flag)

        self.get_widget().update_w()

        if hasattr(self.get_parent(), "check_flag"):
            self.get_parent().check_flag()

    def check_flag(self):
        data = self.get_value()

        tests = data.get_tests_name(test_file=self._key)
        stests = set()

        for test in tests:
            stests.add((self.get_value(), test))

        self.all_flagged = stests.issubset(SELECTED_TEST)
        self.any_flagged = not stests.isdisjoint(SELECTED_TEST)

        if self.all_flagged or self.any_flagged:
            self.flagged = True
            self.get_widget().update_w()

            if hasattr(self.get_parent(), "check_flag"):
                self.get_parent().check_flag()

        if not self.any_flagged:
            self.flagged = False
            self.get_widget().update_w()

            if hasattr(self.get_parent(), "check_flag"):
                self.get_parent().check_flag()

    def toggle_flag(self):
        self.set_flag(not self.flagged)

    def load_child_node(self, key):
        data = self.get_value()

        test = data[key]

        if test:
            child_class = SingleTestNode
        else:
            child_class = self.__class__

        return child_class(
            data,
            parent=self,
            key=key,
            depth=self.get_depth() + 1,
            flagged=self.flagged,
            test_suite=self.get_value(),
        )

    def refresh(self):
        self._child_keys = None

        self.check_flag()

        for child_key in self.get_child_keys():
            child = self.get_child_node(child_key)

            child.refresh()


class TestSuiteWidget(urwid.TreeWidget):

    unexpanded_icon = urwid.SelectableIcon("▹", 0)
    expanded_icon = urwid.SelectableIcon("▿", 0)

    def __init__(self, *args, **kwargs):
        self.selected_w = urwid.Text("[ ]")
        super().__init__(*args, **kwargs)
        # insert an extra AttrWrap for our own use
        self._w = urwid.AttrWrap(self._w, None)
        self._w.attr = "body"
        self._w.focus_attr = "focus"
        self.update_w()

        self.expanded = True
        self.update_expanded_icon()

    def load_inner_widget(self):
        main_w = urwid.Text(self.get_display_text())
        return urwid.Columns([("fixed", 3, self.selected_w), main_w], dividechars=1)

    def get_display_text(self):
        return self.get_node().get_key()

    def selectable(self):
        return True

    def keypress(self, size, key):
        """allow subclasses to intercept keystrokes"""
        key = self.__super.keypress(size, key)
        if key:
            key = self.unhandled_keys(size, key)
        return key

    def unhandled_keys(self, size, key):
        """
        Override this method to intercept keystrokes in subclasses.
        Default behavior: Toggle flagged on space, ignore other keys.
        """
        if key == " ":
            self.get_node().toggle_flag()
        else:
            return key

    def update_w(self):
        """Update the attributes of self.widget based on self.flagged.
        """
        node = self.get_node()
        if node.flagged:
            if node.all_flagged:
                icon = "x"
            elif node.any_flagged:
                icon = "~"
            else:
                raise ValueError()
            self.selected_w.set_text("[%s]" % icon)
        else:
            self.selected_w.set_text("[ ]")


class TestSuiteNode(urwid.ParentNode):
    def __init__(self, *args, flagged=False, **kwargs):
        super().__init__(*args, **kwargs)
        self.flagged = flagged
        self.all_flagged = False
        self.any_flagged = False

    def load_widget(self):
        return TestSuiteWidget(self)

    def load_child_keys(self):
        data = self.get_value()
        return sorted(data.get_test_files())

    def set_flag(self, flag):
        self.flagged = flag

        for child_key in self.get_child_keys():
            child = self.get_child_node(child_key)
            child.set_flag(flag)

        self.get_widget().update_w()

        if hasattr(self.get_parent(), "check_flag"):
            self.get_parent().check_flag()

    def check_flag(self):
        data = self.get_value()

        tests = data.get_tests_name()
        stests = set()

        for test in tests:
            stests.add((self.get_value(), test))

        self.all_flagged = stests.issubset(SELECTED_TEST)
        self.any_flagged = not stests.isdisjoint(SELECTED_TEST)

        if self.all_flagged or self.any_flagged:
            self.flagged = True
            self.get_widget().update_w()

            if hasattr(self.get_parent(), "check_flag"):
                self.get_parent().check_flag()

        if not self.any_flagged:
            self.flagged = False
            self.get_widget().update_w()

            if hasattr(self.get_parent(), "check_flag"):
                self.get_parent().check_flag()

    def toggle_flag(self):
        self.set_flag(not self.flagged)

    def load_child_node(self, key):
        data = self.get_value()

        child_class = TestFileNode

        return child_class(
            data, parent=self, key=key, depth=self.get_depth() + 1, flagged=self.flagged
        )

    def refresh(self):
        # signals.emit_signal(self.get_widget(), "modified")
        self._child_keys = None

        self.check_flag()

        for child_key in self.get_child_keys():
            child = self.get_child_node(child_key)

            child.refresh()


class RootTreeWidget(urwid.TreeWidget):
    """ Display widget for leaf nodes """

    def get_display_text(self):
        return "Tests"


class RootParentNode(urwid.ParentNode):
    def load_widget(self):
        return RootTreeWidget(self)

    def load_child_keys(self):
        data = self.get_value()
        return list(data.get_test_suites())

    def load_child_node(self, key):
        data = self.get_value()
        suite = data.suites[key]
        return TestSuiteNode(suite, parent=self, key=key, depth=self.get_depth() + 1)

    def refresh(self):
        # signals.emit_signal(self.get_widget(), "modified")
        self._child_keys = None

        for child_key in self.get_child_keys():
            child = self.get_child_node(child_key)

            child.refresh()
