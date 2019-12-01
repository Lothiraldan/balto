# -*- coding: utf-8 -*-
# Copyright 2018-2020 by Boris Feld

from __future__ import print_function, unicode_literals

from typing import Dict, List

from pydantic import BaseModel


class SingleSuiteSelectedTests(BaseModel):
    full: bool = False
    files: List[str] = []
    nodeids: List[str] = []


class SelectedTests(BaseModel):
    tests: Dict[str, SingleSuiteSelectedTests]


class SingleSelectedTest(BaseModel):
    suite: str
    test_id: str