# ![Logo of Balto](logo-100x.png) BALTO

`BAlto is a Language independent Test Orchestrator` is an unique tool to drive
all your test-runners with one common interface.

## Installation

- Download the latest binary for you platform here: https://github.com/Lothiraldan/balto/releases
- Put the binary somewhere in your path
- Enjoy!

## Usage

To use it, point balto to a directory containing a `.balto.json` file:
    
```bash
balto tests/
```

The `.balto.json` file should look like:

```json
[{"tool": "pytest", "name": "Acceptance Test Suite Subprocess"}]

```

The tool must be one of the supported one, you can see the list here: https://github.com/lothiraldan/litf#compatible-emitters

You can test balto against examples for supported test runners. Clone this repository and launch `balto` against one of the examples directories. For `pytest`, launch:

```bash
balto examples/pytest/
```

For more help:

```bash
balto --help
```


## Development

Balto is composed of two components: the server and the web interface.

### Balto-server

Balto-server is a Python 3.7 project using Asyncio. To build the development version, first create a virtualenv (or equivalent):

```bash
virtualenv .venv
source .venv/bin/activate
```

Install the project in development mode:

```bash
pip install -e .
```

Then start the server:

```bash
balto-server --debug examples/pytest/
```

The server will start on port 8889.

### Web interface

The web interface is a React project communicating with the server using WebSockets. You can start developing on it with these instructions:

```bash
cd balto/web_interfaces/balto_react
yarn start
```

The web interface is then available on http://localhost:3000/ and will connect to the server started before.

Warning: the WebSocket doesn't auto-reconnect yet, sometimes your React modification requires you to reload your browser tab.
