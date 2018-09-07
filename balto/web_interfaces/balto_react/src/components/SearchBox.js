import React from "react";
import Mousetrap from "mousetrap";

import { state } from "../state";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

class SearchBox extends React.Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
  }

  componentDidMount() {
    Mousetrap.bind(["ctrl+k"], this.focusSearchBox);
  }

  componentWillUnmount() {
    Mousetrap.unbind(["ctrl+k"]);
  }

  focusSearchBox = () => {
    console.log("REFS", this.myRef.current);
    this.myRef.current.focus();

    return false;
  };

  render() {
    return (
      <div className="field is-expanded">
        <p className="control has-icons-left">
          <input
            className="input"
            placeholder="Search"
            value={state.filterText}
            onChange={event => state.setFilterText(event.target.value)}
            ref={this.myRef}
          />
          <span className="icon is-small is-left">
            <FontAwesomeIcon icon={faSearch} />
          </span>
        </p>
      </div>
    );
  }
}

export default SearchBox;
