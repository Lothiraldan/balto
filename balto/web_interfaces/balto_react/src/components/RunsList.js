import React from "react";
import PropTypes from "prop-types";
import { Message, Progress } from "react-bulma-components/full";
import Moment from "react-moment";
import { convert } from "../time";
import { Button, Card } from "react-bulma-components";

export const RunDetails = ({
  date_started,
  run_id,
  status,
  done,
  test_number,
  return_code,
  total_duration
}) => {
  let header = [
    <Moment fromNow withTitle>
      {date_started}
    </Moment>
  ];

  let duration = null;
  if (status === "finished") {
    let converted_duration = convert(total_duration);
    duration = (
      <span>
        {converted_duration.value.toFixed(converted_duration.precision)}{" "}
        {converted_duration.unit} <br />
      </span>
    );

    if (return_code !== undefined && return_code !== 0) {
      header.push(<span style={{ color: "red" }}>[{return_code}]</span>);
    }
  }

  let count = null;
  if (status !== "starting") {
    count = (
      <span>
        {done} / {test_number}
      </span>
    );
  }

  return (
    <Message>
      <Message.Header>{header}</Message.Header>
      <Message.Body>
        {status} {duration !== null && <span>in {duration}</span>}
        {count}
        <Progress max={test_number || 0} value={done || 0} />
      </Message.Body>
    </Message>
  );
};

RunDetails.propTypes = {
  date_started: PropTypes.object,
  run_id: PropTypes.string,
  status: PropTypes.string,
  done: PropTypes.number,
  test_number: PropTypes.number,
  return_code: PropTypes.number,
  total_duration: PropTypes.number
};

export class RunsList extends React.Component {
  static propTypes = {
    onClear: PropTypes.func,
    runs: PropTypes.object
  };

  render() {
    let runs = [];
    for (let run of _.reverse(_.values(this.props.runs))) {
      runs.push(
        <RunDetails
          key={run.run_id}
          date_started={run.date_started}
          run_id={run.run_id}
          status={run.status}
          test_number={run.test_number}
          done={run.done}
          return_code={run.return_code}
          total_duration={run.total_duration}
        />
      );
    }
    return (
      <Card>
        <Card.Header>
          <Card.Header.Title>Runs</Card.Header.Title>
          <Card.Header.Icon
            renderAs={Button}
            onClick={this.props.onClear}
            style={{ margin: 6 }}
          >
            Clear
          </Card.Header.Icon>
        </Card.Header>
        <Card.Content>{runs}</Card.Content>
      </Card>
    );
  }
}
