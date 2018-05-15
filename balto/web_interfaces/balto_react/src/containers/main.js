import { hot } from "react-hot-loader";
import React, { Component } from "react";
import Paper from "material-ui/Paper";
import { state } from "../state";
import CheckboxTree from "react-checkbox-tree";
import { treeFromTests, TestNode } from "../tree.js";
import { Provider, Subscribe, Container } from "unstated";
import { treenodeViewerComponent } from "../components/TestDetails.js";
import Mousetrap from "mousetrap";
import _ from "lodash";

function filterTests(tests, predicate) {
  return _.pickBy(tests, predicate);
}

class Main extends Component {
  onCheck = checked => {
    this.props.state.setState({ checked });
  };

  onClick = node => {
    this.props.state.setState({ selected: node });
  };

  componentDidMount() {
    Mousetrap.bind(["f"], this.selectFailed);
    Mousetrap.bind(["s"], this.selectSkipped);
    Mousetrap.bind(["p"], this.selectPassed);
  }

  componentWillUnmount() {
    Mousetrap.unbind(["f"]);
    Mousetrap.unbind(["s"]);
    Mousetrap.unbind(["p"]);
  }

  selectFailed = () => {
    var predicate = function(value, key) {
      return value.outcome === "failed";
    };

    this.selectTests(predicate);
  };

  selectSkipped = () => {
    var predicate = function(value, key) {
      return value.outcome === "skipped";
    };

    this.selectTests(predicate);
  };

  selectPassed = () => {
    var predicate = function(value, key) {
      return value.outcome === "passed";
    };

    this.selectTests(predicate);
  };

  selectTests = predicate => {
    var result = filterTests(this.props.state.state.tests, predicate);

    var checked = _.map(result, function(test) {
      return TestNode(test.suite_name, test.file, test.id);
    });

    console.log("RESULT", result, checked);
    this.props.state.setState({ checked: checked });
  };

  render() {
    console.log("MAIN PROPS", this.props.state.state.filteredTests);
    /*console.log("TESTS", JSON.stringify(this.props.state.state.tests, null, 4));*/
    let nodes = treeFromTests(this.props.state.state.filteredTests);

    let tree = (
      <CheckboxTree
        nodes={nodes}
        checked={this.props.state.state.checked}
        expanded={this.props.state.state.expanded}
        onCheck={this.onCheck}
        onClick={this.onClick}
        onExpand={expanded => this.props.state.onExpand({ expanded })}
      />
    );

    let nodeViewerComponent = treenodeViewerComponent(
      this.props.state.state.selected
    );

    return (
      <div className="row">
        <div className="col-xs-12 col-sm-12 col-md-6 col-lg-6 m-b-15 ">
          <Paper>{tree}</Paper>
        </div>

        <div className="col-xs-12 col-sm-12 col-md-6 col-lg-6 m-b-15 ">
          <Paper>{nodeViewerComponent}</Paper>
        </div>
      </div>
    );
  }
}

export default function MainContainer() {
  return <Subscribe to={[state]}>{state => <Main state={state} />}</Subscribe>;
}
