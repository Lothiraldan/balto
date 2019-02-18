import React, { Component, PureComponent } from "react";
import { state } from "../state";
import Tree from "react-virtualized-tree";
import { treeFromTests } from "../tree.js";
import { Subscribe } from "unstated";
import { treenodeViewerComponent } from "../components/TestDetails.js";
import { RunsList } from "../components/RunsList.js";
import Mousetrap from "mousetrap";
import "react-virtualized/styles.css";
import "react-virtualized-tree/lib/main.css";
import { getNodeRenderOptions } from "react-virtualized-tree/lib/selectors/nodes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleRight, faAngleDown } from "@fortawesome/free-solid-svg-icons";

import { Level, Columns, Icon, Tag, Card } from "react-bulma-components/full";
import { Panel } from "react-bulma-components";

class TreeLine extends PureComponent {
  onClick = event => {
    event.preventDefault();
    this.props.onClick(this.props.node.id);
  };
  
  render() {
    let tags = [];

    if (this.props.node.passed && this.props.node.passed > 0) {
      tags.push(
        <Tag color="success" key="passed">
          {this.props.node.passed}
        </Tag>
      );
    }
    if (this.props.node.failed && this.props.node.failed > 0) {
      tags.push(
        <Tag color="danger" key="failed">
          {this.props.node.failed}
        </Tag>
      );
    }

    if (this.props.node.errror && this.props.node.errror > 0) {
      tags.push(
        <Tag color="danger" key="danger">
          {this.props.node.errror}
        </Tag>
      );
    }

    if (this.props.node.skipped && this.props.node.skipped > 0) {
      tags.push(
        <Tag color="info" key="info">
          {this.props.node.skipped}
        </Tag>
      );
    }

    if (this.props.node.collected && this.props.node.collected > 0) {
      tags.push(<Tag key="collected">{this.props.node.collected}</Tag>);
    }

    let expand = undefined;

    // Expand icon
    if (this.props.node.type !== "test") {
      if (this.props.isExpanded === true) {
        expand = (
          <Icon onClick={this.props.handleChange}>
            <FontAwesomeIcon icon={faAngleDown} />
          </Icon>
        );
      } else {
        expand = (
          <Icon onClick={this.props.handleChange}>
            <FontAwesomeIcon icon={faAngleRight} />
          </Icon>
        );
      }
    }

    let isCheckedFn = this.props.isChecked;

    let isChecked = undefined;
    let parentChecked = false;

    // Check the parents first
    for (var parent of this.props.node.parents) {
      let parentChecked = isCheckedFn(parent);
      if (parentChecked === true) {
        isChecked = true;
        parentChecked = true;
        break;
      }
    }

    if (isChecked === undefined) {
      isChecked = isCheckedFn(this.props.node.id);
    }

    let newCheckedValue = undefined;
    if (parentChecked === true) {
      newCheckedValue = false;
    } else {
      newCheckedValue = !isChecked;
    }

    let onChange = event => {
      event.preventDefault();
      this.props.onChecked(
        this.props.node.id,
        newCheckedValue,
        this.props.node.parents
      );
    };

    // Content
    let content = this.props.children;

    return (
      <Level onDoubleClick={this.props.handleChange}>
        <Level.Side>
          <Level.Item>{expand}</Level.Item>
          <Level.Item>
            <input type="checkbox" checked={isChecked} onChange={onChange} />
          </Level.Item>
          <Level.Item onClick={this.onClick}>{content}</Level.Item>
        </Level.Side>
        <Level.Side align="right">
          <Tag.Group gapless>{tags}</Tag.Group>
        </Level.Side>
      </Level>
    );
  }
}

const Deepness = ({
  onChangee,
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

  return (
    <TreeLine
      node={node}
      handleChange={handleChange}
      isExpanded={isExpanded}
      children={children}
      onClick={onClick}
      onChecked={setChecked}
      isChecked={isChecked}
    />
  );
};

class Renderers extends Component {
  render() {
    return (
      <div style={{ flex: "1 1 auto", flexDirection: "column", height: 600 }}>
        <Tree nodes={this.props.nodes}>
          {({ node, ...rest }) => (
            <Deepness
              key={node.id}
              node={node}
              onClick={this.props.onClick}
              onChangee={this.props.handleChange}
              setChecked={this.props.onChecked}
              isChecked={this.props.isChecked}
              {...rest}
            >
              <span className={node.className}>{node.name}</span>
            </Deepness>
          )}
        </Tree>
      </div>
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
    var predicate = function(value, key) {
      return value.outcome === "failed";
    };

    this.props.state.selectTests(predicate);
  };

  selectSkipped = () => {
    var predicate = function(value, key) {
      return value.outcome === "skipped";
    };

    this.props.state.selectTests(predicate);
  };

  selectPassed = () => {
    var predicate = function(value, key) {
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
          <RunsList
            onClear={this.props.state.onClearRuns}
            runs={this.props.state.state.runs}
          />
        </Columns.Column>
      </div>
    );
  }
}

export default function MainContainer() {
  return <Subscribe to={[state]}>{state => <Main state={state} />}</Subscribe>;
}
