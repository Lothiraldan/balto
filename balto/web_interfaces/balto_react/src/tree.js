import _ from "lodash";
import React, { Component } from "react";
import { Tag } from "react-bulma-components/full";

import * as Fuse from "fuse.js";

export function TestNode(suite_name, file, test_id) {
  return JSON.stringify({
    _type: "test",
    suite: suite_name,
    file: file,
    id: test_id
  });
}

function TestsNodes(testList, suite_name, file) {
  var childrens = [];

  for (var test of testList) {
    let value = TestNode(suite_name, file, test.id);
    let node = {
      label: test.test_name,
      value: value,
      children: [],
      className: `balto-test-${test.outcome}`
    };
    childrens.push(node);
  }

  return childrens;
}

class TestFileLabel extends Component {
  render() {
    return (
      <span>
        {this.props.file} (
        <Tag color="success">{this.props.passed}</Tag>+<span style={{ color: "red" }}>{this.props.failed}</span>+<span
          style={{ color: "red" }}
        >
          {this.props.error}
        </span>+<span style={{ color: "blue" }}>{this.props.skipped}</span>+<span
          style={{}}
        >
          {this.props.collected}
        </span>={this.props.total})
      </span>
    );
  }
}

function ChildrentByFile(testList, suite_name) {
  var nodes = [];

  var x = _.groupBy(testList, test => test.file);
  for (var [file, testsByFile] of Object.entries(x)) {
    let childrens = TestsNodes(testsByFile, suite_name, file);
    let value = JSON.stringify({ _type: "file", suite: suite_name, id: file });
    var outcomes = _.groupBy(testsByFile, test => test.outcome);
    console.log("OUTCOMES", outcomes);
    let passed = (outcomes.passed && outcomes.passed.length) || 0;
    let failed = (outcomes.failed && outcomes.failed.length) || 0;
    let error = (outcomes.error && outcomes.error.length) || 0;
    let skipped = (outcomes.skipped && outcomes.skipped.length) || 0;
    let collected = (outcomes.undefined && outcomes.undefined.length) || 0;
    let label = (
      <TestFileLabel
        file={file}
        passed={passed}
        failed={failed}
        error={error}
        skipped={skipped}
        collected={collected}
        total={childrens.length}
      />
    );
    /*tests; ${outcomes.passed && outcomes.passed.length} passed, ${outcomes.failed && outcomes.failed.length} failed, ${outcomes.skipped && outcomes.skipped.length} skipped and ${outcomes.undefined && outcomes.undefined.length} just collected)*/
    /*var label = <span style={{color: "green"}}>Test</span>*/
    let children = { label: label, value: value, children: childrens };
    nodes.push(children);
  }
  return nodes;
}

export function treeFromTests(testsList) {
  /*let testsList = Object.values(tests);*/

  let nodes = [];

  var x = _.groupBy(testsList, test => test.suite_name);
  for (var [suite_name, testsBySuite] of Object.entries(x)) {
    let childrens = ChildrentByFile(testsBySuite, suite_name);
    let value = JSON.stringify({ _type: "suite", id: suite_name });
    let node = { label: suite_name, value: value, children: childrens };
    nodes.push(node);
  }

  return nodes;
}

export function filterTest(testsList, filter) {
  if (filter === "") {
    return testsList;
  }

  if (testsList.length === 0) {
    return [];
  }

  var fuseOptions = {
    shouldSort: true,
    tokenize: true,
    findAllMatches: true,
    threshold: 0.15,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ["_type", "test_name", "id"]
  };

  var fuse = new Fuse(testsList, fuseOptions);
  var filtered = fuse.search(filter);
  return filtered;
}
