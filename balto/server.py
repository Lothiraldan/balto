""" BAlto is a Language independent Test Orchestrator.
"""
from __future__ import print_function, unicode_literals

import argparse
import asyncio
from os.path import abspath, join, dirname, isfile

from balto.config import read_config
from balto.displayer.cli_simple import SimpleTestInterface
from balto.displayer.curses import CursesTestInterface
from balto.event_emitter import EventEmitter
from balto.store import Tests

import aiohttp


from aiohttp.web import Application, run_app, FileResponse, HTTPNotFound
from aiohttp_json_rpc import JsonRpc
import asyncio

from aiohttp_index import IndexMiddleware


async def interface_handle(request):
    interface_name = request.match_info['interface'] 
    local_directory = join(dirname(__file__), "web_interfaces", interface_name)
    index_file = join(local_directory, "index.html")

    if isfile(index_file):
        return FileResponse(index_file)
    return HTTPNotFound()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "directory",
        help="The directory LITR should start looking for its config file")
    args = parser.parse_args()

    loop = asyncio.get_event_loop()

    # EM
    em = EventEmitter(loop)

    # Read config
    config_filepath = join(args.directory, '.balto.json')
    suites = read_config(config_filepath, em)

    # Tests
    tests = Tests(suites)

    async def collect_all(request):
        tasks = [suite.collect_all(args.directory, em, loop=loop) for suite in suites.values()]
        await asyncio.gather(*tasks, loop=loop)
        return "ok"

    async def run_all(request):
        tasks = [suite.launch_all(args.directory, em, loop=loop) for suite in suites.values()]
        await asyncio.gather(*tasks, loop=loop)
        return "ok"

    async def run_selected(request):
        tasks = []
        for suite_name, suite_tests in request.params.items():
            suite = suites[suite_name]
            tasks.append(suite.launch_tests(args.directory, em, loop, suite_tests))

        await asyncio.gather(*tasks)
        return "ok"

    rpc = JsonRpc() 

    async def forward_notifications(message):
        print("MESSAGE", message)
        rpc.notify("test", message)
    em.register(forward_notifications)

    loop = asyncio.get_event_loop()
    rpc.add_methods(
        ('', collect_all),
        ('', run_selected),
        ('', run_all)
    )
    rpc.add_topics(
        'test'
    )

    app = Application(loop=loop, middlewares=[IndexMiddleware()], debug=True)
    # app.router.add_get('/interface/{interface}', interface_handle)
    app.router.add_static('/interface/', join(dirname(__file__), "web_interfaces"), show_index=True)
    app.router.add_route('*', '/', rpc)

    run_app(app, port=8888)


if __name__ == "__main__":
    main()
