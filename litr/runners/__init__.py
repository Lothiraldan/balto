import json

def command_formatter(tool, tests_to_run, collect_only):
    base_cmd = "%s-litf" % tool

    args = {}

    if collect_only:
        args["collect-only"] = True

    if tests_to_run:
        args["files"] = tests_to_run

    args = json.dumps(args)
    return base_cmd, args