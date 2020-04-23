# -*- coding: utf-8 -*-
# Copyright 2018-2020 by Boris Feld

import subprocess
import shlex

# TODO: Add support for more editors
# TODO: Add support for flatpak
EDITOR_MAP = {
    "codium": {"cmd": "codium -g '{file}:{line}'", "tty": False},
    "nano": {"cmd": "nano +{line} {file}", "tty": True},
    "subl": {"cmd": "subl '{file}:{line}'", "tty": False},
}


def open_editor(editor: str, file: str, line: int, allow_tty: bool):
    # TODO: Raise specific error when editor is not found
    editor_details = EDITOR_MAP[editor]

    if not allow_tty and editor_details["tty"]:
        raise ValueError("Refusing to launch tty editor %r" % editor)

    editor_cmd = editor_details["cmd"].format(file=file, line=line)

    # TODO: Should we open terminal based editors like Nano?
    process = subprocess.Popen(
        shlex.split(editor_cmd), close_fds=True, stdout=subprocess.PIPE, stdin=subprocess.PIPE, stderr=subprocess.PIPE
    )
