import FlexSearch from "flexsearch/dist/flexsearch.es5";
import { action, computed, configure, observable } from "mobx";

configure({ enforceActions: "observed" });

export function status_map() {
  return new Map([
    ["passed", 0],
    ["failed", 0],
    ["error", 0],
    ["skipped", 0],
    ["collected", 0],
  ]);
}

function indent(n, str) {
  let prefix = "";
  for (let x = 0; x < n; x++) {
    prefix += "  ";
  }
  return prefix + str;
}

type Selected = "true" | "false" | "parent";

class BaseNode {
  @observable selected = "false";

  @computed get status_summary() {
    // `passed`, `failed`, `error` or `skipped`
    let summary = status_map();
    for (var node of this.childrens.values()) {
      if (node.hasOwnProperty("status_summary")) {
        let status_summary = node.status_summary;
        for (var [key, value] of status_summary.entries()) {
          summary.set(key, summary.get(key) + value);
        }
      } else {
        summary.set(node.status, summary.get(node.status) + 1);
      }
    }
    return summary;
  }

  @computed get duration() {
    let duration = 0;
    for (var node of this.childrens.values()) {
      duration = duration + node.duration;
    }
    return duration;
  }

  @computed get test_number() {
    let total_number = 0;
    for (var node of this.childrens.values()) {
      total_number = total_number + node.test_number;
    }
    return total_number;
  }

  @computed get selected_number() {
    if (this.selected === "true") {
      return 1;
    }

    let total_selected = 0;

    for (var node of this.childrens.values()) {
      total_selected += node.selected_number;
    }

    return total_selected;
  }

  get visible() {
    let visible = false;

    for (var node of this.childrens.values()) {
      visible = visible || node.visible;
    }

    return visible;
  }

  set visible(value) {
    for (var node of this.childrens.values()) {
      node.visible = value;
    }
  }

  debug_tree(level) {
    console.debug(
      indent(
        level,
        `${this.type}: ${this.id}, duration: ${this.duration}, test_number: ${
          this.test_number
        }, direct_children: ${this.childrens.size}, selected: ${
          this.selected
        }, status: ${JSON.stringify([...this.status_summary])}, visible: ${
          this.visible
        }`
      )
    );

    for (let node of this.childrens.values()) {
      node.debug_tree(level + 1);
    }
  }

  @action add_children(children) {
    if (children.id === this.id) {
      throw "Cannot add itself!";
    }
    this.childrens.set(children.id, children);
  }

  get_children(children_id) {
    return this.childrens.get(children_id);
  }

  get_childrens() {
    return Array.from(this.childrens.entries()).sort((key, value) => key);
  }

  @action select() {
    this.selected = "true";

    for (let node of this.childrens.values()) {
      node.parentSelected();
    }
  }

  @action deselect() {
    this.selected = "false";

    for (let node of this.childrens.values()) {
      node.deselect();
    }
  }

  @action deselected_and_select_childrens() {
    this.selected = "false";

    for (let node of this.childrens.values()) {
      node.select();
    }
  }

  @action parentSelected() {
    // TODO: If this.selected is already set to parent, we should likely be
    // able to avoid doing any work here
    this.selected = "parent";

    for (let node of this.childrens.values()) {
      node.parentSelected();
    }
  }

  @action expandSelection() {
    this.selected = "false";

    for (let node of this.childrens.values()) {
      node.select();
    }
  }

  @action select_if_status(status) {
    if (this.selected === "true") {
      this.deselect();
    }

    for (let node of this.childrens.values()) {
      node.select_if_status(status);
    }
  }
}

export class SingleTestLeaf {
  type = "test";
  @observable name;
  @observable id;
  @observable id_path;
  @observable status;
  @observable selected;
  @observable duration;
  @observable last_updated;

  constructor(name, id, id_path, status, duration, parent, raw_test_result) {
    this.name = name;
    this.id = id;
    this.id_path = id_path;
    this.status = status;
    this.selected = "false";
    this.duration = duration;
    this.parent = parent;
    this.raw_test_result = raw_test_result;
    this.last_updated = new Date();
    this.visible = true;
  }

  get test_number() {
    return 1;
  }

