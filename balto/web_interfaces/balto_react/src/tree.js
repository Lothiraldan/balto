import _ from "lodash";

import * as Fuse from "fuse.js";

export function TestNode(suite_name, file, test_id) {
  return JSON.stringify({
    _type: "test",
    suite: suite_name,
    file: file,
    id: test_id
  });
}

export function TestFileNode(suite_name, file) {
  return JSON.stringify({ _type: "file", suite: suite_name, id: file });
}

function TestsNodes(testList, suite_name, file) {
  var childrens = [];

  for (var test of testList) {
    let value = TestNode(suite_name, file, test.id);
    let node = {
      name: test.test_name,
      type: "test",
      outcome: test.outcome,
      id: value,
      children: [],
      className: `balto-test-${test.outcome}`
    };
    childrens.push(node);
  }

  return childrens;
}

function ChildrentByFile(testList, suite_name, expandedList) {
  var nodes = [];

  let total_passed = 0;
  let total_failed = 0;
  let total_error = 0;
  let total_skipped = 0;
  let total_collected = 0;

  var x = _.groupBy(testList, test => test.file);
  for (var [file, testsByFile] of Object.entries(x)) {
    let childrens = TestsNodes(testsByFile, suite_name, file);
    /*console.log("CHILDRENS", childrens);*/
    let value = TestFileNode(suite_name, file);
    var outcomes = _.groupBy(testsByFile, test => test.outcome);
    let passed = (outcomes.passed && outcomes.passed.length) || 0;
    total_passed = total_passed + passed;
    let failed = (outcomes.failed && outcomes.failed.length) || 0;
    total_failed = total_failed + failed;
    let error = (outcomes.error && outcomes.error.length) || 0;
    total_error = total_error + error;
    let skipped = (outcomes.skipped && outcomes.skipped.length) || 0;
    total_skipped = total_skipped + skipped;
    let collected = (outcomes.undefined && outcomes.undefined.length) || 0;
    total_collected = total_collected + collected;

    let expanded = _.get(expandedList, value, true);

    let children = {
      id: value,
      name: file,
      type: "file",
      passed: passed,
      failed: failed,
      error: error,
      skipped: skipped,
      collected: collected,
      children: childrens,
      state: {
        expanded: expanded
      }
    };
    nodes.push(children);
  }
  return {
    childrens: nodes,
    total_passed: total_passed,
    total_failed: total_failed,
    total_error: total_error,
    total_skipped: total_skipped,
    total_collected: total_collected
  };
}

export function treeFromTests(testsList, expandedList) {
  /*let testsList = Object.values(tests);*/

  let nodes = [];

  var x = _.groupBy(testsList, test => test.suite_name);
  for (var [suite_name, testsBySuite] of Object.entries(x)) {
    let {
      childrens,
      total_passed,
      total_failed,
      total_error,
      total_skipped,
      total_collected
    } = ChildrentByFile(testsBySuite, suite_name, expandedList);
    let value = JSON.stringify({
      _type: "suite",
      suite: suite_name,
      id: suite_name
    });
    let expanded = _.get(expandedList, value, true);
    let node = {
      id: value,
      name: suite_name,
      type: "suite",
      state: {
        expanded: expanded
      },
      passed: total_passed,
      failed: total_failed,
      error: total_error,
      skipped: total_skipped,
      collected: total_collected,
      children: childrens
    };
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
