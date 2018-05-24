import React, { Component } from "react";
import PropTypes from "prop-types";
import { state } from "../state";
import { Subscribe } from "unstated";
import { Tabs, Tab } from "material-ui/Tabs";
import {
  parseDiff,
  Diff,
  addStubHunk,
  expandFromRawCode,
  Hunk
} from "react-diff-view";
import "react-diff-view/index.css";

class SuiteViewer extends Component {
  static propTypes = {
    id: PropTypes.string
  };

  render() {
    return <p>Suite: {this.props.id}</p>;
  }
}

class FileViewer extends Component {
  static propTypes = {
    id: PropTypes.string
  };

  render() {
    return (
      <p>
        File: {this.props.id} of suite {this.props.suite}
      </p>
    );
  }
}

class TestViewer extends Component {
  static propTypes = {
    id: PropTypes.string
  };

  render() {
    console.log("PROPS", this.props);
    let test = this.props.state.state.tests[this.props.id];

    let tabs = [];

    if (test.error && test.error.humanrepr) {
      tabs.push(
        <Tab key="traceback" label="Traceback">
          <pre>{test.error.humanrepr}</pre>
        </Tab>
      );
    }

    if (test.error && test.error.diff && test.error.diff.diff) {
      /*      const paddingMetaInfo = "diff --git a/a b/b";
      const paddingIndexInfo = "index 1111111..2222222 100644";
      const diffBody = formatLines(
        diffLines(test.error.diff.expected, test.error.diff.got)
      );
      const diffText = [paddingMetaInfo, paddingIndexInfo, diffBody].join("\n");
      var result = parseDiff(diffText);
      console.log("RESULT", result);*/

      tabs.push(
        <Tab key="diff" label="Diff">
          <pre>{test.error.diff.diff}</pre>
        </Tab>
      );
    }

    if (test.stdout) {
      tabs.push(
        <Tab key="stdout" label="Stdout">
          <pre>{test.stdout}</pre>
        </Tab>
      );
    }

    if (test.stderr) {
      tabs.push(
        <Tab key="stderr" label="Stderr">
          <pre>{test.stderr}</pre>
        </Tab>
      );
    }

    console.log("TEST", test, tabs);

    return (
      <div>
        <h1>
          {test.test_name} [{test.outcome}]
        </h1>
        <h2>{this.props.suite}</h2>

        <h3>
          File: {test.file}, line {test.line}
        </h3>
        <h3>Duration: {test.duration} seconds</h3>
        <p>
          Test: {this.props.id} of suite {this.props.suite}
        </p>
        {tabs.length > 0 && <Tabs>{tabs}</Tabs>}
      </div>
    );
  }
}

export function treenodeViewerComponent(id) {
  if (id === undefined) {
    return null;
  }

  let decoded = JSON.parse(id);
  let _type = decoded._type;

  console.log(decoded);

  if (_type === "suite") {
    return <SuiteViewer {...decoded} />;
  } else if (_type === "file") {
    return <FileViewer {...decoded} />;
  } else if (_type === "test") {
    return (
      <Subscribe to={[state]}>
        {state => <TestViewer state={state} {...decoded} />}
      </Subscribe>
    );
  }

  return <p>{id}</p>;
}
