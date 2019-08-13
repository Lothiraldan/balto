import { hot } from "react-hot-loader";
import React, { Component } from "react";
import { socket } from "./websocket.js";
import PropTypes from "prop-types";
import HeaderContainer from "./containers/Header";
import { Provider } from "unstated";
import MainContainer from "./containers/main";
import { Route } from "react-router";
import { BrowserRouter } from "react-router-dom";
import { state } from "./state";
import _ from "lodash";

import './App.sass';
import "./App.css";
import "font-awesome/css/font-awesome.min.css";
import styles from "flexboxgrid/css/flexboxgrid.css";


function setDefault(obj, prop, deflt) {
  return obj.hasOwnProperty(prop) ? obj[prop] : (obj[prop] = deflt);
}

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
      state.newMessage(event);
    };
    socket.onerror = error => {
      console.log("ERROR " + error);
    };
    socket.onclose = event => {
      console.log("CLOSED", event);
    };
  }

  send(data) {
    socket.send(data);
  }

  render() {
    let { navDrawerOpen } = this.state;
    const paddingLeftDrawerOpen = 236;

    const styles = {
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
        <Provider>
          <div id="app">
            <HeaderContainer send={this.send} />

            <div style={styles.container}>
              <Route path="/" component={MainContainer} />
            </div>
          </div>
        </Provider>
      </BrowserRouter>
    );
  }
}

export default hot(module)(App);
