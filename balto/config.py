""" Config parsing utilities
"""
import json
import tempfile
from os.path import isfile, join

from tomlkit import document, dumps, loads

from balto.exceptions import LegacyJsonConfigFound, NoConfigFileFound


class SingleTestSuiteConfig:
    def __init__(self, parsed_config, tool_override=None):
        self.config = parsed_config
        self.tool_override = tool_override

    def get_tool(self):
        """Return the tool or the overrided one
        """
        if self.tool_override is not None:
            return self.tool_override
        return self.config["tool"]

    def __getitem__(self, name):
        return self.config[name]


def find_configuration_file(directory):
    # Read the toml config first so the old versions can still read the json
    # file
    toml_config = join(directory, ".balto.toml")
    if isfile(toml_config):
        return toml_config
    json_config = join(directory, ".balto.json")
    if isfile(json_config):
        return json_config
    return None


def convert_json_config_to_toml(json_config):
    name = json_config[0]["name"]
    tool = json_config[0]["tool"]

    toml_config = document()
    toml_config.add("name", name)
    toml_config.add("tool", tool)

    return dumps(toml_config)


def parse_toml_config(raw_config, tool_override=None):
    parsed_config = loads(raw_config)
    return SingleTestSuiteConfig(parsed_config, tool_override)


def read_json_config(config_filepath):
    with open(config_filepath, "r") as config_file:
        raw_config = json.load(config_file)

    return raw_config


def find_and_validate_config(directory):
    config_path = find_configuration_file(directory)

    if config_path is None:
        raise NoConfigFileFound(directory)

    # Legacy JSON config
    if config_path.endswith(".balto.json"):
        new_toml_config = convert_json_config_to_toml(read_json_config(config_path))
        raise LegacyJsonConfigFound(new_toml_config)

    return config_path


def read_toml_config(config_path, tool_override=None):
    with open(config_path, "r") as config_file:
        config = parse_toml_config(config_file.read(), tool_override)

    return config


def create_temporary_config_file():
    """ Create a minimal config file with some default values
    """
    toml_config = document()
    toml_config.add("name", "Test Suite")

    tmp_config_file = tempfile.NamedTemporaryFile(delete=False)

    with tmp_config_file:
        content = dumps(toml_config).encode("utf-8")
        tmp_config_file.write(content)

    return tmp_config_file.name
