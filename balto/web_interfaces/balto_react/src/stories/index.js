import React from "react";

import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { linkTo } from "@storybook/addon-links";
import { RunDetails } from "../components/RunsList";
import { TestViewer } from "../components/TestDetails";

import { Button, Welcome } from "@storybook/react/demo";
import moment from "moment";
import { withKnobs, select, number } from "@storybook/addon-knobs";

const runStories = storiesOf("RunDetails", module);

runStories.addDecorator(withKnobs);

runStories
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

const testStories = storiesOf("TestViewer", module);

testStories.addDecorator(withKnobs);

testStories.add("details", () => {
  let test = {
    _type: "test_result",
    file: "test_class.py",
    line: 18,
    test_name: "TestClassFailing.test_failing",
    duration: 0.001344919204711914,
    durations: {
      setup: 0.00040912628173828125,
      call: 0.0006020069122314453,
      teardown: 0.0003337860107421875
    },
    outcome: "failed",
    id: "test_class.py::TestClassFailing::()::test_failing",
    stdout: "",
    stderr: "",
    error: {
      humanrepr:
        "self = <test_class.TestClassFailing object at 0x7f204283d710>\n\n    def test_failing(self):\n>       assert False\nE       assert False\n\ntest_class.py:20: AssertionError"
    },
    stderr: "STDERR\n",
    stdout: "STDOUT\n",
    logs: "[DEBUG] debug message\n",
    skipped_messages: {},
    suite_name: "Acceptance Test Suite Subprocess",
    run_id: "1256ae16fddd4554bcea7c64352e44e2",
    last_updated: moment()
  };
  return <TestViewer test={test} suite={test.suite_name} id={test._id} />;
});
