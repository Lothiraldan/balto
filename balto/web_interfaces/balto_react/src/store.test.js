import {
  AllRuns,
  AllSuites,
  Run,
  SingleTestLeaf,
  Store,
  TestDirectoryNode,
  TestFileNode,
  TestSuiteNode,
  deselect_selected_by_parent,
  status_map,
} from "./store";

function uuid4(a) {
  return a
    ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
    : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, uuid4);
}

function expected_status_map(expected) {
  let map = status_map();
  if (expected) {
    for (let [key, value] of Object.entries(expected)) {
      map.set(key, value);
    }
  }
  return map;
}

function get_test_leaf() {
  return new SingleTestLeaf(
    "my_test",
    "my_test_dir::my_test_file::my_test",
    ["my_suite", "my_test_dir", "my_test_file", "my_test.py"],
    "passed",
    1
  );
}

function get_test_file() {
  return new TestFileNode("my_test_file", "my_test_dir::my_test_file", [
    "my_suite",
    "my_test_dir",
    "my_test_file",
  ]);
}

function get_test_dir() {
  return new TestDirectoryNode("my_test_dir", "my_test_dir", [
    "my_suite",
    "my_test_dir",
  ]);
}

function get_suite() {
  return new TestSuiteNode("my_test_dir", "my_suite", ["my_suite"]);
}

function get_all_suites() {
  return new AllSuites();
}

function get_simple_test_tree(): AllSuites {
  // Return a tree consisting of one suite, two test suites, one in a folder,
  // and one test per file
  const suites = get_all_suites();

  suites.add_full_qualified_leaf(
    "my_suite",
    "my_test_1",
    "my_test_dir::my_test_file::my_test_1",
    "my_test_dir/my_test_file.py",
    "failed",
    1.7
  );
  suites.add_full_qualified_leaf(
    "my_suite",
    "my_test_2",
    "my_test_file::my_test_2",
    "my_test_file.py",
    "passed",
    1.7
  );

  return suites;
}

test("SingleTestLeaf can be created", () => {
  get_test_leaf();
});
test("SingleTestLeaf are by default not selected", () => {
  const leaf = get_test_leaf();
  expect(leaf.selected).toEqual("false");
});
test("SingleTestLeaf are by default visible", () => {
  const leaf = get_test_leaf();
  expect(leaf.visible).toEqual(true);
});

test("TestFileNode can be created", () => {
  get_test_file();
});
test("TestFileNode has no children by default", () => {
  const file_node = get_test_file();
  expect(file_node.get_childrens()).toEqual([]);
});
test("We can add a children to TestFileNode", () => {
  const file_node = get_test_file();
  const leaf = get_test_leaf();

  file_node.add_children(leaf);
  expect(file_node.get_childrens()).toEqual([[leaf.id, leaf]]);
});

test("We can add a children to TestFileNode and the status count is correct", () => {
  const file_node = get_test_file();

  expect(file_node.status_summary).toEqual(expected_status_map());

  const leaf = get_test_leaf();

  file_node.add_children(leaf);
  expect(file_node.status_summary).toEqual(expected_status_map({ passed: 1 }));

  const leaf2 = new SingleTestLeaf(
    "my_test2",
    "my_test_file::my_test2",
    ["my_suite", "my_test_file", "my_test2.py"],
    "failed",
    1
  );

  file_node.add_children(leaf2);
  expect(file_node.status_summary).toEqual(
    expected_status_map({ passed: 1, failed: 1 })
  );
});
test("We can add a children to TestFileNode and the total duration is correct", () => {
  const file_node = get_test_file();
  expect(file_node.duration).toEqual(0);

  const leaf = get_test_leaf();
  file_node.add_children(leaf);
  expect(file_node.duration).toEqual(1);

  const leaf2 = new SingleTestLeaf(
    "my_test2",
    "my_test_file::my_test2",
    ["my_suite", "my_test_file", "my_test2.py"],
    "passed",
    0.7
  );
  file_node.add_children(leaf2);
  expect(file_node.duration).toEqual(1.7);
});
test("We can add a children to TestFileNode and the test_number is correct", () => {
  const file_node = get_test_file();
  expect(file_node.test_number).toEqual(0);

  const leaf = get_test_leaf();
  file_node.add_children(leaf);
  expect(file_node.test_number).toEqual(1);

  const leaf2 = new SingleTestLeaf(
    "my_test2",
    "my_test_file::my_test2",
    ["my_suite", "my_test_file", "my_test2.py"],
    "passed",
    0.7
  );
  file_node.add_children(leaf2);
  expect(file_node.test_number).toEqual(2);
});
test("We can add a children to TestFileNode and the visible status is correct", () => {
  const file_node = get_test_file();
  const leaf = get_test_leaf();
  file_node.add_children(leaf);

  expect(file_node.visible).toEqual(true);

  leaf.visible = false;
  expect(file_node.visible).toEqual(false);
});

