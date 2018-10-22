from os.path import dirname, join

from balto.config import find_configuration_file

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
