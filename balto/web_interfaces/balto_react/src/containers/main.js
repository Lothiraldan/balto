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

class Main extends Component {
  onCheck = checked => {
    console.log("CHECKED", checked);
    this.props.state.setState({ checked });
  };

  onClick = node => {
    this.props.state.setState({ selected: node });
  };

  componentDidMount() {
    Mousetrap.bind(["f"], this.selectFailed);
  }

  componentWillUnmount() {
    Mousetrap.unbind(["f"]);
  }

  selectFailed = () => {
    var selected = [];

    var result = _.pickBy(this.props.state.state.tests, function(value, key) {
      return value.outcome === "failed";
    });

    var checked = _.map(result, function(test) {
      return TestNode(test.suite_name, test.file, test.id);
    });

    console.log("RESULT", result, checked);
    this.props.state.setState({ checked: checked });
  };

  render() {
    let nodes = treeFromTests(this.props.state.state.tests);

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