  @action update(test_status, test_duration, raw_test_result) {
    this.status = test_status;
    this.duration = test_duration;
    this.raw_test_result = raw_test_result;
    this.last_updated = new Date();
  }

  debug_tree(level) {
    console.debug(
      indent(
        level,
        `${this.type}: ${this.name}, duration: ${this.duration}, selected: ${this.selected}, status: ${this.status}, visible: ${this.visible}`
      )
    );
  }

  @action select() {
    this.selected = "true";
  }

  @action deselect() {
    this.selected = "false";
  }

  @action parentSelected() {
    this.selected = "parent";
  }

  @action deselected_and_select_childrens() {
    this.selected = "false";
  }

  @action select_if_status(status) {
    if (this.selected === "true") {
      this.deselect();
    }

    if (this.status === status) {
      this.select();
    }
  }

  @computed get selected_nodes() {
    if (this.selected === "true") {
      return { suites: [], files: [], tests: [this.id] };
    } else {
      return { suites: [], files: [], tests: [] };
    }
  }

  @computed get selected_number() {
    if (this.selected === "true") {
      return 1;
    } else {
      return 0;
    }
  }
}

export class TestFileNode extends BaseNode {
  type = "file";
  @observable name;
  @observable id;
  @observable id_path;
  @observable childrens = observable.map();

  constructor(name, id, id_path, file_path, parent) {
    super();
    this.name = name;
    this.id = id;
    this.id_path = id_path;
    this.file_path = file_path;
    this.parent = parent;
  }

  @computed get selected_nodes() {
    if (this.selected === "true") {
      return { suites: [], files: [this.file_path], tests: [] };
    }

    let selected_suites = [];
    let selected_files = [];
    let selected_tests = [];

    for (var node of this.childrens.values()) {
      const node_selected = node.selected_nodes;
      selected_suites = selected_suites.concat(node_selected.suites);
      selected_files = selected_files.concat(node_selected.files);
      selected_tests = selected_tests.concat(node_selected.tests);
    }

    const selected = {
      suites: selected_suites,
      files: selected_files,
      tests: selected_tests,
    };
    return selected;
  }
}

export class TestDirectoryNode extends BaseNode {
  type = "directory";
  @observable name;
  @observable id;
  @observable id_path;
  @observable childrens = observable.map();

  constructor(name, id, id_path, file_path, parent) {
    super();
    this.name = name;
    this.id = id;
    this.id_path = id_path;
    this.file_path = file_path;
    this.parent = parent;
  }

  @computed get selected_nodes() {
    if (this.selected === "true") {
      return { suites: [], files: [this.file_path], tests: [] };
    }

    let selected_suites = [];
    let selected_files = [];
    let selected_tests = [];

    for (var node of this.childrens.values()) {
      const node_selected = node.selected_nodes;
      selected_suites = selected_suites.concat(node_selected.suites);
      selected_files = selected_files.concat(node_selected.files);
      selected_tests = selected_tests.concat(node_selected.tests);
    }

    const selected = {
      suites: selected_suites,
      files: selected_files,
      tests: selected_tests,
    };
    return selected;
  }
}

export class TestSuiteNode extends BaseNode {
  type = "suite";
  @observable name;
  @observable id;
  @observable id_path;
  @observable childrens = observable.map();

  constructor(name, id, id_path, parent) {
    super();
    this.name = name;
    this.id = id;
    this.id_path = id_path;
    this.parent = parent;
  }

  @computed get selected_nodes() {
    if (this.selected === "true") {
      return { suites: [this.id], files: [], tests: [] };
    }

    let selected_suites = [];
    let selected_files = [];
    let selected_tests = [];

    for (var node of this.childrens.values()) {
      const node_selected = node.selected_nodes;
      selected_suites = selected_suites.concat(node_selected.suites);
      selected_files = selected_files.concat(node_selected.files);
      selected_tests = selected_tests.concat(node_selected.tests);
    }

    const selected = {
      suites: selected_suites,
      files: selected_files,
      tests: selected_tests,
    };
    return selected;
  }
}

export class AllSuites extends BaseNode {
  type = "all_suites";
  @observable suites = observable.map();
  id = "root";
  name = "All suites";
  @observable childrens = observable.map();
  @observable childrens_by_id = observable.map();

