import React, { Component } from "react";
import "flexboxgrid/css/flexboxgrid.css";
import "font-awesome/css/font-awesome.min.css";
import PropTypes from "prop-types";
import HeaderComponent from "../components/Header";
import { Subscribe } from "unstated";
import { state } from "../state";
import { socket } from "../websocket.js";
import { collectAllApi, runAllApi, runSelectedApi } from "../api";

import _ from "lodash";

function setDefault(obj, prop, deflt) {
  return obj.hasOwnProperty(prop) ? obj[prop] : (obj[prop] = deflt);
}

class Header extends Component {
  collectAll() {
    collectAllApi();
  }

  runAll() {
    runAllApi();
  }

  runSelected = () => {
    let params = {};
    for (var test_id of _.keys(this.props.state.state.checked)) {
      if (this.props.state.state.checked[test_id] === false) {
        continue;
      }
      var parsed = JSON.parse(test_id);
      let suite_params = setDefault(params, parsed.suite, {});
      if (parsed._type === "file") {
        setDefault(suite_params, "files", []).push(parsed.id);
      } else if (parsed._type === "test") {
        setDefault(suite_params, "nodeids", []).push(parsed.id);
      }
    }
    runSelectedApi(params);
  };

  render() {
    let countSelected = _.filter(
      _.values(this.props.state.state.checked),
      v => v
    );

    return (
      <HeaderComponent
        send={this.send}
        collectAll={this.collectAll}
        runAll={this.runAll}
        runSelected={this.runSelected}
        countSelected={countSelected.length}
      />
    );
  }
}

export default function HeaderContainer() {
  return (
    <Subscribe to={[state]}>{state => <Header state={state} />}</Subscribe>
  );
}
