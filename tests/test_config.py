import json
import pytest

from os.path import dirname, join

from balto.config import (
    convert_json_config_to_toml,
    find_configuration_file,
    parse_toml_config,
    find_and_validate_config,
)

from balto.exceptions import NoConfigFileFound, LegacyJsonConfigFound

NO_CONFIG_DIR = join(dirname(__file__), "test_directories", "no_config")

CONFIG_JSON_DIR = join(dirname(__file__), "test_directories", "balto_json")

CONFIG_TOML_DIR = join(dirname(__file__), "test_directories", "balto_toml")


def test_find_no_configuration_file():
    assert find_configuration_file(NO_CONFIG_DIR) == None


def test_find_json_file():
    expected = join(CONFIG_JSON_DIR, ".balto.json")
    assert find_configuration_file(CONFIG_JSON_DIR) == expected


def test_find_toml_file():
    expected = join(CONFIG_TOML_DIR, ".balto.toml")
    assert find_configuration_file(CONFIG_TOML_DIR) == expected


def test_convert_json_config_to_toml():
    name = "Acceptance Test Suite Subprocess"
    tool = "pytest"
    json_config = [{"tool": tool, "name": name}]

    config = convert_json_config_to_toml(json_config)

    expected = """name = "%s"
tool = "%s"
"""

    assert config == expected % (name, tool)


def test_parse_toml_config():
    name = "Acceptance Test Suite Subprocess"
    tool = "pytest"
    raw_config = """name = "%s"
tool = "%s"
""" % (
        name,
        tool,
    )
    config = parse_toml_config(raw_config)

    assert config["name"] == name
    assert config["tool"] == tool


def test_parse_toml_config_runners():
    name = "Acceptance Test Suite Subprocess"
    tool = "pytest"
    command_override = "not-pytest-litf"
    raw_config = """name = "%s"
tool = "%s"

[subprocess]
command = "not-pytest-litf"
""" % (
        name,
        tool,
    )
    config = parse_toml_config(raw_config)

    assert config["subprocess"]["command"] == command_override


def test_find_and_validate_no_config():
    with pytest.raises(NoConfigFileFound) as excinfo:
        find_and_validate_config(NO_CONFIG_DIR)

    assert excinfo.value.directory == NO_CONFIG_DIR


def test_find_and_validate_json_config():
    with pytest.raises(LegacyJsonConfigFound) as excinfo:
        find_and_validate_config(CONFIG_JSON_DIR)

    # Compute expected new config
    with open(join(CONFIG_JSON_DIR, ".balto.json")) as config_file:
        json_config = json.load(config_file)
    config = convert_json_config_to_toml(json_config)

    assert excinfo.value.equivalent_toml_config == config


def test_find_and_validate_toml_config():
    config = find_and_validate_config(CONFIG_TOML_DIR)

    assert config["name"] == "Test Suite"
    assert config["tool"] == "pytest"
