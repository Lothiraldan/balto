export function collectAllApi() {
    fetch("http://localhost:8889/collect_all/", {
        method: 'Post', headers: {
            'Content-Type': 'application/json'
        }
    }).then(data => console.log(JSON.stringify(data))) // JSON-string from `response.json()` call
        .catch(error => console.error(error));
}

export function runAllApi() {
    fetch("http://localhost:8889/run_all/", {
        method: 'Post', headers: {
            'Content-Type': 'application/json'
        }
    }).then(data => console.log(JSON.stringify(data))) // JSON-string from `response.json()` call
        .catch(error => console.error(error));
}

export function runSelectedApi(selected_tests) {
    fetch("http://localhost:8889/run_selected/", {
        method: 'Post', headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tests: selected_tests }),
    }).then(data => console.log(JSON.stringify(data))) // JSON-string from `response.json()` call
        .catch(error => console.error(error));
}

export function editTest(suite, selected_test) {
    console.log("Edit", suite, selected_test);
    fetch("http://localhost:8889/edit_test/", {
        method: 'Post', headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ suite: suite, test_id: selected_test }),
    }).then(data => console.log(JSON.stringify(data))) // JSON-string from `response.json()` call
        .catch(error => console.error(error));
}