  @action process_single_msg(msg) {
    switch (msg._type) {
      case "test_result":
        return this.add_full_qualified_leaf(
          msg.suite_name,
          msg.test_name,
          msg.id,
          msg.file,
          msg.outcome,
          msg.duration,
          msg
        );
      case "test_collection":
        return this.add_full_qualified_leaf(
          msg.suite_name,
          msg.test_name,
          msg.id,
          msg.file,
          "collected",
          0,
          msg
        );
      default:
        break;
    }
  }

  @action add_full_qualified_leaf(
    suite_name,
    test_name,
    test_id,
    test_file_path,
    test_status,
    test_duration,
    raw_test_result
  ) {
    if (this.childrens_by_id.has(test_id)) {
      const leaf = this.childrens_by_id.get(test_id);
      leaf.update(test_status, test_duration, raw_test_result);
      // TODO: Test me
      return ["updated", leaf];
    }

    // Split the file path
    const splitted = test_file_path.split("/");
    const full_path = [suite_name].concat(splitted).concat([test_id]);

    var node = this;

    for (let index = 0; index < full_path.length - 1; index++) {
      let path_part = full_path[index];
      let subpath = full_path.slice(0, index + 1);

      let children_id = subpath.join("/");
      var children = node.get_children(children_id);

      let directory_file_path = splitted.slice(0, index);

      if (children === undefined) {
        if (index === 0) {
          children = new TestSuiteNode(path_part, children_id, subpath, node);
        } else if (index === full_path.length - 2) {
          children = new TestFileNode(path_part, children_id, subpath, test_file_path, node);
        } else {
          children = new TestDirectoryNode(
            path_part,
            children_id,
            subpath,
            directory_file_path.join("/"),
            node
          );
        }
        this.childrens_by_id.set(children_id, children);
        node.add_children(children);
      }
      node = children;
    }

    let leaf = new SingleTestLeaf(
      test_name,
      test_id,
      full_path,
      test_status,
      test_duration,
      node,
      raw_test_result
    );
    node.add_children(leaf);
    this.childrens_by_id.set(test_id, leaf);

    return ["added", leaf];
  }

  get_children(children_id) {
    return this.childrens.get(children_id);
  }

  get_children_by_full_id(children_id) {
    if (children_id === this.id) {
      return this;
    }
    return this.childrens_by_id.get(children_id);
  }

  @computed get selected_nodes() {
    if (this.selected === "true") {
      let selected = {};
      for (var node of this.childrens.values()) {
        selected[node.name] = { full: true };
      }
      return selected;
    }

    let selected = {};

    for (var node of this.childrens.values()) {
      const node_selected = node.selected_nodes;

      if (
        !(
          node_selected.suites.length > 0 ||
          node_selected.files.length > 0 ||
          node_selected.tests.length > 0
        )
      ) {
        continue;
      }

      if (node_selected.suites.length > 0) {
        selected[node.name] = { full: true };
      } else {
        selected[node.name] = {
          files: node_selected.files,
          nodeids: node_selected.tests,
        };
      }
    }

    return selected;
  }
}

export class Run {
  @observable status = "starting";
  @observable done = 0;
  @observable test_number;
  @observable total_duration;
  @observable return_code;
  @observable return_message;
  @observable total_passed;
  @observable total_failed;
  @observable total_error;
  @observable total_skipped;

  constructor(uuid) {
    this.uuid = uuid;
    this.date_started = new Date();
  }

  @action session_start(test_number) {
    this.status = "running";
    this.test_number = test_number;
  }

  @action test_result(test_id) {
    // TODO: Store test ids?
    this.done += 1;
  }

  @action session_end(total_duration, passed, failed, error, skipped) {
    this.total_duration = total_duration;

    this.total_passed = passed;
    this.total_failed = failed;
    this.total_error = error;
    this.total_skipped = skipped;
  }

  @action run_stop(return_code, return_message) {
    this.status = "finished";
    this.return_code = return_code;
    this.return_message = return_message;
  }
}

export class AllRuns {
  @observable runs = observable.map();

