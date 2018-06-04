#!/usr/bin/env python
from __future__ import print_function

import os
import threading
import weakref
from queue import Empty, Queue
from threading import Lock

import npyscreen
import websocket

RETURN = []

try:
    import thread
except ImportError:
    import _thread as thread

# TODO: Extract dict based TreeData somewhere else


class TestResultTreeLine(npyscreen.TreeLineSelectable):
    def display_value(self, vl):
        # TODO CHECK HOW MANY TIMES THIS FUNCTION IS CALLED
        if vl:
            if isinstance(vl, TestResultData):
                if hasattr(vl, "outcome"):
                    if vl.outcome == "passed":
                        self.color = "GOOD"
                    elif vl.outcome == "failed":
                        self.color = "DANGER"
                    elif vl.outcome == "skipped":
                        self.color = "NO_EDIT"
                    elif vl.outcome:
                        raise NotImplementedError(vl.outcome)
        return super().display_value(vl)


class Tree(npyscreen.MLTreeMultiSelect):
    _contained_widgets = TestResultTreeLine

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.lock = Lock()

    def display(self, *args, **kwargs):
        # Makes the Tree thread-safe
        with self.lock:
            return super().display(*args, **kwargs)

    def set_up_handlers(self):
        super().set_up_handlers()
        self.handlers.update({ord("r"): self.launch_tests})

    def launch_tests(self, _):
        tests_to_run = {}
        selected_objects = self.get_selected_objects()
        for _object in selected_objects:
            if _object and isinstance(_object, TestResultData):
                test_id = _object.test_id
                suite = _object._parent._parent.suite_name
                tests_to_run.setdefault(suite, []).append(test_id)

        import json

        msg = json.dumps(
            {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "run_selected",
                "params": tests_to_run,
            }
        )
        WS.send(msg)
        # raise ZeroDivisionError(list(self.get_selected_objects()))


class TestResultData(npyscreen.TreeData):
    def __init__(
        self,
        content=None,
        parent=None,
        selected=False,
        selectable=True,
        highlight=False,
        expanded=True,
        ignore_root=True,
        sort_function=None,
        outcome=None,
        _id=None,
    ):
        super().__init__(
            content,
            parent,
            selected,
            selectable,
            highlight,
            expanded,
            ignore_root,
            sort_function,
        )
        self.test_id = _id
        self.outcome = outcome


