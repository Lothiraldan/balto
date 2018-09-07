import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import registerServiceWorker from "./registerServiceWorker";
import Moment from "react-moment";

// Start the pooled timer which runs every 60 seconds
// (60000 milliseconds) by default.
Moment.startPooledTimer(10000);

ReactDOM.render(<App key="app" />, document.getElementById("root"));
registerServiceWorker();
