import "./index.css";

import React from "react";
import ReactDOM from "react-dom";
import Moment from "react-moment";

import App from "./App";
import registerServiceWorker from "./registerServiceWorker";
import store from "./store";

// Start the pooled timer which runs every 60 seconds
// (60000 milliseconds) by default.
Moment.startPooledTimer(10000);

ReactDOM.render(<App key="app" store={store} />, document.getElementById("root"));
registerServiceWorker();
