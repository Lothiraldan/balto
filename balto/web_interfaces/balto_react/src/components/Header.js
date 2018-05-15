import React from "react";
import AppBar from "material-ui/AppBar";
import SearchBox from "./SearchBox";
import PropTypes from "prop-types";
import RaisedButton from "material-ui/RaisedButton";

class Header extends React.Component {
  static propTypes = {
    styles: PropTypes.object,
    handleChangeRequestNavDrawer: PropTypes.func,
    collectAll: PropTypes.func,
    runAll: PropTypes.func
  };

  render() {
    const { styles, handleChangeRequestNavDrawer } = this.props;

    const style = {
      appBar: {
        position: "fixed",
        top: 0,
        overflow: "hidden",
        maxHeight: 57
      },
      menuButton: {
        marginLeft: 10
      },
      iconsRightContainer: {
        marginLeft: 20
      }
    };

    return (
      <div>
        <AppBar
          style={{ ...styles, ...style.appBar }}
          title={<SearchBox />}
          iconElementLeft={<div />}
          iconElementRight={
            <div style={style.iconsRightContainer}>
              <RaisedButton
                onClick={this.props.collectAll}
                label="Collect all"
              />
              <RaisedButton onClick={this.props.runAll} label="Run all" />
              <RaisedButton
                onClick={this.props.runSelected}
                label="Run selected"
              />
            </div>
          }
        />
      </div>
    );
  }
}

export default Header;
