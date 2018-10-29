""" BAlto is a Language independent Test Orchestrator.
"""
from __future__ import print_function, unicode_literals

import logging
import os
import shutil
import subprocess
import sys
import time
import webbrowser
from multiprocessing import Process

from balto.server import server
from balto.start import start

LOGGER = logging.getLogger(__name__)


def main():
    args, config_path = start(sys.argv[1:])

    # Launch the server
    port = 8889

    try:
        _server = Process(
            target=server, args=(args.directory, config_path, args.runner, args.tool)
        )
        _server.start()
        # server = subprocess.Popen(server_args)

        # Let the server starts
        time.sleep(1)

        # Launch the interface
        if args.interface == "curses":
            balto_interface = shutil.which("balto-curses")

            env = os.environ.copy()
            env["BALTO_PORT"] = "%d" % port

            interface = subprocess.Popen([balto_interface], env=env)
            interface.join()
        elif args.interface == "web":
            webbrowser.open(
                "http://localhost:%d/interface/balto_react/build/index.html" % port
            )
            _server.join()
    finally:
        _server.terminate()


if __name__ == "__main__":
    main()