test("We can instantiate a TestDirectoryNode", () => {
  get_test_dir();
});
test("We can add a children to TestDirectoryNode", () => {
  const dir_node = get_test_dir();
  const file_node = get_test_file();

  dir_node.add_children(file_node);
});
test("We can add a children to TestDirectoryNode and the count is correct", () => {
  const dir_node = get_test_dir();
  const file_node = get_test_file();

  dir_node.add_children(file_node);
  expect(dir_node.status_summary).toEqual(expected_status_map());
});
test("We can add a children to TestDirectoryNode and the duration is correct", () => {
  const dir_node = get_test_dir();
  const file_node = get_test_file();

  dir_node.add_children(file_node);
  expect(dir_node.duration).toEqual(0);
});

test("We can add a test and dir to TestDirectoryNode", () => {
  const dir_node = get_test_dir();
  const file_node = get_test_file();
  const test_node = get_test_leaf();

  dir_node.add_children(file_node);
  file_node.add_children(test_node);
});
test("We can add a test and dir to TestDirectoryNode and the summary is correct", () => {
  const dir_node = get_test_dir();
  const file_node = get_test_file();
  const test_node = get_test_leaf();

  dir_node.add_children(file_node);
  file_node.add_children(test_node);

  expect(dir_node.status_summary).toEqual(expected_status_map({ passed: 1 }));
});
test("We can add a test and dir to TestDirectoryNode and the duration is correct", () => {
  const dir_node = get_test_dir();
  const file_node = get_test_file();
  const test_node = get_test_leaf();

  dir_node.add_children(file_node);
  file_node.add_children(test_node);

  expect(dir_node.duration).toEqual(1);
});

test("We can instantiate a SuiteNode", () => {
  get_suite();
});
test("We can add a TestDirectoryNode to a SuiteNode", () => {
  const suite = get_suite();
  const dir_node = get_test_dir();
  const file_node = get_test_file();
  const test_node = get_test_leaf();

  suite.add_children(dir_node);
  dir_node.add_children(file_node);
  file_node.add_children(test_node);
});
test("We can instantiate a TestDirectoryNode to a SuiteNode and the summary is correct", () => {
  const suite = get_suite();
  const dir_node = get_test_dir();
  const file_node = get_test_file();
  const test_node = get_test_leaf();

  suite.add_children(dir_node);
  dir_node.add_children(file_node);
  file_node.add_children(test_node);

  expect(suite.status_summary).toEqual(expected_status_map({ passed: 1 }));
});
test("We can instantiate a TestDirectoryNode to a SuiteNode and the duration is correct", () => {
  const suite = get_suite();
  const dir_node = get_test_dir();
  const file_node = get_test_file();
  const test_node = get_test_leaf();

  suite.add_children(dir_node);
  dir_node.add_children(file_node);
  file_node.add_children(test_node);

  expect(suite.duration).toEqual(1);
});

test("We can add a full-qualified test in a dir on a SuiteNode", () => {
  const all_suites = get_all_suites();

  all_suites.add_full_qualified_leaf(
    "my_suite",
    "my_test",
    "my_test_dir::my_test_file::my_test",
    "my_test_dir/my_test_file.py",
    "skipped",
    1.7
  );

  expect(all_suites.duration).toEqual(1.7);
  expect(all_suites.status_summary).toEqual(
    expected_status_map({ skipped: 1 })
  );
});
test("We can add a full-qualified test on a SuiteNode", () => {
  const all_suites = get_all_suites();

  all_suites.add_full_qualified_leaf(
    "my_suite",
    "my_test",
    "my_test_file::my_test",
    "my_test_file.py",
    "skipped",
    1.7
  );

  expect(all_suites.duration).toEqual(1.7);
  expect(all_suites.status_summary).toEqual(
    expected_status_map({ skipped: 1 })
  );
});