class TestFileTreeData(npyscreen.TreeData):
    CHILDCLASS = TestResultData

    def __init__(self, _id, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.test_file = _id
        self._children_dict = {}

    def new_child(self, _id, *args, **keywords):
        if self.CHILDCLASS:
            cld = self.CHILDCLASS
        else:
            cld = type(self)
        c = cld(parent=self, _id=_id, *args, **keywords)
        proxy = weakref.proxy(c)
        self._children_dict[_id] = proxy
        self._children.append(c)
        return proxy

    def get_children_by_id(self, _id):
        return self._children_dict[_id]


class SuiteTreeData(npyscreen.TreeData):
    CHILDCLASS = TestFileTreeData

    def __init__(self, _id, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.suite_name = _id
        self._children_dict = {}

    def new_child(self, _id, *args, **keywords):
        if self.CHILDCLASS:
            cld = self.CHILDCLASS
        else:
            cld = type(self)
        c = cld(parent=self, _id=_id, *args, **keywords)
        proxy = weakref.proxy(c)
        self._children_dict[_id] = proxy
        self._children.append(c)
        return proxy

    def get_children_by_id(self, _id):
        return self._children_dict[_id]


class MyTreeData(npyscreen.TreeData):
    CHILDCLASS = SuiteTreeData

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._children_dict = {}

    def new_child(self, _id, *args, **keywords):
        if self.CHILDCLASS:
            cld = self.CHILDCLASS
        else:
            cld = type(self)
        c = cld(parent=self, _id=_id, *args, **keywords)
        proxy = weakref.proxy(c)
        self._children_dict[_id] = proxy
        self._children.append(c)
        return proxy

    def get_children_by_id(self, _id):
        return self._children_dict[_id]


class MainForm(npyscreen.Form):
    # FRAMED = False
    # BLANK_COLUMNS_RIGHT = 0
    # BLANK_COLUMNS_BASE = 0
    # DEFAULT_X_OFFSET = 0

    # def edit(self):
    #     """Edit the fields until the user selects the ok button added in the lower right corner. Button will
    #     be removed when editing finishes"""
    #     print("EDIT!")
    #     # Add ok button. Will remove later
    #     tmp_rely, tmp_relx = self.nextrely, self.nextrelx
    #     my, mx = self.curses_pad.getmaxyx()
    #     ok_button_text = self.__class__.OK_BUTTON_TEXT
    #     my -= self.__class__.OK_BUTTON_BR_OFFSET[0]
    #     mx -= len(ok_button_text)+self.__class__.OK_BUTTON_BR_OFFSET[1]
    #     self.ok_button = self.add_widget(self.__class__.OKBUTTON_TYPE, name=ok_button_text, rely=my, relx=mx, use_max_space=True)
    #     ok_button_postion = len(self._widgets__)-1
    #     self.ok_button.update()
    #     # End add buttons
    #     self.editing=True
    #     if self.editw < 0: self.editw=0
    #     if self.editw > len(self._widgets__)-1:
    #         self.editw = len(self._widgets__)-1
    #     if not self.preserve_selected_widget:
    #         self.editw = 0
    #     if not self._widgets__[self.editw].editable: self.find_next_editable()

    #     self.display()

    #     while not (self._widgets__[self.editw].editable and not self._widgets__[self.editw].hidden):
    #         self.editw += 1
    #         if self.editw > len(self._widgets__)-1:
    #             self.editing = False
    #             return False

    #     while self.editing:
    #         if not self.ALL_SHOWN: self.on_screen()
    #         self.while_editing(weakref.proxy(self._widgets__[self.editw]))
    #         if not self.editing:
    #             break
    #         self._widgets__[self.editw].edit()
    #         self._widgets__[self.editw].display()

    #         self.handle_exiting_widgets(self._widgets__[self.editw].how_exited)

    #         if self.editw > len(self._widgets__)-1: self.editw = len(self._widgets__)-1
    #         if self.ok_button.value:
    #             self.editing = False

    #     self.nextrely, self.nextrelx = tmp_rely, tmp_relx
    #     self.display()

    #     self.editing = False
    #     self.erase()
    pass


class TestApp(npyscreen.NPSApp):
    def __init__(self, queue):
        super().__init__()
        self.queue = queue

    def main(self):
        # npyscreen.setTheme(npyscreen.Themes.ColorfulTheme)
        F = MainForm(name="Balto")
        self.tree = F.add(Tree)

        self.root = MyTreeData(
            content="All Tests Suites", selectable=True, ignore_root=False
        )
        self.tree.values = self.root

        th = threading.Thread(target=self._read_queue)
        th.setDaemon(True)
        th.start()

        # time.sleep(999)

        # print(self.root._children_dict)

        # time.sleep(999)

        F.edit()

        self.queue.put(None)

        global RETURN
        RETURN = self.tree.get_selected_objects()

    def _read_queue(self):
        while True:
            events = []
            # Wait for a first event
            event = self.queue.get()

            if not event:
                return

            events.append(event)

            # Empty the queue
            try:
                for i in range(10):
                    event = self.queue.get_nowait()
                    # print("EVENT", event)
                    if event:
                        events.append(event)
            except Empty:
                pass

            # Process the events
            if not events:
                return

            need_to_clear = False

            for data in events:
                msg_type = data["_type"]

                if msg_type == "session_start":
                    # TODO: Implement progress bar
                    continue
                elif msg_type == "session_end":
                    # TODO: Implement progress bar
                    continue
                elif msg_type == "test_collection":
                    r = self.process_test_collection(data)
                    need_to_clear = need_to_clear or r
                elif msg_type == "test_result":
                    r = self.process_test_collection(data)
                    need_to_clear = need_to_clear or r
                else:
                    raise NotImplementedError(msg_type, data)

            if need_to_clear is True:
                self.tree.clearDisplayCache()
                self.tree.update(clear=True)

            self.tree.display()

    def process_test_collection(self, data):
        need_to_clear = False

        suite_name = data["suite_name"]
        test_id = data["id"]
        test_name = data["test_name"]
        test_file = data["file"]
        test = data

        # Suite
        try:
            child = self.root.get_children_by_id(suite_name)
        except KeyError:
            child = self.root.new_child(
                suite_name, content=suite_name, selectable=True, ignore_root=False
            )
            # We need to clear the cache when we add a new child
            need_to_clear = True

        # Test file
        try:
            test_file_node = child.get_children_by_id(test_file)
        except KeyError:
            test_file_node = child.new_child(test_file, content=test_file)
            # We need to clear the cache when we add a new child
            need_to_clear = True

        # Test
        try:
            test_node = test_file_node.get_children_by_id(test_id)
        except KeyError:
            test_node = test_file_node.new_child(
                test_id, content=test_name, outcome=None
            )
            # We need to clear the cache when we add a new child
            need_to_clear = True

        # Outcome
        outcome = data.get("outcome")
        if outcome and test_node != outcome:
            test_node.outcome = outcome
            need_to_clear = True

        return need_to_clear


def on_message(ws, message):
    # print("MESSAGE", message)
    # raise Exception(type(message))
    import json

    params = json.loads(message).get("params")
    if params:
        QUEUE.put(json.loads(message)["params"])
    # print("MSG", message)


def on_error(ws, error):
    raise Exception(error)
    # print("ERROR", error)


def on_close(ws):
    print("### closed ###")


def on_open(ws):
    import json

    ws.send(
        json.dumps({"jsonrpc": "2.0", "id": 0, "method": "subscribe", "params": "test"})
    )

    ws.send(
        json.dumps({"jsonrpc": "2.0", "id": 1, "method": "collect_all", "params": None})
    )


WS = websocket.WebSocketApp(
    "ws://localhost:%d/" % int(os.environ["BALTO_PORT"]),
    on_message=on_message,
    on_close=on_close,
    on_open=on_open,
)
QUEUE = Queue()


def main():
    wst = threading.Thread(target=WS.run_forever)
    wst.daemon = True
    wst.start()

    App = TestApp(QUEUE)
    App.run()


if __name__ == "__main__":
    main()
