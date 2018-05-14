import React from "react";
import TextField from "material-ui/TextField";
import { white, blue500 } from "material-ui/styles/colors";
import IconButton from "material-ui/IconButton";
import Search from "material-ui/svg-icons/action/search";
import Mousetrap from "mousetrap";

import { state } from "../state";

class SearchBox extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    Mousetrap.bind(["ctrl+k"], this.focusSearchBox);
  }

  componentWillUnmount() {
    Mousetrap.unbind(["ctrl+k"]);
  }

  focusSearchBox = () => {
    this.refs.search.focus();

    return false;
  };

  render() {
    const styles = {
      iconButton: {
        float: "left",
        paddingTop: 17
      },
      textField: {
        color: white,
        backgroundColor: blue500,
        borderRadius: 2,
        height: 35
      },
      inputStyle: {
        color: white,
        paddingLeft: 5
      },
      hintStyle: {
        height: 16,
        paddingLeft: 5,
        color: white
      }
    };

    return (
      <div>
        <IconButton style={styles.iconButton}>
          <Search color={white} />
        </IconButton>
        <TextField
          hintText="Search..."
          underlineShow={false}
          fullWidth={true}
          style={styles.textField}
          inputStyle={styles.inputStyle}
          hintStyle={styles.hintStyle}
          ref={"search"}
          onChange={(event, newvalue) => state.setFilterText(newvalue)}
        />
      </div>
    );
  }
}

export default SearchBox;
