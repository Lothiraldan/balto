# -*- coding: utf-8 -*-
# Copyright 2018-2020 by Boris Feld

from __future__ import print_function, unicode_literals
import os
import asyncio
import json
import logging
import sys
from copy import copy
from os.path import dirname, join
from typing import List, Dict

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from starlette.websockets import WebSocket, WebSocketDisconnect
from uvicorn import Config, Server

from .config import read_toml_config
from .event_emitter import EventEmitter
from .models import SelectedTests, SingleSelectedTest
from .start import start
from .store import MultipleTestSuite, Tests
from .suite import TestSuite
from .editor import open_editor

LOGGER = logging.getLogger(__name__)

SUITES = MultipleTestSuite()


async def process_notification(message):
    message = copy(message)
    msg_type = message.pop("_type")
    if msg_type == "test_collection":
        process_test_collection(message, SUITES)
    elif msg_type == "test_result":
        process_test_result(message, SUITES)
    else:
        print("Message", message)


def process_test_collection(message, suites):
    suite = message["suite_name"]
    # The run_id doesn't make sense here
    message.pop("run_id")
    suites[suite].update_test(message)


def process_test_result(message, suites):
    suite = message["suite_name"]
    # The run_id doesn't make sense here
    message.pop("run_id")
    suites[suite].update_test(message)


class WebsocketClients(object):
    def __init__(self):
        self.clients: List[WebSocket] = []

    def add(self, client):
        self.clients.append(client)

    def remove(self, client):
        self.clients.remove(client)  # TODO: O(n) operation

    async def broadcast(self, text):
        for client in self.clients:
            await client.send_text(text)


app = FastAPI()


def setup_app_and_run(directory, config_path, runner, tool_override):
    uvicorn_config = Config(app, host="127.0.0.1", port=8889, log_level="info")
    uvicorn_config.setup_event_loop()
    server = Server(uvicorn_config)

    app.loop = asyncio.get_event_loop()
    # EM
    app.em = EventEmitter(app.loop)

    config = read_toml_config(config_path, tool_override)

    # TODO: Re-add support for multiple test suites
    app.suite = TestSuite(config["name"], runner, app.em, config)
    app.suites: Dict[str, TestSuite] = {config["name"]: app.suite}

    # Tests
    app.tests = Tests(app.suites)

    app.ws_client = WebsocketClients()
    app.directory = directory

    async def forward_notifications(message):
        LOGGER.debug(
            "Forwarding to %d clients: %r", len(app.ws_client.clients), message
        )
        data = {"jsonrpc": "2.0", "id": None, "method": "test", "params": message}
        await app.ws_client.broadcast(json.dumps(data))

    app.em.register(forward_notifications)
    app.em.register(process_notification)

    app.loop.run_until_complete(server.serve())


origins = ["*"]  # TODO: Restrict

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/collect_all/")
async def collect_all():
    LOGGER.info("Collect ALL")
    tasks = [
        app.suite.collect_all(app.directory, app.em, loop=app.loop)
        for suite in app.suites.values()
    ]
    await asyncio.gather(*tasks, loop=app.loop)
    return "ok"


@app.post("/run_all/")
async def run_all():
    LOGGER.info("Run ALL")
    tasks = [
        suite.launch_all(app.directory, app.em, loop=app.loop)
        for suite in app.suites.values()
    ]
    await asyncio.gather(*tasks, loop=app.loop)
    return "ok"


@app.post("/run_selected/")
async def run_selected(selected_test: SelectedTests):
    tasks = []
    LOGGER.info("Run selected: %r", selected_test.tests)
    for suite_name, suite_tests in selected_test.tests.items():
        suite = app.suites[suite_name]
        if suite_tests.full:
            tasks.append(suite.launch_all(app.directory, app.em, app.loop))
        else:
            tasks.append(
                suite.launch_tests(app.directory, app.em, app.loop, suite_tests.dict())
            )

    await asyncio.gather(*tasks)
    return "ok"


import subprocess


@app.post("/edit_test/")
async def edit_test(selected_test: SingleSelectedTest):
    # Get file path and lines from the SUITES
    suite = SUITES[selected_test.suite]
    test = suite.tests[selected_test.test_id]

    # TODO: Read also editor from config
    editor = os.environ["EDITOR"].split()[0]
    open_editor(editor, test.file, test.line, allow_tty=False)

    return "ok"


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    app.ws_client.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            print("DATA", data)
    except WebSocketDisconnect:
        app.ws_client.remove(websocket)


def get_static_path():
    if getattr(sys, "frozen", False):
        return join(sys._MEIPASS, "balto/web_interfaces")
    else:
        return join(dirname(__file__), "web_interfaces")


app.mount("/interface/", StaticFiles(directory=get_static_path()), name="static")


def main():
    args, config_path = start(sys.argv[1:])

    setup_app_and_run(args.directory, config_path, args.runner, args.tool)
