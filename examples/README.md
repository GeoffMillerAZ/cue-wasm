# Cue-WASM Examples

This directory contains examples demonstrating how to use `cue-wasm` in different environments.

## Node.js Examples

These examples show how to use the library in a Node.js environment (backend, scripting, CLI tools).

Prerequisites:
- Built project (`../../build.sh`)
- Node.js installed

Run them directly:

```bash
node examples/node/01_validate.cjs
node examples/node/02_unify.cjs
node examples/node/03_tags.cjs
node examples/node/04_export.cjs
node examples/node/05_workspace.cjs
```

### Files:
- `01_validate.cjs`: Basic schema validation with structured error handling.
- `02_unify.cjs`: Merging multiple CUE files/strings into a configuration.
- `03_tags.cjs`: Using `@tag` to inject environment variables.
- `04_export.cjs`: Converting CUE to JSON, YAML, or formatted CUE.
- `05_workspace.cjs`: **[New]** Using the `Workspace` intelligence layer for multi-file projects, syntax validation, formatting, and symbol extraction.

## Browser Examples

### 1. Pro Playground (`/browser/index.html`)

A comprehensive, Tailwind-powered IDE experience in the browser.

**Features:**
- **Virtual Workspace**: Manage multiple CUE files in memory.
- **Instant Syntax Validation**: As-you-type error reporting using the native Go parser.
- **Auto-Formatting**: Integrated `cue fmt` logic.
- **Symbol Outline**: Recursive AST walking to show package and field navigation.
- **Real-time Unification**: Merge and evaluate the entire workspace into JSON.

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

## Docker (The Easy Way)

Don't want to install Go or Node.js? Run everything in Docker!

### 1. Build the Image
```bash
docker build -f examples/Dockerfile -t cue-wasm-demo .
```

### 2. Run Node.js Examples
```bash
docker run --rm cue-wasm-demo node
```

### 3. Run Browser Playground
```bash
docker run --rm -p 8080:8080 cue-wasm-demo serve
```
Then open [http://localhost:8080/examples/browser/index.html](http://localhost:8080/examples/browser/index.html).