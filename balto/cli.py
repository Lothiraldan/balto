""" BAlto is a Language independent Test Orchestrator.
"""
from __future__ import print_function, unicode_literals

import argparse
import logging
import os
import shutil
import subprocess
import time
import webbrowser
from multiprocessing import Process

from balto._logging import setup_logging
from balto.server import server

LOGGER = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "directory", help="The directory LITR should start looking for its config file"
    )
    parser.add_argument(
        "--interface",
        "-i",
        help="which interface to start",
        action="store",
        default="web",
    )
    parser.add_argument(
        "--runner",
        "-r",
        help="which runner to use",
        action="store",
        default="subprocess",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        help="activate the verbose mode",
        action="store_true",
        default=False,
    )
    parser.add_argument(
        "--debug", help="activate the debug mode", action="store_true", default=False
    )
    args = parser.parse_args()

    setup_logging(args.verbose, args.debug)

    # Launch the server
    port = 8889

    try:
        _server = Process(target=server, args=(args.directory,))
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