test("The visible attributes is correct for all suites", () => {
  const all_suites = get_all_suites();

  all_suites.add_full_qualified_leaf(
    "my_suite",
    "my_test",
    "my_test_file::my_test",
    "my_test_file.py",
    "skipped",
    1.7
  );
  let leaf = all_suites.get_children_by_full_id(
    "my_test_file::my_test"
  );

  expect(all_suites.visible).toEqual(true);
  expect(leaf.visible).toEqual(true);

  all_suites.visible = false;

  expect(all_suites.visible).toEqual(false);
  expect(leaf.visible).toEqual(false);
  
  leaf.visible = true;
  expect(all_suites.visible).toEqual(true);
  
  leaf.visible = false;
  all_suites.visible = true;
  expect(leaf.visible).toEqual(true);
});
test("We can add multiple full-qualified test and the aggregated attributes are corrects", () => {
  const all_suites = get_all_suites();

  all_suites.add_full_qualified_leaf(
    "my_suite",
    "my_test",
    "my_test_dir::my_test_file::my_test",
    "my_test_dir/my_test_file.py",
    "failed",
    1.7
  );
  all_suites.add_full_qualified_leaf(
    "my_suite",
    "my_test_2",
    "my_test_dir::my_test_file::my_test_2",
    "my_test_dir/my_test_file.py",
    "passed",
    0.1
  );
  all_suites.add_full_qualified_leaf(
    "my_suite",
    "my_test_3",
    "my_test_dir::my_test_file_2::my_test_3",
    "my_test_dir/my_test_file_2.py",
    "collected",
    0.2
  );
  all_suites.add_full_qualified_leaf(
    "my_suite",
    "my_test_4",
    "my_root_file::my_test_4",
    "my_root_file.py",
    "passed",
    0.4
  );

  expect(all_suites.duration).toEqual(2.4);
  expect(all_suites.status_summary).toEqual(
    expected_status_map({ failed: 1, passed: 2, collected: 1 })
  );

  expect(
    all_suites.get_children_by_full_id("my_suite/my_test_dir").duration
  ).toEqual(2);
  expect(
    all_suites.get_children_by_full_id("my_suite/my_test_dir").status_summary
  ).toEqual(expected_status_map({ failed: 1, passed: 1, collected: 1 }));

  expect(
    all_suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .duration
  ).toEqual(1.8);
  expect(
    all_suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .status_summary
  ).toEqual(expected_status_map({ failed: 1, passed: 1 }));

  expect(
    all_suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file_2.py")
      .duration
  ).toEqual(0.2);
  expect(
    all_suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file_2.py")
      .status_summary
  ).toEqual(expected_status_map({ collected: 1 }));

  expect(
    all_suites.get_children_by_full_id("my_suite/my_root_file.py").duration
  ).toEqual(0.4);
  expect(
    all_suites.get_children_by_full_id("my_suite/my_root_file.py")
      .status_summary
  ).toEqual(expected_status_map({ passed: 1 }));
});

// Test tree selection
test("We can select and deselect a test leaf", () => {
  const suites = get_simple_test_tree();
  expect(suites.selected_number).toEqual(0);

  const leaf = suites.get_children_by_full_id(
    "my_test_dir::my_test_file::my_test_1"
  );
  leaf.select();

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("true");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("false");

  expect(leaf.selected_nodes).toEqual({
    suites: [],
    files: [],
    tests: ["my_test_dir::my_test_file::my_test_1"],
  });
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected_nodes
  ).toEqual({
    suites: [],
    files: [],
    tests: ["my_test_dir::my_test_file::my_test_1"],
  });
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected_nodes
  ).toEqual({
    suites: [],
    files: [],
    tests: ["my_test_dir::my_test_file::my_test_1"],
  });
  expect(suites.selected_nodes).toEqual({
    my_suite: {
      files: [],
      nodeids: ["my_test_dir::my_test_file::my_test_1"],
    },
  });
  expect(suites.selected_number).toEqual(1);

  leaf.deselect();

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("false");
  expect(suites.selected_nodes).toEqual({});
  expect(suites.selected_number).toEqual(0);
});

