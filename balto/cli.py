# -*- coding: utf-8 -*-
# Copyright 2018-2021 by Boris Feld

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

from balto.server import setup_app_and_run
from balto.start import start

LOGGER = logging.getLogger(__name__)


def main():
    args, config_path = start(sys.argv[1:])

    # Launch the server
    port = 8889

    try:
        _server = Process(
            target=setup_app_and_run,
            args=(args.directory, config_path, args.runner, args.tool),
        )
        _server.start()
        # server = subprocess.Popen(server_args)

        # Let the server starts
        time.sleep(1)

        # Launch the interface
        if args.interface == "web":
            webbrowser.open(
                "http://localhost:%d/interface/balto_react/build/index.html" % port
            )
            _server.join()
    finally:
        _server.terminate()


if __name__ == "__main__":
    main()
