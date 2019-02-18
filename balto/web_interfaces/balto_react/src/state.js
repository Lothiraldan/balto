import { Container } from "unstated";
import { filterTest, TestNode, TestFileNode } from "./tree";
import _ from "lodash";
import moment from "moment";

type TestState = {
  tests: object,
  msg: array,
  checked: object,
  expanded: object,
  selected: string
};

class TestContainer extends Container<TestState> {
  state = {
    tests: {},
    filteredTests: [],
    msg: [],
    checked: {},
    expanded: {},
    selected: undefined,
    filterText: "",
    runs: {}
  };

  newMessage = event => {
    const data = JSON.parse(event.data);
    console.debug("MSG DATA", event.data);
    if (data.jsonrpc === "2.0" && data.method === "test") {
      let msg = data.params;

      switch (msg._type) {
        case "test_result":
          var test_id = msg.id;
          var run_id = msg.run_id;

          this.setState(state => {
            var test = { ...msg, last_updated: moment() };
            var new_tests = { ...state.tests, [test_id]: test };
            var test_list = Object.values(new_tests);
            var filtered = filterTest(test_list, this.state.filterText);

            let run = this.state.runs[run_id];
            var new_runs = {
              ...state.runs,
              [run_id]: { ...run, done: run.done + 1 }
            };

            return {
              ...state,
              tests: new_tests,
              filteredTests: filtered,
              msg: [...state.msg, msg],
              runs: new_runs
            };
          });
          break;
        case "test_collection":
          var test_id = msg.id;
          var run_id = msg.run_id;

          this.setState(state => {
            var test = { ...msg, last_updated: moment() };
            var new_tests = { ...state.tests, [test_id]: test };
            var test_list = Object.values(new_tests);
            var filtered = filterTest(test_list, this.state.filterText);

            let run = this.state.runs[run_id];
            var new_runs = {
              ...state.runs,
              [run_id]: { ...run, done: run.done + 1 }
            };

            return {
              ...state,
              tests: new_tests,
              filteredTests: filtered,
              msg: [...state.msg, msg],
              runs: new_runs
            };
          });
          break;

        case "session_start":
          var run_id = msg.run_id;

          this.setState(state => {
            let run = this.state.runs[run_id];
            var new_runs = {
              ...state.runs,
              [run_id]: {
                ...run,
                status: "running",
                test_number: msg.test_number,
                done: 0
              }
            };
            return {
              ...state,
              runs: new_runs
            };
          });
          break;
        case "session_end":
          var run_id = msg.run_id;

          this.setState(state => {
            let run = this.state.runs[run_id];
            var new_runs = {
              ...state.runs,
              [run_id]: {
                ...run,
                total_duration: msg.total_duration,
                passed: msg.passed,
                failed: msg.failed,
                error: msg.error,
                skipped: msg.skipped
              }
            };
            return {
              ...state,
              runs: new_runs
            };
          });
          break;
        case "run_start":
          var run_id = msg.run_id;

          this.setState(state => {
            var new_runs = {
              ...state.runs,
              [run_id]: {
                status: "starting",
                date_started: moment(),
                run_id: run_id
              }
            };
            return {
              ...state,
              runs: new_runs
            };
          });
          break;
        case "run_stop":
          var run_id = msg.run_id;

          this.setState(state => {
            let run = this.state.runs[run_id];
            var new_runs = {
              ...state.runs,
              [run_id]: {
                ...run,
                status: "finished",
                return_code: msg.return_code
              }
            };
            return {
              ...state,
              runs: new_runs
            };
          });
          break;
        default:
          console.log("New msg", msg);

          this.setState(state => {
            return {
              ...state,
              msg: [...state.msg, msg]
            };
          });
      }
    }
  };

  setExpanded = (node_id, isExpanded) => {
    let expanded = this.state.expanded;
    expanded[node_id] = isExpanded;
    this.setState(state => {
      return {
        ...state,
        expanded: expanded
      };
    });
  };

  onExpand = state => {
    this.setState(state);
  };

  expandSelectedSuite = (suite, checked) => {
    let predicate = function(value, key) {
      return value.suite_name === suite.id;
    };
    let filtered = this.filterTests(predicate);
    let files = _.groupBy(_.values(filtered), test => test.file);
    for (let testfile of _.keys(files)) {
      checked[TestFileNode(suite.id, testfile)] = true;
    }
  };

  expandSelectedFile = (file_id, checked) => {
    let predicate = function(value, key) {
      return value.file === file_id.id;
    };
    let filtered = this.filterTests(predicate);
    for (let test of _.values(filtered)) {
      checked[TestNode(test.suite_name, test.file, test.id)] = true;
    }
  };

  resetSelectedSuite = (suite, checked) => {
    let predicate = function(value, key) {
      return value.suite_name === suite.id;
    };
    let filtered = this.filterTests(predicate);
    for (let test of _.values(filtered)) {
      delete checked[TestNode(test.suite_name, test.file, test.id)];
    }
    let files = _.groupBy(_.values(filtered), test => test.file);
    for (let testfile of _.keys(files)) {
      delete checked[TestFileNode(suite.id, testfile)];
    }
  };

  resetSelectedFile = (file_id, checked) => {
    let predicate = function(value, key) {
      return value.file === file_id.id;
    };
    let filtered = this.filterTests(predicate);
    for (let test of _.values(filtered)) {
      delete checked[TestNode(test.suite_name, test.file, test.id)];
    }
  };

  // TODO: This code is overly complex, simplify it
  onChecked = (node_id, isChecked, parents) => {
    let checked = this.state.checked;

    if (isChecked === false) {
      // If we want the node to be false, it might currently be true because
      // of its parents
      for (let parent of parents) {
        if (checked[parent] === true) {
          // Decode parent
          checked[parent] = false;
          let decoded = JSON.parse(parent);
          if (decoded._type === "file") {
            this.expandSelectedFile(decoded, checked);
          } else if (decoded._type === "suite") {
            this.expandSelectedSuite(decoded, checked);
          }
        }
      }
    }

    // Deactive the node itself
    checked[node_id] = isChecked;

    // Check if we need to reset the childrens
    let decoded = JSON.parse(node_id);
    if (decoded._type === "file") {
      this.resetSelectedFile(decoded, checked);
    } else if (decoded._type === "suite") {
      this.resetSelectedSuite(decoded, checked);
    }

    this.setState(state => {
      return {
        ...state,
        checked: checked
      };
    });
  };

  isChecked = node_id => {
    /*console.log("isChecked", node_id, this.state.checked);*/
    return _.get(this.state.checked, node_id, false);
  };

  filterTests = predicate => {
    return _.pickBy(this.state.tests, predicate);
  };

  selectTests = predicate => {
    let checked = {};
    let filtered = this.filterTests(predicate);
    for (let test of _.values(filtered)) {
      checked[TestNode(test.suite_name, test.file, test.id)] = true;
    }
    this.setState(state => {
      return {
        ...state,
        checked: checked
      };
    });
  };

  /*selectTests = predicate => {
    var result = filterTests(this.props.state.state.tests, predicate);

    var checked = _.map(result, function(test) {
      return TestNode(test.suite_name, test.file, test.id);
    });

    this.props.state.setState({ checked: checked });
  };*/

  setFilterText = newValue => {
    var filteredTests = filterTest(Object.values(this.state.tests), newValue);
    this.setState({ filterText: newValue, filteredTests: filteredTests });
  };

  onClearRuns = () => {
    this.setState(state => {
      return {
        ...state,
        runs: {}
      };
    })
  };
}

export let state = new TestContainer();