test("We can select and deselect a test file", () => {
  const suites = get_simple_test_tree();
  const node = suites.get_children_by_full_id(
    "my_suite/my_test_dir/my_test_file.py"
  );
  node.select();

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("true");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("false");
  expect(suites.selected_nodes).toEqual({
    my_suite: {
      files: ["my_suite/my_test_dir/my_test_file.py"],
      nodeids: [],
    },
  });

  node.deselect();

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("false");
  expect(suites.selected_nodes).toEqual({});
});

test("We can select and deselect a test directory", () => {
  const suites = get_simple_test_tree();
  const node = suites.get_children_by_full_id("my_suite/my_test_dir");
  node.select();

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("true");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("false");
  expect(suites.selected_nodes).toEqual({
    my_suite: {
      files: ["my_suite/my_test_dir"],
      nodeids: [],
    },
  });

  node.deselect();

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("false");
  expect(suites.selected_nodes).toEqual({});
});

test("We can select and deselect a suite", () => {
  const suites = get_simple_test_tree();
  const node = suites.get_children("my_suite");
  node.select();

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("true");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("parent");
  expect(suites.selected_nodes).toEqual({
    my_suite: { full: true },
  });

  node.deselect();

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("false");
  expect(suites.selected_nodes).toEqual({});
});

test("We can expand the selection of a test file", () => {
  const suites = get_simple_test_tree();
  const node = suites.get_children_by_full_id(
    "my_suite/my_test_dir/my_test_file.py"
  );
  node.select();

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("true");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("false");
  expect(suites.selected_nodes).toEqual({
    my_suite: {
      files: ["my_suite/my_test_dir/my_test_file.py"],
      nodeids: [],
    },
  });

  node.expandSelection();

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("true");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("false");
  expect(suites.selected_nodes).toEqual({
    my_suite: {
      files: [],
      nodeids: ["my_test_dir::my_test_file::my_test_1"],
    },
  });
});

test("We can expand the selection of a test directory", () => {
  const suites = get_simple_test_tree();
  const node = suites.get_children_by_full_id("my_suite/my_test_dir");
  node.select();

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("true");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("false");
  expect(suites.selected_nodes).toEqual({
    my_suite: {
      files: ["my_suite/my_test_dir"],
      nodeids: [],
    },
  });

  node.expandSelection();

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("true");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("false");
  expect(suites.selected_nodes).toEqual({
    my_suite: {
      files: ["my_suite/my_test_dir/my_test_file.py"],
      nodeids: [],
    },
  });
});

test("We can expand the selection of a test suite", () => {
  const suites = get_simple_test_tree();
  const node = suites.get_children("my_suite");
  node.select();

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("true");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("parent");
  expect(suites.selected_nodes).toEqual({ my_suite: { full: true } });

  node.expandSelection();

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("true");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("true");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("parent");
  expect(suites.selected_nodes).toEqual({
    my_suite: {
      files: ["my_suite/my_test_dir", "my_suite/my_test_file.py"],
      nodeids: [],
    },
  });
});

test("We can deselect a parent-selected test", () => {
  const suites = get_simple_test_tree();
  const node = suites.get_children_by_full_id(
    "my_suite/my_test_dir/my_test_file.py"
  );
  node.select();

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("true");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("false");
  expect(suites.selected_nodes).toEqual({
    my_suite: {
      files: ["my_suite/my_test_dir/my_test_file.py"],
      nodeids: [],
    },
  });

  const test_leaf = suites.get_children_by_full_id(
    "my_test_dir::my_test_file::my_test_1"
  );
  deselect_selected_by_parent(suites, test_leaf.id);

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("false");
  expect(suites.selected_nodes).toEqual({});
});

