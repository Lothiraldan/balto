import "react-virtualized/styles.css";
import "react-virtualized-tree/lib/main.css";

import { Card, Columns } from "react-bulma-components/full";
import React, { Component } from "react";

import Mousetrap from "mousetrap";
import { RunsList } from "../components/RunsList.js";
import { Subscribe } from "unstated";
import Tree from "react-virtualized-tree";
import { TreeLine } from "../components/TreeLine";
import { getNodeRenderOptions } from "react-virtualized-tree/lib/selectors/nodes";
import { state } from "../state";
import { treeFromTests } from "../tree.js";
import { treenodeViewerComponent } from "../components/TestDetails.js";

// if (process.env.NODE_ENV !== 'production') {
//   const { whyDidYouUpdate } = require('why-did-you-update');
//   whyDidYouUpdate(React);
// }

const Deepness = ({
  onChangee,
  style,
  node,
  onClick,
  children,
  setChecked,
  isChecked
}) => {
  const { isExpanded } = getNodeRenderOptions(node);
  const handleChange = () => {
    onChangee(node.id, !isExpanded);
  };

  // Change style marginLeft to paddingLeft to works with bulma level
  // See https://github.com/diogofcunha/react-virtualized-tree/issues/49
  style.paddingLeft = style.marginLeft;
  delete style.marginLeft;

  return (
    <div style={style}>
      <TreeLine
        node={node}
        handleChange={handleChange}
        isExpanded={isExpanded}
        children={children}
        onClick={onClick}
        onChecked={setChecked}
        isChecked={isChecked}
      />
    </div>
  );
};

class Renderers extends Component {
  render() {
    return (
      <div style={{ flex: "1 1 auto", flexDirection: "column", height: 600 }}>
        <Tree nodes={this.props.nodes}>
          {({ style, node, ...rest }) => (
            <Deepness
              key={node.id}
              style={style}
              node={node}
              onClick={this.props.onClick}
              onChangee={this.props.handleChange}
              setChecked={this.props.onChecked}
              isChecked={this.props.isChecked}
              {...rest}
            />
          )}
        </Tree>
      </div >
    );
  }
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
    var predicate = function (value, key) {
      return value.outcome === "failed";
    };

    this.props.state.selectTests(predicate);
  };

  selectSkipped = () => {
    var predicate = function (value, key) {
      return value.outcome === "skipped";
    };

    this.props.state.selectTests(predicate);
  };

  selectPassed = () => {
    var predicate = function (value, key) {
      return value.outcome === "passed";
    };

    this.props.state.selectTests(predicate);
  };

  render() {
    /*console.log("MAIN PROPS", this.props.state.state.filteredTests);*/

    /*console.log("TESTS", JSON.stringify(this.props.state.state.tests, null, 4));*/
    let nodes = treeFromTests(
      this.props.state.state.filteredTests,
      this.props.state.state.expanded
    );

    let nodeViewerComponent = treenodeViewerComponent(
      this.props.state.state.selected
    );

    return (
      <div className="row">
        <Columns.Column size={5}>
          <Card>
            <Card.Header>
              <Card.Header.Title>Tests list</Card.Header.Title>
            </Card.Header>
            <Card.Content>
              <Renderers
                nodes={nodes}
                onClick={this.onClick}
                handleChange={this.props.state.setExpanded}
                onChecked={this.props.state.onChecked}
                isChecked={this.props.state.isChecked}
              />
            </Card.Content>
          </Card>
        </Columns.Column>

        <Columns.Column size={5}>{nodeViewerComponent}</Columns.Column>

        <Columns.Column size={2}>
          <RunsList runs={this.props.state.state.runs} />
        </Columns.Column>
      </div>
    );
  }
}

export default function MainContainer() {
  return <Subscribe to={[state]}>{state => <Main state={state} />}</Subscribe>;
}
