import "react-virtualized/styles.css";
import "react-virtualized-tree/lib/main.css";

import { Icon, Level, Tag } from "react-bulma-components/full";
import React, { PureComponent } from "react";
import { faAngleDown, faAngleRight } from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// if (process.env.NODE_ENV !== 'production') {
//   const { whyDidYouUpdate } = require('why-did-you-update');
//   whyDidYouUpdate(React);
// }

export class TreeLine extends PureComponent {
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

        return (
            <Level onDoubleClick={this.props.handleChange}>
                <Level.Side>
                    <Level.Item>{expand}</Level.Item>
                    <Level.Item>
                        <input type="checkbox" checked={isChecked} onChange={onChange} />
                    </Level.Item>
                    <Level.Item onClick={this.onClick}><span className={this.props.node.className}>{this.props.node.name}</span></Level.Item>
                </Level.Side>
                <Level.Side align="right">
                    <Tag.Group gapless>{tags}</Tag.Group>
                </Level.Side>
            </Level>
        );
    }
}