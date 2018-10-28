""" BAlto is a Language independent Test Orchestrator.

All code related to the starting process of CLI applications, argument
parsing, configuration handling, etc...
"""

import argparse


def parse_args(args):
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
    parser.add_argument(
        "--tool",
        help="override the tool defined in .balto.toml",
        action="store",
        default=False,
    )
    return parser.parse_args(args)