  @action process_single_msg(msg) {
    const run_id = msg.run_id;

    switch (msg._type) {
      case "run_start":
        this.runs.set(run_id, new Run(run_id));
        break;
      case "session_start":
        this.runs.get(run_id).session_start(msg.test_number);
        break;
      case "test_collection":
        this.runs.get(run_id).test_result(msg.id);
        break;
      case "test_result":
        this.runs.get(run_id).test_result(msg.id);
        break;
      case "session_end":
        this.runs
          .get(run_id)
          .session_end(
            msg.total_duration,
            msg.passed,
            msg.failed,
            msg.error,
            msg.skipped
          );
        break;
      case "run_stop":
        this.runs.get(run_id).run_stop(msg.return_code, msg.return_message);
        break;
      default:
        // Ignore other messages
        break;
    }
  }
}

export class Store {
  @observable suites = new AllSuites();
  @observable runs = new AllRuns();
  @observable selected_node = undefined;
  @observable query_text = undefined;

  constructor() {
    this.index = FlexSearch.create({
      tokenize: "full",
    });
  }

  @action process_single_msg(msg) {
    this.runs.process_single_msg(msg);
    const result = this.suites.process_single_msg(msg);
    if (result) {
      let [added_or_updated, leaf] = result;
      switch (added_or_updated) {
        case "added":
          this.index.add(leaf.id, leaf.name);
          break;

        case "updated":
          this.index.update(leaf.id, leaf.name);
          break;
        default:
          break;
      }
    }
  }

  @action select_node(node) {
    this.selected_node = node;
  }

  @action set_query_text(query_text) {
    if (query_text === "") {
      this.suites.visible = true;
    } else {
      const matches = this.index.search(query_text);
      // Make all leaf disappears
      this.suites.visible = false;
      for (let match of matches) {
        let leaf = this.suites.get_children_by_full_id(match);
        leaf.visible = true;
      }
    }
    this.query_text = query_text;
  }
}

const STORE = new Store();
export default STORE;

export function* treeWalker(refresh) {
  const stack = [];

  // Remember all the necessary data of the first node in the stack.
  stack.push({
    nestingLevel: 0,
    node: STORE.suites,
  });

  // Walk through the tree until we have no nodes available.
  while (stack.length !== 0) {
    const { node, nestingLevel } = stack.pop();

    // We need to send string id to react-vtree
    const id = node.id.toString();

    let children = (node.get_childrens && node.get_childrens()) || [];

    // Here we are sending the information about the node to the Tree component
    // and receive an information about the openness state from it. The
    // `refresh` parameter tells us if the full update of the tree is requested;
    // basing on it we decide to return the full node data or only the node
    // id to update the nodes order.
    let item = null;
    if (refresh) {
      item = {
        id: id,
        isLeaf: children.length === 0,
        isOpenByDefault: true,
        nestingLevel,
        selected: children.selected,
      };
    } else {
      item = id;
    }
    const isOpened = yield item;

    // Basing on the node openness state we are deciding if we need to render
    // the child nodes (if they exist).
    if (children.length !== 0 && isOpened) {
      // Since it is a stack structure, we need to put nodes we want to render
      // first to the end of the stack.
      for (let i = children.length - 1; i >= 0; i--) {
        if (children[i][1].visible) {
          stack.push({
            nestingLevel: nestingLevel + 1,
            node: children[i][1],
          });
        }
      }
    }
  }
}

export function deselect_selected_by_parent(
  suites: AllSuites,
  test_path: Array<String>
) {
  // Get all nodes for the test_id
  var node = suites.get_children_by_full_id(test_path);

  const nodes = [];

  while (node.parent) {
    nodes.push(node);

    if (node.selected === "true") {
      break;
    }

    node = node.parent;
  }

  // Expand selection on all the nodes
  nodes.reverse();

  for (const node of nodes) {
    node.deselected_and_select_childrens();
  }

  // The deselect the last node to ensure all childrens are correctly
  // deselected
  nodes[nodes.length - 1].deselect();
}

export function select_failed() {
  STORE.suites.select_if_status("failed");
}

export function select_skipped() {
  STORE.suites.select_if_status("skipped");
}

export function select_passed() {
  STORE.suites.select_if_status("passed");
}
