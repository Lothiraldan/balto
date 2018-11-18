import React, { Component } from "react";
import PropTypes from "prop-types";
import { state } from "../state";
import { Subscribe } from "unstated";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import {
  parseDiff,
  Diff,
  addStubHunk,
  expandFromRawCode
} from "react-diff-view";
import "react-diff-view/index.css";
import { convert } from "../time";
import { Card } from "react-bulma-components";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faBan
} from "@fortawesome/free-solid-svg-icons";

import { Icon } from "react-bulma-components/full";

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

export class TestViewer extends Component {
  static propTypes = {
    id: PropTypes.string,
    test: PropTypes.object,
    suite: PropTypes.string
  };

  render() {
    let test = this.props.test;

    let tablist = [];
    let tabcontent = [];

    if (test.error && test.error.humanrepr) {
      tablist.push(
        <Tab>
          <a>Traceback</a>
        </Tab>
      );

      tabcontent.push(
        <TabPanel>
          <pre>{test.error.humanrepr}</pre>
        </TabPanel>
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

      tablist.push(
        <Tab>
          <a>Diff</a>
        </Tab>
      );

      tabcontent.push(
        <TabPanel>
          <pre>{test.error.diff.diff}</pre>
        </TabPanel>
      );
    }

    if (test.stdout) {
      tablist.push(
        <Tab>
          <a>Stdout</a>
        </Tab>
      );

      tabcontent.push(
        <TabPanel>
          <pre>{test.stdout}</pre>
        </TabPanel>
      );
    }

    if (test.stderr) {
      tablist.push(
        <Tab>
          <a>Stderr</a>
        </Tab>
      );

      tabcontent.push(
        <TabPanel>
          <pre>{test.stderr}</pre>
        </TabPanel>
      );
    }

    if (test.logs) {
      tablist.push(
        <Tab>
          <a>Logs</a>
        </Tab>
      );

      tabcontent.push(
        <TabPanel>
          <pre>{test.logs}</pre>
        </TabPanel>
      );
    }

    let status_icon = null;

    if (test.outcome === "passed") {
      status_icon = (
        <Icon onClick={this.props.handleChange}>
          <FontAwesomeIcon icon={faCheckCircle} style={{ color: "green" }} />
        </Icon>
      );
    } else if (test.outcome === "failed") {
      status_icon = (
        <Icon onClick={this.props.handleChange}>
          <FontAwesomeIcon icon={faTimesCircle} style={{ color: "red" }} />
        </Icon>
      );
    } else if (test.outcome === "skipped") {
      status_icon = (
        <Icon onClick={this.props.handleChange}>
          <FontAwesomeIcon icon={faBan} style={{ color: "blue" }} />
        </Icon>
      );
    }

    if (test.duration !== undefined) {
      let convertedDuration = convert(test.duration);
      console.log("Test duration", convertedDuration);
      var duration = (
        <span>
          Duration{" "}
          {convertedDuration.value.toFixed(convertedDuration.precision)}{" "}
          {convertedDuration.unit}
        </span>
      );
    } else {
      var duration = undefined;
    }

    return (
      <Card>
        <Card.Header>
          <Card.Header.Title>
            {test.test_name} {status_icon}
          </Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <h2>{this.props.suite}</h2>

          <h3>
            File: {test.file}, line {test.line}
          </h3>
          <h3>{duration}</h3>
          <h3>Last updated: {test.last_updated.fromNow()}</h3>
          <p>
            Test: {this.props.id} of suite {this.props.suite}
          </p>
          {tablist.length > 0 && (
            <Tabs selectedTabClassName="is-active">
              <div
                className="tabs is-boxed is-fullwidth"
                style={{ marginBottom: "0px" }}
              >
                <TabList>{tablist}</TabList>
              </div>
              {tabcontent}
            </Tabs>
          )}
        </Card.Content>
      </Card>
    );
  }
}

export function treenodeViewerComponent(id) {
  if (id === undefined) {
    return null;
  }

  let decoded = JSON.parse(id);
  let _type = decoded._type;
  let _id = decoded.id;

  if (_type === "suite") {
    return <SuiteViewer {...decoded} />;
  } else if (_type === "file") {
    return <FileViewer {...decoded} />;
  } else if (_type === "test") {
    let test = state.state.tests[_id];
    return (
      <Subscribe to={[state]}>
        {state => <TestViewer test={test} id={_id} suite={decoded.suite} />}
      </Subscribe>
    );
  }

  return <p>{id}</p>;
}