test("We can deselect a grandparent-selected test", () => {
  const suites = get_simple_test_tree();
  const node = suites.get_children_by_full_id("my_suite/my_test_dir");
  node.select();

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("true");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("false");
  expect(suites.selected_nodes).toEqual({
    my_suite: {
      files: ["my_suite/my_test_dir"],
      nodeids: [],
    },
  });

  const test_leaf = suites.get_children_by_full_id(
    "my_test_dir::my_test_file::my_test_1"
  );
  deselect_selected_by_parent(suites, test_leaf.id);

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("false");
  expect(suites.selected_nodes).toEqual({});
});
test("We can deselect a grandgrandparent-selected test", () => {
  const suites = get_simple_test_tree();
  const node = suites.get_children_by_full_id("my_suite");
  node.select();

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("true");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("parent");
  expect(suites.selected_nodes).toEqual({ my_suite: { full: true } });

  const test_leaf = suites.get_children_by_full_id(
    "my_test_dir::my_test_file::my_test_1"
  );
  deselect_selected_by_parent(suites, test_leaf.id);

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("true");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("parent");
  expect(suites.selected_nodes).toEqual({
    my_suite: {
      files: ["my_suite/my_test_file.py"],
      nodeids: [],
    },
  });
});
test("We can deselect a grandgrandparent-selected dir", () => {
  const suites = get_simple_test_tree();
  const node = suites.get_children_by_full_id("my_suite/my_test_dir");
  node.select();

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("true");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("parent");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("false");
  expect(suites.selected_nodes).toEqual({
    my_suite: {
      files: ["my_suite/my_test_dir"],
      nodeids: [],
    },
  });

  const test_leaf = suites.get_children_by_full_id(
    "my_suite/my_test_dir/my_test_file.py"
  );
  deselect_selected_by_parent(suites, test_leaf.id);

  expect(suites.get_children_by_full_id("my_suite").selected).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_dir/my_test_file.py")
      .selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_dir::my_test_file::my_test_1")
      .selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_suite/my_test_file.py").selected
  ).toEqual("false");
  expect(
    suites.get_children_by_full_id("my_test_file::my_test_2").selected
  ).toEqual("false");
  expect(suites.selected_nodes).toEqual({});
});

// Test Runs
test("Test Run default values", () => {
  const uuid = uuid4();
  const run = new Run(uuid);

  expect(run.uuid).toEqual(uuid);
  expect(run.status).toEqual("starting");
  expect(run.done).toEqual(0);
  expect(run.test_number).toEqual(undefined);
  expect(run.total_duration).toEqual(undefined);

  expect(run.total_error).toEqual(undefined);
  expect(run.total_passed).toEqual(undefined);
  expect(run.total_failed).toEqual(undefined);
  expect(run.total_skipped).toEqual(undefined);
});
test("Test Run session_start", () => {
  const uuid = uuid4();
  const run = new Run(uuid);

  const test_number = 2;
  run.session_start(test_number);

  expect(run.uuid).toEqual(uuid);
  expect(run.status).toEqual("running");
  expect(run.done).toEqual(0);
  expect(run.test_number).toEqual(2);
});
test("Test Run test result", () => {
  const uuid = uuid4();
  const run = new Run(uuid);

  const test_number = 2;
  run.session_start(test_number);
  const test_id = "my_test_dir::my_test_file::my_test";
  run.test_result(test_id);

  expect(run.uuid).toEqual(uuid);
  expect(run.status).toEqual("running");
  expect(run.done).toEqual(1);
  expect(run.test_number).toEqual(2);
});

test("Test Run two test result", () => {
  const uuid = uuid4();
  const run = new Run(uuid);

  const test_number = 2;
  run.session_start(test_number);
  const test_id = "my_test_dir::my_test_file::my_test";
  run.test_result(test_id);
  const test_id_2 = "my_test_dir::my_test_file::my_test2";
  run.test_result(test_id_2);

  expect(run.uuid).toEqual(uuid);
  expect(run.status).toEqual("running");
  expect(run.done).toEqual(2);
  expect(run.test_number).toEqual(2);
});

test("Test Run session end", () => {
  const uuid = uuid4();
  const run = new Run(uuid);

  const test_number = 2;
  run.session_start(test_number);
  const test_id = "my_test_dir::my_test_file::my_test";
  run.test_result(test_id);
  const test_id_2 = "my_test_dir::my_test_file::my_test2";
  run.test_result(test_id_2);

  const total_duration = 42.42;
  // Total test numbers can be 0 in case of test collection
  const passed = 0;
  const failed = 0;
  const error = 0;
  const skipped = 0;
  run.session_end(total_duration, passed, failed, error, skipped);

  expect(run.uuid).toEqual(uuid);
  expect(run.status).toEqual("running");
  expect(run.done).toEqual(2);
  expect(run.test_number).toEqual(2);
  expect(run.total_duration).toEqual(total_duration);

  expect(run.total_error).toEqual(error);
  expect(run.total_passed).toEqual(passed);
  expect(run.total_failed).toEqual(failed);
  expect(run.total_skipped).toEqual(skipped);
});

