import React from "react";
import PropTypes from "prop-types";
import { Message, Progress } from "react-bulma-components/full";
import Moment from "react-moment";
import { convert } from "../time";
import { Card } from "react-bulma-components";

class RunDetails extends React.Component {
  render() {
    let converted_duration = convert(this.props.run.total_duration);

    let duration = null;
    if (this.props.run.status === "finished") {
      duration = (
        <span>
          {converted_duration.value.toFixed(converted_duration.precision)}{" "}
          {converted_duration.unit} <br />
        </span>
      );
    }

    let count = null;
    if (this.props.run.status !== "starting") {
      count = (
        <span>
          {this.props.run.done} / {this.props.run.test_number}
        </span>
      );
    }

    return (
      <Message>
        <Message.Header>
          <Moment fromNow withTitle>
            {this.props.run.date_started}
          </Moment>
        </Message.Header>
        <Message.Body>
          {this.props.run.status} <br />
          {duration}
          {count}
          <Progress
            max={this.props.run.test_number}
            value={this.props.run.done}
          />
        </Message.Body>
      </Message>
    );
  }
}

export class RunsList extends React.Component {
  static propTypes = {
    runs: PropTypes.object
  };

  render() {
    let runs = [];
    for (let run of _.reverse(_.values(this.props.runs))) {
      runs.push(<RunDetails run={run} key={run.run_id} />);
    }
    return (
      <Card>
        <Card.Header>
          <Card.Header.Title>Runs</Card.Header.Title>
        </Card.Header>
        <Card.Content>{runs}</Card.Content>
      </Card>
    );
  }
}
