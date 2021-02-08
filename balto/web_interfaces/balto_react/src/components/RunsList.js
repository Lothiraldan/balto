// Copyright 2018-2021 by Boris Feld

import PropTypes from "prop-types";
import React from "react";
import { Card, Modal, Section } from "react-bulma-components";
import { Message, Progress } from "react-bulma-components";
import Moment from "react-moment";

import { convert } from "../time";

class RunDetails extends React.PureComponent {
  render() {
    const {
      show,
      handle_close,
      run_id,
      done,
      test_number,
      status,
      return_message
    } = this.props;

    return (
      <Modal
        closeOnBlur={true}
        show={show}
        showClose={false}
        onClose={handle_close}
      >
        <Modal.Card style={{ display: "flex", width: "90%" }}>
          <Modal.Card.Head onClose={handle_close}>
            <Modal.Card.Title>Run: {run_id}</Modal.Card.Title>
          </Modal.Card.Head>
          <Modal.Card.Body>
            Run status: {status} <br />
            Total expected number of test: {test_number} <br />
            Additional outputs:
            <Section
              style={{
                backgroundColor: "white",
                color: "black",
                fontFamily: "monospace",
                fontSize: "0.8em",
                overflow: "auto",
                whiteSpace: "pre"
              }}
            >
              <pre>
                <code>{return_message}</code>
              </pre>
            </Section>
          </Modal.Card.Body>
        </Modal.Card>
      </Modal>
    );
  }
}

RunDetails.propTypes = {
  return_code: PropTypes.number,
  return_message: PropTypes.string
};

export class RunSummary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show_modal: false
    };
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  handleOpen() {
    this.setState({ show_modal: true });
  }

  handleClose() {
    this.setState({ show_modal: false });
  }

  render() {
    let header = [
      <Moment fromNow withTitle>
        {this.props.date_started}
      </Moment>
    ];

    let duration = null;
    if (this.props.status === "finished") {
      let converted_duration = convert(this.props.total_duration);
      duration = (
        <span>
          {converted_duration.value.toFixed(converted_duration.precision)}{" "}
          {converted_duration.unit} <br />
        </span>
      );

      if (
        this.props.return_code !== undefined &&
        this.props.return_code !== 0
      ) {
        header.push(
          <span style={{ color: "red" }}>[{this.props.return_code}]</span>
        );
      }
    }

    let count = null;
    if (this.props.status !== "starting") {
      count = (
        <span>
          {this.props.done} / {this.props.test_number}
        </span>
      );
    }

    return (
      <Message>
        <Message.Header
          key={this.props.run_id + "header"}
          style={{ cursor: "pointer" }}
          onClick={this.handleOpen}
        >
          {header}
        </Message.Header>
        <Message.Body>
          {this.props.status} {duration !== null && <span>in {duration}</span>}
          {count}
          <Progress
            max={this.props.test_number || 0}
            value={this.props.done || 0}
          />
        </Message.Body>
        <RunDetails
          show={this.state.show_modal}
          handle_close={this.handleClose}
          run_id={this.props.run_id}
          done={this.props.done}
          test_number={this.props.test_number}
          status={this.props.status}
          return_message={this.props.return_message}
        ></RunDetails>
      </Message>
    );
  }
}

RunSummary.propTypes = {
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
    runs: PropTypes.array
  };

  render() {
    return (
      <Card>
        <Card.Header>
          <Card.Header.Title>Runs</Card.Header.Title>
        </Card.Header>
        <Card.Content>{this.props.children}</Card.Content>
      </Card>
    );
  }
}
