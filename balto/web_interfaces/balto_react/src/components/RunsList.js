import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { Card, Modal, Section } from "react-bulma-components";
import { Message, Progress } from "react-bulma-components/full";
import Moment from "react-moment";

import { convert } from "../time";

class ReturnCode extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show_message: false,
    };
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  handleOpen() {
    this.setState({ show_message: true });
  }

  handleClose() {
    this.setState({ show_message: false });
  }

  render() {
    const { return_code, return_message } = this.props;
    return (
      <React.Fragment>
        <span style={{ color: "red", cursor: "pointer" }} onClick={this.handleOpen}>
          [{return_code}]
        </span>
        <Modal
          closeOnBlur={true}
          show={this.state.show_message}
          showClose={false}
          onClose={this.handleClose}
        >
          <Modal.Content style={{ display: 'flex', width: '90%' }}>
            <Section style={{
              backgroundColor: 'white',
              color: 'black',
              flexGrow: '1',
              fontFamily: 'monospace',
              fontSize: '0.8em',
              overflow: 'auto',
              whiteSpace: 'pre',
            }}>
              {return_message}
            </Section>
          </Modal.Content>
        </Modal>
      </React.Fragment>
    );
  }
}

ReturnCode.propTypes = {
  return_code: PropTypes.number,
  return_message: PropTypes.string,
};

export const RunDetails = ({
  date_started,
  run_id,
  status,
  done,
  test_number,
  return_code,
  return_message,
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
      header.push(<ReturnCode return_code={return_code} return_message={return_message} />);
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
  return_message: PropTypes.string,
  total_duration: PropTypes.number
};

export class RunsList extends React.Component {
  static propTypes = {
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
          return_message={run.return_message}
          total_duration={run.total_duration}
        />
      );
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
