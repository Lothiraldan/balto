# -*- coding: utf-8 -*-
# Copyright 2018-2019 by Boris Feld

from __future__ import print_function, unicode_literals

from typing import Dict, List

from pydantic import BaseModel


class SingleSuiteSelectedTests(BaseModel):
    files: List[str] = []
    nodeids: List[str] = []


class SelectedTests(BaseModel):
    tests: Dict[str, SingleSuiteSelectedTests]
