import { hot } from "react-hot-loader";
import React, { Component } from "react";
import "./App.css";
import "react-checkbox-tree/lib/react-checkbox-tree.css";
import "flexboxgrid/css/flexboxgrid.css";
import "font-awesome/css/font-awesome.min.css";
import { treeFromTests } from "./tree.js";
import { socket } from "./websocket.js";
import ThemeDefault from "./theme-default.js";
import withWidth, { LARGE, SMALL } from "material-ui/utils/withWidth";
import PropTypes from "prop-types";
import Header from "./components/Header";
import darkBaseTheme from "material-ui/styles/baseThemes/darkBaseTheme";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import getMuiTheme from "material-ui/styles/getMuiTheme";
import Paper from "material-ui/Paper";
import { Provider, Subscribe, Container } from "unstated";
import MainContainer from "./containers/main";
import { Route } from "react-router";
import { BrowserRouter } from "react-router-dom";
import { state } from "./state";
import Mousetrap from "mousetrap";
import _ from "lodash";

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
      this.setState({ navDrawerOpen: nextProps.width === LARGE });
    }
  }

  handleChangeRequestNavDrawer() {
    this.setState({
      navDrawerOpen: !this.state.navDrawerOpen
    });
  }

  componentDidMount() {
    socket.onmessage = event => {
      state.newMessage(event);
    };
    socket.onerror = error => {
      console.log("ERROR " + error);
    };
  }

  collectAll() {
    let data = { jsonrpc: "2.0", id: 0, method: "collect_all", params: null };
    socket.send(JSON.stringify(data));
  }

  runAll() {
    let data = { jsonrpc: "2.0", id: 0, method: "run_all", params: null };
    socket.send(JSON.stringify(data));
  }

  runSelected = () => {
    let params = {};
    for (var test_id of state.state.checked) {
      var parsed = JSON.parse(test_id);
      setDefault(params, parsed.suite, []).push(parsed.id);
    }
    let data = {
      jsonrpc: "2.0",
      id: 0,
      method: "run_selected",
      params: params
    };
    socket.send(JSON.stringify(data));
  };

  render() {
    let { navDrawerOpen } = this.state;
    const paddingLeftDrawerOpen = 236;

    const styles = {
      header: {
        paddingLeft: navDrawerOpen ? paddingLeftDrawerOpen : 0
      },
      container: {
        margin: "80px 20px 20px 15px",
        paddingLeft:
          navDrawerOpen && this.props.width !== SMALL
            ? paddingLeftDrawerOpen
            : 0
      }
    };

    return (
      <BrowserRouter>
        <Provider>
          <MuiThemeProvider muiTheme={ThemeDefault}>
            <div>
              <Header
                styles={styles.header}
                handleChangeRequestNavDrawer={this.handleChangeRequestNavDrawer.bind(
                  this
                )}
                collectAll={this.collectAll}
                runAll={this.runAll}
                runSelected={this.runSelected}
              />

              <div style={styles.container}>
                <Route path="/" component={MainContainer} />
              </div>
            </div>
          </MuiThemeProvider>
        </Provider>
      </BrowserRouter>
    );
  }
}

export default hot(module)(withWidth()(App));
