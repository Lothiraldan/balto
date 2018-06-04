""" BAlto is a Language independent Test Orchestrator.
"""
from __future__ import print_function, unicode_literals

import json
import logging
import sys
import argparse
import asyncio
from os.path import join, dirname, isfile

from balto.config import read_config
from balto.event_emitter import EventEmitter
from balto.store import Tests

import aiohttp


from aiohttp.web import Application, run_app, FileResponse, HTTPNotFound
from aiohttp_json_rpc import JsonRpc
import asyncio


def get_static_path():
    if getattr(sys, "frozen", False):
        return join(sys._MEIPASS, "balto/web_interfaces")
    else:
        return join(dirname(__file__), "web_interfaces")


async def interface_handle(request):
    interface_name = request.match_info["interface"]
    local_directory = join(dirname(__file__), "web_interfaces", interface_name)
    index_file = join(local_directory, "index.html")

    if not isfile(index_file):
        index_file = join(local_directory, "build", "index.html")

    if isfile(index_file):
        return FileResponse(index_file)
    return HTTPNotFound()


def server(directory):
    loop = asyncio.get_event_loop()

    # EM
    em = EventEmitter(loop)

    # Read config
    config_filepath = join(directory, ".balto.json")
    suites = read_config(config_filepath, em)

    # Tests
    tests = Tests(suites)

    async def collect_all(request):
        print("COLLECT ALL")
        tasks = [
            suite.collect_all(directory, em, loop=loop) for suite in suites.values()
        ]
        await asyncio.gather(*tasks, loop=loop)
        return "ok"

    async def run_all(request):
        tasks = [
            suite.launch_all(directory, em, loop=loop) for suite in suites.values()
        ]
        await asyncio.gather(*tasks, loop=loop)
        return "ok"

    async def run_selected(request):
        tasks = []
        print("GOT PARAMS", request.params)
        for suite_name, suite_tests in request.params.items():
            suite = suites[suite_name]
            tasks.append(suite.launch_tests(directory, em, loop, suite_tests))

        await asyncio.gather(*tasks)
        return "ok"

    rpc = JsonRpc()
    logging.getLogger("aiohttp-json-rpc.server").setLevel(logging.DEBUG)

    async def forward_notifications(message):
        print("MESSAGE", message)
        for client in rpc.clients:
            data = {"jsonrpc": "2.0", "id": None, "method": "test", "params": message}
            r = await client.ws.send_str(json.dumps(data))
            print("R", r)
        # await rpc.notify("test", message)

    em.register(forward_notifications)

    loop = asyncio.get_event_loop()
    rpc.add_methods(("", collect_all), ("", run_selected), ("", run_all))
    rpc.add_topics("test")

    app = Application(loop=loop, debug=True)
    web_interfaces_route = get_static_path()
    print("WEB INTERFACES", web_interfaces_route)
    app.router.add_static(
        "/interface/", web_interfaces_route, show_index=True, name="static"
    )
    app.router.add_route("*", "/", rpc)

    run_app(app, port=8889)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "directory", help="The directory LITR should start looking for its config file"
    )
    args = parser.parse_args()

    server(args.directory)


if __name__ == "__main__":
    main()
