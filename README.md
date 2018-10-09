# ![Logo of Balto](logo-100x.png) BALTO

`BAlto is a Language independent Test Orchestrator` is a test orchestrator
compatible with all your testing frameworks and your languages.

# Installation

- Download the latest binary for you platform here: https://github.com/Lothiraldan/balto/releases
- Put the binary in your path
- Enjoy!

# Usage

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
