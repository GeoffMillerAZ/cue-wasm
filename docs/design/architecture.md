# CUE-WASM Architecture & Contract

This document defines the strict boundaries and integration contract between the Go-based WASM engine and the JavaScript tooling layer.

## 1. The Core Philosophy: "Authority vs. Intelligence"

To maintain high performance and small bundle sizes, we split responsibilities:

| Layer | Component | Language | Role | Authority |
| :--- | :--- | :--- | :--- | :--- |
| **Engine** | `cue.wasm` | Go | Semantic Truth | Single source of truth for Unification, Validation, and Export. |
| **Tooling** | `Workspace` | JavaScript | Orchestration | Handles virtual file paths, AST navigation, and IDE integration. |
| **React** | `useCue` | JavaScript | Lifecycle | Manages the singleton instance and loading states. |

## 2. Dependency Boundaries

To prevent "bundling accidents" (e.g., accidentally including the 30MB WASM binary in a JS bundle):

1.  **Lazy Loading**: The WASM binary is **never** imported via `require` or `import` in a way that allows bundlers (Webpack/Esbuild) to inline it. It is always fetched as an external asset via `fetch()` (Browser) or `fs.readFile()` (Node).
2.  **Explicit Exports**: The `package.json` uses the `exports` field to strictly separate the JS logic from the WASM asset.
    - `import { Workspace } from '@geoff4lf/cue-wasm'` -> JS Only (~10KB)
    - `import { loadWasm } from '@geoff4lf/cue-wasm'` -> Loader (~2KB)
    - The WASM binary is located at `@geoff4lf/cue-wasm/cue.wasm`.

## 3. The WASM Contract (API Surface)

The Go engine exposes a global `CueWasm` object with the following asynchronous methods:

### `unify(overlay: Record<string, string>, entryPoints?: string[], tags?: string[]): Promise<string>`
- **Inputs**: 
    - `overlay`: A map of absolute virtual paths to CUE content.
    - `entryPoints`: (Optional) List of paths to start the evaluation from.
    - `tags`: (Optional) List of `"key=value"` strings for CUE `@tag` injection.
- **Output**: JSON string of the unified result or a `StructuredError` JSON string.

### `validate(schema: string, data: string): Promise<boolean>`
- **Authority**: Performs concrete validation of data against a schema.

### `parse(code: string): Promise<string>`
- **Authority**: Returns the formatted CUE or throws a syntax error.
- **Constraint**: Fast, non-evaluating check.

### `getSymbols(code: string): Promise<string>`
- **Authority**: Returns a JSON array of AST symbols (package, fields) with line/column positions.

## 4. The Tooling Contract (`Workspace`)

The JS `Workspace` class is the "Glue" that prepares the state for the WASM engine.

- **Normalization**: It must ensure all paths start with `/` before passing to WASM.
- **Entry Point Tracking**: It tracks which files are "roots" vs "dependencies" to optimize the WASM `load.Instances` call.
- **Safety**: It catches basic path errors before the WASM boundary is crossed.
