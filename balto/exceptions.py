class BaltoException(Exception):
    pass


class NoConfigFileFound(BaltoException):
    def __init__(self, directory):
        self.directory = directory
        self.msg = (
            "Couldn't find a configuration file in directory: %s\n"
            + "Either create a file or pass the `--tool` option"
        )

    def __str__(self):
        return self.msg % self.directory


class LegacyJsonConfigFound(BaltoException):
    def __init__(self, equivalent_toml_config):
        self.equivalent_toml_config = equivalent_toml_config
        self.msg = "Legacy configuration found, please replace the `.balto.json` file by a `.balto.toml` file with the following content:\n\n%s"

    def __str__(self):
        return self.msg % self.equivalent_toml_config
