# -*- coding: utf-8 -*-
# Copyright 2018-2020 by Boris Feld

import subprocess
import shlex

EDITOR_MAP = {
    "codium": "codium -g '{file}:{line}'",
    "nano": "nano +{line} {file}",
    "subl": "subl '{file}:{line}'",
}


def open_editor(editor: str, file: str, line: int):
    # TODO: Raise specific error when editor is not found
    editor_cmd = EDITOR_MAP[editor].format(file=file, line=line)

    # TODO: Should we open terminal based editors like Nano?
    subprocess.Popen(
        shlex.split(editor_cmd), close_fds=True, stdout=None, stdin=None, stderr=None
    )
