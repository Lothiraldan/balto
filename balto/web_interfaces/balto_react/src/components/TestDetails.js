import React, { Component } from "react";
import PropTypes from "prop-types";
import { state } from "../state";
import { Provider, Subscribe, Container } from "unstated";

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

    console.log("TEST", test);

    return (
      <div>
        <p>
          Test: {this.props.id} of suite {this.props.suite}
        </p>
        <pre>{JSON.stringify(test, null, 4)}</pre>
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
