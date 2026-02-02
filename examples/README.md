# Cue-WASM Examples

This directory contains examples demonstrating how to use `cue-wasm` in different environments.

## Node.js Examples

These examples show how to use the library in a Node.js environment (backend, scripting, CLI tools).

Prerequisites:
- Built project (`../../build.sh`)
- Node.js installed

Run them directly:

```bash
node examples/node/01_validate.js
node examples/node/02_unify.js
node examples/node/03_tags.js
node examples/node/04_export.js
```

### Files:
- `01_validate.js`: Basic schema validation with structured error handling.
- `02_unify.js`: Merging multiple CUE files/strings into a configuration.
- `03_tags.js`: Using `@tag` to inject environment variables.
- `04_export.js`: Converting CUE to JSON, YAML, or formatted CUE.

## Browser Example

This example demonstrates a "CUE Playground" running entirely in the browser.

### Running it

Due to browser security restrictions on loading WASM from `file://`, you must serve this directory via a local web server.

From the **project root**:

```bash
# Using Python 3
python3 -m http.server 8080

# OR using npx
npx http-server -p 8080
```

Then open your browser to:
[http://localhost:8080/examples/browser/index.html](http://localhost:8080/examples/browser/index.html)
