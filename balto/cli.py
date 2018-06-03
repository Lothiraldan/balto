""" BAlto is a Language independent Test Orchestrator.
"""
from __future__ import print_function, unicode_literals

import argparse
import os
import shutil
import subprocess
import time
import webbrowser
from multiprocessing import Process

from balto.server import server


def main():
    print("RUNNING CLI FROM", __file__)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "directory",
        help="The directory LITR should start looking for its config file")
    parser.add_argument(
        "--interface",
        "-i",
        help="which interface to start",
        action="store",
        default="curses")
    args = parser.parse_args()

    # Launch the server
    balto_server_full_path = shutil.which("balto-server")
    server_args = [balto_server_full_path, args.directory]
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
            webbrowser.open("http://localhost:%d/interface/balto_react/build/index.html" % port)
            _server.join()
    finally:
        _server.terminate()


if __name__ == "__main__":
    main()
