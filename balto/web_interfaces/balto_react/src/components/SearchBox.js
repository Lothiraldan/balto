import Mousetrap from "mousetrap";
import React from "react";

import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import store from "../store";

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
            value={store.query_text}
            onChange={event => store.set_query_text(event.target.value)}
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
