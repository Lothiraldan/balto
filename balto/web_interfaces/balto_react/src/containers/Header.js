import "flexboxgrid/css/flexboxgrid.css";
import "font-awesome/css/font-awesome.min.css";

import { observer } from "mobx-react";
import React, { Component } from "react";

import { collectAllApi, runAllApi, runSelectedApi } from "../api";
import HeaderComponent from "../components/Header";
import store from "../store";

@observer
class Header extends Component {
  collectAll() {
    collectAllApi();
  }

  runAll() {
    runAllApi();
  }

  runSelected = () => {
    runSelectedApi(store.suites.selected_nodes);
  };

  render() {
    const countSelected = store.suites.selected_number;

    return (
      <HeaderComponent
        send={this.send}
        collectAll={this.collectAll}
        runAll={this.runAll}
        runSelected={this.runSelected}
        countSelected={countSelected}
      />
    );
  }
}

export default Header;
