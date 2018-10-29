""" BAlto is a Language independent Test Orchestrator.

All code related to the starting process of CLI applications, argument
parsing, configuration handling, etc...
"""

import argparse
import tempfile

from balto._logging import setup_logging
from balto.config import create_temporary_config_file, find_and_validate_config
from balto.exceptions import NoConfigFileFound


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
        default=None,
    )
    return parser.parse_args(args)


def start(args):
    parsed_args = parse_args(args)

    setup_logging(parsed_args.verbose, parsed_args.debug)

    try:
        config_path = find_and_validate_config(parsed_args.directory)
    except NoConfigFileFound:
        if parsed_args.tool is not None:
            config_path = create_temporary_config_file()
        else:
            raise

    return parsed_args, config_path