test("Test Run run stop", () => {
  const uuid = uuid4();
  const run = new Run(uuid);

  const test_number = 2;
  run.session_start(test_number);
  const test_id = "my_test_dir::my_test_file::my_test";
  run.test_result(test_id);
  const test_id_2 = "my_test_dir::my_test_file::my_test2";
  run.test_result(test_id_2);

  const total_duration = 42.42;
  // Total test numbers can be 0 in case of test collection
  const passed = 0;
  const failed = 0;
  const error = 0;
  const skipped = 0;
  run.session_end(total_duration, passed, failed, error, skipped);

  const return_code = 0;
  const return_message = "collecting\n";
  run.run_stop(return_code, return_message);

  expect(run.uuid).toEqual(uuid);
  expect(run.status).toEqual("finished");
  expect(run.done).toEqual(2);
  expect(run.test_number).toEqual(2);
  expect(run.total_duration).toEqual(total_duration);

  expect(run.total_error).toEqual(error);
  expect(run.total_passed).toEqual(passed);
  expect(run.total_failed).toEqual(failed);
  expect(run.total_skipped).toEqual(skipped);

  expect(run.return_code).toEqual(return_code);
  expect(run.return_message).toEqual(return_message);
});

test("Test whole run scenario", () => {
  const uuid = "60df6b7543f74777884b9fdf24adfdb3";
  const total_duration = 2.279815196990967;
  const passed = 1;
  const failed = 1;
  const error = 1;
  const skipped = 0;
  const return_code = 1;
  const return_message = "collecting ... \n";

  const messages = [
    { _type: "run_start", run_id: uuid },
    {
      _type: "session_start",
      test_number: 3,
      suite_name: "Acceptance Test Suite Subprocess",
      run_id: uuid,
    },
    {
      _type: "test_result",
      file: "test_class.py",
      line: 7,
      test_name: "TestClassPassing.test_passing",
      duration: 0.00046181678771972656,
      durations: {
        setup: 0.00021958351135253906,
        call: 0.00011539459228515625,
        teardown: 0.00012683868408203125,
      },
      outcome: "passed",
      id: "test_class.py::TestClassPassing::()::test_passing",
      stdout: "",
      stderr: "",
      error: { humanrepr: "" },
      logs: "",
      skipped_messages: {},
      suite_name: "Acceptance Test Suite Subprocess",
      run_id: uuid,
    },
    {
      _type: "test_result",
      file: "test_class.py",
      line: 18,
      test_name: "TestClassFailing.test_failing",
      duration: 0.0004570484161376953,
      durations: {
        setup: 0.0001304149627685547,
        call: 0.0001690387725830078,
        teardown: 0.0001575946807861328,
      },
      outcome: "failed",
      id: "test_class.py::TestClassFailing::()::test_failing",
      stdout: "",
      stderr: "",
      error: {
        humanrepr:
          "self = <test_class.TestClassFailing object at 0x7f21552b0e50>\n\n    def test_failing(self):\n>       assert False\nE       assert False\n\ntest_class.py:20: AssertionError",
      },
      logs: "",
      skipped_messages: {},
      suite_name: "Acceptance Test Suite Subprocess",
      run_id: uuid,
    },
    {
      _type: "test_result",
      file: "test_class.py",
      line: 29,
      test_name: "TestClassError.test_error",
      duration: 0.00042891502380371094,
      durations: {
        setup: 0.0001442432403564453,
        call: 0.00012445449829101562,
        teardown: 0.00016021728515625,
      },
      outcome: "failed",
      id: "test_class.py::TestClassError::()::test_error",
      stdout: "",
      stderr: "",
      error: {
        humanrepr:
          "self = <test_class.TestClassError object at 0x7f215531bc90>\n\n    def test_error(self):\n>       1 / 0\nE       ZeroDivisionError: division by zero\n\ntest_class.py:31: ZeroDivisionError",
      },
      logs: "",
      skipped_messages: {},
      suite_name: "Acceptance Test Suite Subprocess",
      run_id: uuid,
    },
    {
      _type: "session_end",
      total_duration: total_duration,
      passed: passed,
      failed: failed,
      error: error,
      skipped: skipped,
      suite_name: "Acceptance Test Suite Subprocess",
      run_id: uuid,
    },
    {
      _type: "run_stop",
      run_id: uuid,
      return_code: return_code,
      return_message: return_message,
    },
  ];

  const store = new Store();

  // Process the messages
  for (const msg of messages) {
    store.process_single_msg(msg);
  }

  const run = store.runs.runs.get(uuid);

  expect(run.uuid).toEqual(uuid);
  expect(run.status).toEqual("finished");
  expect(run.done).toEqual(3);
  expect(run.test_number).toEqual(3);
  expect(run.total_duration).toEqual(total_duration);

  expect(run.total_error).toEqual(error);
  expect(run.total_passed).toEqual(passed);
  expect(run.total_failed).toEqual(failed);
  expect(run.total_skipped).toEqual(skipped);

  expect(run.return_code).toEqual(return_code);
  expect(run.return_message).toEqual(return_message);
});

