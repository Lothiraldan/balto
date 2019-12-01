import "font-awesome/css/font-awesome.min.css";

import './App.sass';
import "./App.css";

import styles from "flexboxgrid/css/flexboxgrid.css";
import PropTypes from "prop-types";
import React, { Component } from "react";
import { hot } from "react-hot-loader";
import { Route } from "react-router";
import { BrowserRouter } from "react-router-dom";

import Header  from "./containers/Header";
import Main from "./containers/main";
import { socket } from "./websocket.js";

// @observer 
class App extends Component {
  static propTypes = {
    width: PropTypes.number
  };

  constructor(props) {
    super(props);
    this.state = {
      msg: [],
      navDrawerOpen: false
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.width !== nextProps.width) {
      this.setState({ navDrawerOpen: nextProps.width === styles.LARGE });
    }
  }

  handleChangeRequestNavDrawer() {
    this.setState({
      navDrawerOpen: !this.state.navDrawerOpen
    });
  }

  componentDidMount() {
    socket.onmessage = event => {
      /*console.log("ON MESSAGE", event);*/
      const data = JSON.parse(event.data);
      if (data.jsonrpc === "2.0" && data.method === "test") {
        let msg = data.params;
        this.props.store.process_single_msg(msg);
      };
      socket.onerror = error => {
        console.log("ERROR " + error);
      };
      socket.onclose = event => {
        console.log("CLOSED", event);
      };
    }
  }

  send(data) {
    socket.send(data);
  }

  render() {
    let { navDrawerOpen } = this.state;
    const paddingLeftDrawerOpen = 236;

    const my_styles = {
      header: {
        paddingLeft: navDrawerOpen ? paddingLeftDrawerOpen : 0
      },
      container: {
        margin: "20px 20px 20px 15px",
        paddingLeft:
          navDrawerOpen && this.props.width !== styles.SMALL
            ? paddingLeftDrawerOpen
            : 0
      }
    };

    return (
      <BrowserRouter>
        <div id="app">
          <Header send={this.send} />

          <div style={my_styles.container}>
            <Route path="/" component={Main} store={this.props.store} />
          </div>
        </div>
      </BrowserRouter>
    );
  }
}

export default hot(module)(App);
