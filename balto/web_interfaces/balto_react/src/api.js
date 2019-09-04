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