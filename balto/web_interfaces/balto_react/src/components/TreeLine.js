import "react-virtualized/styles.css";
import "react-virtualized-tree/lib/main.css";

import React, { PureComponent } from "react";
import { Icon, Level, Tag } from "react-bulma-components";

import { faAngleDown, faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// if (process.env.NODE_ENV !== 'production') {
//   const { whyDidYouUpdate } = require('why-did-you-update');
//   whyDidYouUpdate(React);
// }

export class TreeLine extends PureComponent {
  onClick = event => {
    event.preventDefault();
    this.props.onClick(this.props.id);
  };

  onCheckBoxChange = event => {
    this.props.onChecked(this.props.id);
  };

  render() {
    let tags = [];

    if (
      this.props.status_summary &&
      this.props.status_summary.get("passed", 0) > 0
    ) {
      tags.push(
        <Tag color="success" key="passed">
          {this.props.status_summary.get("passed", 0)}
        </Tag>
      );
    }
    if (
      this.props.status_summary &&
      this.props.status_summary.get("failed", 0) > 0
    ) {
      tags.push(
        <Tag color="danger" key="failed">
          {this.props.status_summary.get("failed", 0)}
        </Tag>
      );
    }

    if (
      this.props.status_summary &&
      this.props.status_summary.get("error", 0) > 0
    ) {
      tags.push(
        <Tag color="danger" key="danger">
          {this.props.status_summary.get("error", 0)}
        </Tag>
      );
    }

    if (
      this.props.status_summary &&
      this.props.status_summary.get("skipped", 0) > 0
    ) {
      tags.push(
        <Tag color="info" key="info">
          {this.props.status_summary.get("skipped", 0)}
        </Tag>
      );
    }

    if (
      this.props.status_summary &&
      this.props.status_summary.get("collected", 0) > 0
    ) {
      tags.push(
        <Tag key="collected">
          {this.props.status_summary.get("collected", 0)}
        </Tag>
      );
    }

    let expand = undefined;

    // Expand icon
    if (this.props.node_type !== "test") {
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

    let isChecked = false;
    if (this.props.isChecked === "true") {
      isChecked = true;
    } else if (this.props.isChecked === "parent") {
      isChecked = true;
    }

    // Check the parents first
    // for (var parent of this.props.node.parents) {
    //     let parentChecked = isCheckedFn(parent);
    //     if (parentChecked === true) {
    //         isChecked = true;
    //         parentChecked = true;
    //         break;
    //     }
    // }

    // if (isChecked === undefined) {
    //     isChecked = isCheckedFn(this.props.node.id);
    // }

    // let newCheckedValue = undefined;
    // if (parentChecked === true) {
    //     newCheckedValue = false;
    // } else {
    //     newCheckedValue = !isChecked;
    // }

    var name = undefined;
    if (this.props.selected === true) {
      name = <b>{this.props.name}</b>;
    } else {
      name = this.props.name;
    }

    var className = null;
    if (this.props.node_type === "test") {
      className = `balto-test-${this.props.status}`;
    }

    return (
      <Level onDoubleClick={this.props.handleChange}>
        <Level.Side>
          <Level.Item>{expand}</Level.Item>
          <Level.Item>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={this.onCheckBoxChange}
            />
          </Level.Item>
          <Level.Item onClick={this.onClick}>
            <span className={className}>{name}</span>
          </Level.Item>
        </Level.Side>
        <Level.Side align="right">
          <Tag.Group gapless>{tags}</Tag.Group>
        </Level.Side>
      </Level>
    );
  }
}
