import { hot } from "react-hot-loader";
import { Provider, Subscribe, Container } from "unstated";
import { filterTest } from "./tree";

type TestState = {
  tests: object,
  msg: array,
  checked: array,
  expanded: array,
  selected: string
};

class TestContainer extends Container<TestState> {
  state = {
    tests: {},
    filteredTests: [],
    msg: [],
    checked: [],
    expanded: [],
    selected: undefined,
    filterText: ""
  };

  newMessage = event => {
    const data = JSON.parse(event.data);
    console.debug(data);
    if (data.jsonrpc === "2.0" && data.method === "test") {
      let msg = data.params;

      switch (msg._type) {
        case "test_result":
          var test_id = msg.id;

          this.setState(state => {
            var new_tests = { ...state.tests, [test_id]: msg };
            var test_list = Object.values(new_tests);
            var filtered = filterTest(test_list, this.state.filterText);
            return {
              ...state,
              tests: new_tests,
              filteredTests: filtered,
              msg: [...state.msg, msg]
            };
          });

          /*var newstate = (state) => {
                return {...state,
                tests: newTests,
                msg: [...this.state.msg, msg]
            }
            }*/
          /*var newstate = {
              ...this.state,
              tests: newTests,
              msg: [...this.state.msg, msg]
            };*/
          break;
        case "test_collection":
          var test_id = msg.id;

          this.setState(state => {
            var new_tests = { ...state.tests, [test_id]: msg };
            var test_list = Object.values(new_tests);
            var filtered = filterTest(test_list, this.state.filterText);
            /*console.log("FC", this.state.filterText, filtered);*/
            return {
              ...state,
              tests: new_tests,
              filteredTests: filtered,
              msg: [...state.msg, msg]
            };
          });
          /*var newstate = {
              ...this.state,
              tests: newTests,
              msg: [...this.state.msg, msg]
            };*/
          /*var newstate = state => {
            return {
              ...state,
              tests: newTests,
              msg: [...this.state.msg, msg]
            };
          };*/
          break;
        default:
          /*var newstate = { ...this.state, msg: [...this.state.msg, msg] };*/

          this.setState(state => {
            return {
              ...state,
              msg: [...state.msg, msg]
            };
          });
        /*var newstate = state => {
            return {
              ...state,
              msg: [...this.state.msg, msg]
            };
          };*/
      }

      /*this.setState(state => newstate(state));*/
    }
  };

  onExpand = state => {
    this.setState(state);
  };

  setFilterText = newValue => {
    var filteredTests = filterTest(Object.values(this.state.tests), newValue);
    this.setState({ filterText: newValue, filteredTests: filteredTests });
  };
}

export let state = new TestContainer();
