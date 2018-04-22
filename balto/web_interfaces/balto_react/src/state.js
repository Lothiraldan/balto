import { hot } from "react-hot-loader";
import { Provider, Subscribe, Container } from "unstated";

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
    msg: [],
    checked: [],
    expanded: [],
    selected: undefined
  };

  newMessage = event => {
    const data = JSON.parse(event.data);
    console.debug(data);
    if (data.jsonrpc === "2.0" && data.method === "test") {
      let msg = data.params;

      switch (msg._type) {
        case "test_result":
          var test_id = msg.id;
          console.debug("Tests", test_id);

          this.setState(state => {
            return {
              ...state,
              tests: { ...state.tests, [test_id]: msg },
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
          console.debug("Tests", test_id);

          this.setState(state => {
            return {
              ...state,
              tests: { ...state.tests, [test_id]: msg },
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
    console.log("EXPAND", state);
    this.setState(state);
  };
}

export let state = new TestContainer();
