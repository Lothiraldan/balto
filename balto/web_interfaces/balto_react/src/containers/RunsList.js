// Copyright 2018-2021 by Boris Feld

import { observer } from "mobx-react";
import React from "react";

import { RunSummary, RunsList } from "../components/RunsList";

@observer
class RunSummaryContainer extends React.Component {
  render() {
    return (
      <RunSummary
        status={this.props.run.status}
        done={this.props.run.done}
        test_number={this.props.run.test_number}
        total_duration={this.props.run.total_duration}
        return_code={this.props.run.return_code}
        return_message={this.props.run.return_message}
        total_passed={this.props.run.total_passed}
        total_failed={this.props.run.total_failed}
        total_error={this.props.run.total_error}
        total_skipped={this.props.run.total_skipped}
        date_started={this.props.run.date_started}
      ></RunSummary>
    );
  }
}

@observer
class RunsListContainer extends React.Component {
  render() {
    const runs = [];
    for (let run of this.props.allRuns.runs.values()) {
      runs.push(<RunSummaryContainer run={run}></RunSummaryContainer>);
    }
    runs.reverse();
    return <RunsList>{runs}</RunsList>;
  }
}

export default RunsListContainer;
