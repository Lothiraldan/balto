""" Config parsing utilities
"""
import json
from os.path import isfile, join

from tomlkit import document, dumps, loads

from balto.suite import TestSuite


class SingleTestSuiteConfig:
    def __init__(self, parsed_config):
        self.config = parsed_config

    def __getitem__(self, name):
        return self.config[name]


def find_configuration_file(directory):
    json_config = join(directory, ".balto.json")
    if isfile(json_config):
        return json_config
    toml_config = join(directory, ".balto.toml")
    if isfile(toml_config):
        return toml_config
    return None


def convert_json_config_to_toml(json_config):
    name = json_config[0]["name"]
    tool = json_config[0]["tool"]

    toml_config = document()
    toml_config.add("name", name)
    toml_config.add("tool", tool)

    return dumps(toml_config)


def parse_toml_config(raw_config):
    parsed_config = loads(raw_config)
    return SingleTestSuiteConfig(parsed_config)


def read_config(config_filepath, runner, em):
    with open(config_filepath, "r") as config_file:
        raw_config = json.load(config_file)

    return parse_config(raw_config, runner, em)


def parse_config(config, runner, em):
    if not isinstance(config, list):
        config = [config]

    test_suites = dict()

    for suite_id, suite_config in enumerate(config):
        suite_name = suite_config.pop("name", "Suite %d" % (suite_id + 1))
        test_suites[suite_name] = TestSuite(
            suite_name, **suite_config, runner=runner, em=em
        )

    return test_suites
