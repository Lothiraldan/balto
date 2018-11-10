import React from "react";

import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { linkTo } from "@storybook/addon-links";
import { RunDetails } from "../components/RunsList";

import { Button, Welcome } from "@storybook/react/demo";
import moment from "moment";
import { withKnobs, select, number } from "@storybook/addon-knobs";

const stories = storiesOf("RunDetails", module);

stories.addDecorator(withKnobs);

stories
  .add("starting", () => {
    let date_started = moment();
    let run_id = "8afca26b071647cf9bcc97c485d8ebdb";
    let run = {};
    return (
      <RunDetails
        date_started={date_started}
        run_id={run_id}
        status={"starting"}
        run={run}
      />
    );
  })
  .add("running", () => {
    let date_started = moment();
    let run_id = "8afca26b071647cf9bcc97c485d8ebdb";
    let run = {};

    let test_number = number("test_number", 31, {
      range: true,
      min: 0,
      max: 99999,
      step: 1
    });

    let done = number("done", 0, {
      range: true,
      min: 0,
      max: test_number,
      step: 1
    });

    return (
      <RunDetails
        date_started={date_started}
        run_id={run_id}
        status={"running"}
        run={run}
        test_number={test_number}
        done={done}
      />
    );
  })
  .add("finished", () => {
    let date_started = moment();
    let run_id = "8afca26b071647cf9bcc97c485d8ebdb";
    let run = {};
    let test_number = number("test_number", 31, {
      range: true,
      min: 0,
      max: 99999,
      step: 1
    });

    let done = number("done", 0, {
      range: true,
      min: 0,
      max: test_number,
      step: 1
    });

    let return_code = select("return_code", [0, 1, 2, 10, 100, 255], 0);

    let total_duration = number("total_duration", 0, {
      range: true,
      min: 0,
      max: 99999,
      step: 1
    });

    return (
      <RunDetails
        date_started={date_started}
        run_id={run_id}
        status={"finished"}
        run={run}
        test_number={test_number}
        done={done}
        return_code={return_code}
        total_duration={total_duration / 1000}
      />
    );
  });