test("Test collect and run scenario", () => {
  const collect_uuid = "60df6b7543f74777884b9fdf24adfdb3";
  const run_uuid = "1caa4528109d4d258c8642ebcfb05c6d";
  const suite_name = "Acceptance Test Suite Subprocess";
  const file = "test_class.py";
  const test_name = "TestClassPassing.test_passing";
  const test_id = "test_class.py::TestClassPassing::()::test_passing";
  // const test_name =
  const return_code = 1;
  const return_message = "collecting ... \n";

  const collect_messages = [
    { _type: "run_start", run_id: collect_uuid },
    {
      _type: "session_start",
      test_number: 1,
      suite_name: suite_name,
      run_id: collect_uuid,
    },
    {
      _type: "test_collection",
      line: 8,
      file: file,
      test_name: test_name,
      id: test_id,
      run_id: collect_uuid,
    },
    {
      _type: "session_end",
      total_duration: 0.23460721969604492,
      passed: 0,
      failed: 0,
      error: 0,
      skipped: 0,
      run_id: collect_uuid,
    },
    {
      _type: "run_stop",
      run_id: collect_uuid,
      return_code: return_code,
      return_message: return_message,
    },
  ];

  const run_messages = [
    { _type: "run_start", run_id: run_uuid },
    {
      _type: "session_start",
      test_number: 1,
      suite_name: suite_name,
      run_id: run_uuid,
    },
    {
      _type: "test_result",
      file: file,
      line: 8,
      test_name: test_name,
      duration: 0.0008356571197509766,
      durations: {
        setup: 0.0004138946533203125,
        call: 0.0002071857452392578,
        teardown: 0.00021457672119140625,
      },
      outcome: "passed",
      id: test_id,
      stdout: "",
      stderr: "",
      error: { humanrepr: "" },
      logs: "",
      skipped_messages: {},
      run_id: run_uuid,
    },
    {
      _type: "session_end",
      total_duration: 0.23460721969604492,
      passed: 1,
      failed: 0,
      error: 0,
      skipped: 0,
      run_id: run_uuid,
    },
    {
      _type: "run_stop",
      run_id: run_uuid,
      return_code: return_code,
      return_message: return_message,
    },
  ];

  const store = new Store();

  // Process the collect messages first
  for (const msg of collect_messages) {
    store.process_single_msg(msg);
  }

  console.log(store.suites.childrens_by_id.keys());

  const raw_details = store.suites.get_children_by_full_id(test_id)
    .raw_test_result;
  const expected_raw_details = collect_messages[2];

  expect(raw_details).toEqual(expected_raw_details);

  // Then the run messages
  for (const msg of run_messages) {
    store.process_single_msg(msg);
  }

  const run_raw_details = store.suites.get_children_by_full_id(test_id)
    .raw_test_result;
  const expected_run_raw_details = run_messages[2];

  expect(run_raw_details).toEqual(expected_run_raw_details);
});
