import React, { Component } from 'react';
import './App.css';
import _ from 'lodash';
import CheckboxTree from 'react-checkbox-tree';
import 'react-checkbox-tree/lib/react-checkbox-tree.css';
import 'font-awesome/css/font-awesome.min.css';
import { hot } from 'react-hot-loader'

function TestsNodes(testList) {
  var childrens = [];

  for(var test of testList) {
    let node = {label: test.test_name, value: test.id, children: [], className: `balto-test-${test.outcome}`}
    childrens.push(node);
  }

  return childrens;
}


function ChildrentByFile(testList) {
  var childrens = [];

  var x = _.groupBy(testList, (test) => test.file);
  for(var [file, testsByFile] of Object.entries(x)) {
      let children = {label: file, value: file, children: TestsNodes(testsByFile)}
      childrens.push(children);
  }
  return childrens;
}


function treeFromTests(tests) {
  let testsList = Object.values(tests);

  let nodes = [];

  var x = _.groupBy(testsList, (test) => test.suite_name);
  for(var [suite_name, testsBySuite] of Object.entries(x)) {
    let childrens = ChildrentByFile(testsBySuite);
    let node = {label: suite_name, value: suite_name, children: childrens}
    nodes.push(node);
  }

  return nodes;

}


const socket = new WebSocket('ws://localhost:8888')

socket.onopen = () => {
    let data = {"jsonrpc": "2.0", "id": 0, "method": "subscribe", "params": "test"}
    socket.send(JSON.stringify(data));
}

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {tests: {}, msg: [], checked: [], expanded: []};
  }

  componentDidMount() {
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.debug(data);
        if(data.jsonrpc === "2.0" && data.method === "test") {
            let msg = data.params;

            switch(msg._type) {
              case "test_result":
                var test_id = msg.id;
                var newTests = {...this.state.tests, [test_id]: msg};
                console.debug("Tests", newTests, test_id);
                var newstate = {...this.state, tests: newTests, msg: [...this.state.msg, msg]};
                break;
              case "test_collection":
                var test_id = msg.id;
                var newTests = {...this.state.tests, [test_id]: msg};
                console.debug("Tests", newTests, test_id);
                var newstate = {...this.state, tests: newTests, msg: [...this.state.msg, msg]};
                break;
              default:
                var newstate = {...this.state, msg: [...this.state.msg, msg]};
            }
            
            this.setState(newstate);
        }
    }
    socket.onerror = (error) => {
      console.log("ERROR " + error);
    }
  }

  collectAll() {
    let data = {"jsonrpc": "2.0", "id": 0, "method": "collect_all", "params": null};
    socket.send(JSON.stringify(data));
  }

  runAll() {
    let data = {"jsonrpc": "2.0", "id": 0, "method": "run_all", "params": null};
    socket.send(JSON.stringify(data));
  }

  render() {

    let nodes2 = treeFromTests(this.state.tests);

    let tree = <CheckboxTree
                nodes={nodes2}
                checked={this.state.checked}
                expanded={this.state.expanded}
                onCheck={checked => this.setState({ checked })}
                onExpand={expanded => this.setState({ expanded })}
            />;

    return (
      <div className="App">
        <header className="Filter">
          <input placeholder="Filter the tree"/>
          <button onClick={this.collectAll}>Collect all</button>
          <button onClick={this.runAll}>Run all</button>
        </header>
        <div className="container">
          <nav className="TestTree">
            {tree}
          </nav>
          <article className="TestDetails">
            <pre> TEST
            </pre>
          </article>
        </div>
      </div>
    );
  }
}

export default hot(module)(App);