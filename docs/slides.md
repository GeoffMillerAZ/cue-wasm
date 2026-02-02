# cue-wasm

Run Cuelang in the Browser & Node.js

---

## What is it?

A lightweight wrapper around CUE's Go API, compiled to WebAssembly.

- **Validate**: Check JSON/YAML against CUE schemas.
- **Unify**: Merge configurations.
- **Export**: Convert CUE to JSON/YAML.

---

## Why?

- **No Backend Required**: Run validation client-side.
- **Fast**: WebAssembly performance.
- **Secure**: Sandboxed execution.

---

## Usage (Node.js)

```javascript
const { loadWasm } = require('cue-wasm');
const cue = await loadWasm();

const isValid = await cue.validate("a: int", "a: 1");
console.log(isValid); // true
```

---

## Usage (Browser)

```html
<script src="wasm_exec.js"></script>
<script>
  // See examples/browser for full code
  CueWasm.validate("a: int", "a: 1").then(console.log);
</script>
```

---

## Demo

Check out the `examples/` directory!
