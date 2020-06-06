import React from "react";

import { FileViewer, SuiteViewer, TestViewer } from "../components/TestDetails";
import store from "../store";

export function treenodeViewerComponent(id, editFileCallback) {
  if (id === undefined) {
    return null;
  }

  let node = store.suites.get_children_by_full_id(id);

  if (node.type === "suite") {
    return <SuiteViewer id={node.name} />;
  } else if (node.type === "file" || node.type === "directory") {
    return <FileViewer id={node.name} suite={node.id_path[0]} />;
  } else if (node.type === "test") {
    return (
      <TestViewer
        id={node.id}
        name={node.id}
        test={node.raw_test_result}
        suite={node.id_path[0]}
        last_updated={node.last_updated}
        editFile={editFileCallback}
      />
    );
  }
}
