""" BAlto is a Language independent Test Orchestrator.
"""
from __future__ import print_function, unicode_literals

import argparse
import os
import shutil
import subprocess
import time
import webbrowser


def main():
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
    port = 8888

    try:
        server = subprocess.Popen(server_args)

        # Let the server starts
        time.sleep(0.5)

        # Launch the interface
        if args.interface == "curses":
            balto_interface = shutil.which("balto-curses")

            env = os.environ.copy()
            env["BALTO_PORT"] = "%d" % port

            interface = subprocess.Popen([balto_interface], env=env)
            interface.wait()
        elif args.interface == "web":
            webbrowser.open("http://localhost:%d/interface" % port)
            server.wait()
    finally:
        server.terminate()


if __name__ == "__main__":
    main()
