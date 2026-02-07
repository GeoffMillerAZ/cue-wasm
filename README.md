# @geoff4lf/cue-wasm

[![NPM Version](https://img.shields.io/npm/v/@geoff4lf/cue-wasm)](https://www.npmjs.com/package/@geoff4lf/cue-wasm)
[![CI Status](https://github.com/geoff4lf/cue-wasm/actions/workflows/test.yml/badge.svg)](https://github.com/geoff4lf/cue-wasm/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Cuelang for the Modern Web.** A "Gold Standard" WebAssembly runtime and tooling layer for [Cuelang](https://cuelang.org/), designed for zero-config integration in Next.js, Browsers, and Node.js.

---

## 🚀 Key Features

- **Full CUE Engine**: Authority-level Unification, Validation, and Export powered by the official Go CUE API.
- **Phased Loading**: Lightweight Reader (**5.2MB**) for instant interactivity, warming up the full Engine (**27.1MB**) in the background.
- **Zero-Config CDN**: Browser builds automatically fetch the WASM binary from jsDelivr—no manual file copying required.
- **Interactive Tooling**: JS-native `Workspace` manager for multi-file projects, AST symbol extraction, and auto-formatting.
- **Next.js & React Ready**: Built-in `useCue` hook with high-performance Web Worker and IndexedDB caching support.
- **Security Hardened**: Strict WASM sandbox isolation with verified LFI protection.

## 📦 Installation

```bash
npm install @geoff4lf/cue-wasm
```

## 🎮 Performance Playground (Mission Control)

Test the phased loading architecture and caching performance in our Dockerized playground:

```bash
./examples/performance/run.sh
```
Then visit [http://localhost:9876/examples/performance/](http://localhost:9876/examples/performance/)

## 🛠 Usage

### 1. In React / Next.js (Recommended)

```tsx
import { CueProvider, useCue } from '@geoff4lf/cue-wasm/react';

function App() {
  return (
    // useWorker enables phased loading, web workers, and indexedDB caching
    <CueProvider useWorker={true}>
      <Validator />
    </CueProvider>
  );
}
```

### 2. In Node.js / Plain JS

```javascript
import { loadWasm, Workspace } from '@geoff4lf/cue-wasm';

async function run() {
  const cue = await loadWasm();
  const ws = new Workspace();

  ws.addFile('schema.cue', 'package main\n#User: { name: string }');
  ws.addFile('data.cue', 'package main\nuser: #User & { name: "Geoff" }', true);

  const res = await cue.unify(ws.getOverlay(), ws.getEntryPoints());
  console.log(JSON.parse(res));
}
```

## 📐 Architecture & Performance

To prevent accidental "bloat" in your JS bundles and achieve near-instant TTI, this library is split into two distinct layers:

1.  **WASM Reader (~5.2MB raw / <1MB compressed)**: The lightweight syntax and formatting engine.
2.  **WASM Engine (~27.1MB raw / ~6MB compressed)**: The authoritative evaluator.

> For detailed optimization strategies (HTTP Preloading, Compression), see the [Performance Guide](./docs/performance_guide.md).

## 🧪 Documentation & Examples

- **[Examples Inventory](./examples)**: Comprehensive Node, Browser, and Docker demos.
- **[API Reference](./docs/specs/001-api-surface.md)**: Full method signatures and types.
- **[Maintainer Guide](./docs/maintainer_guide.md)**: Contribution and build instructions.

## 🛡 Security

This project adheres to strict security standards. The WASM runtime is isolated from the host filesystem. For more details, see [SECURITY.md](./SECURITY.md).

## 📄 License

MIT © [Geoff Miller](https://github.com/GeoffMillerAZ)