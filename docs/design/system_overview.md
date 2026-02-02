# Cue-WASM: Design Overview

## Mission
To provide a rock-solid, reusable Go library that exposes Cuelang's core capabilities (Load, Unify, Validate, Export) to a WebAssembly environment, usable by JavaScript clients.

## Architecture
We follow a simplified Hexagonal Architecture to ensure the Core Logic is testable in pure Go, while the WASM Adapter handles the `syscall/js` complexity.

### 1. The Core (`internal/core`)
*   **Domain:** Pure Go functions wrapping `cuelang.org/go`.
*   **No WASM imports here.** This ensures we can unit test the logic on the host OS without a browser.

### 2. The Adapter (`internal/adapter`)
*   **WASM Bridge:** The code that imports `syscall/js`.
*   **Mapping:** Converts JS types (String, Object) -> Go types -> Core Calls -> JS types.

## Architectural Diagram

```mermaid
graph TD
    subgraph Browser [Browser Environment]
        JS[JavaScript App]
        WASM[WebAssembly Runtime]
    end

    subgraph GoWASM [Go WASM Binary]
        Bridge[WASM Bridge (syscall/js)]
        Core[Core Logic (Pure Go)]
        Cue[Cuelang SDK]
    end

    JS -- "Call Unify()" --> Bridge
    Bridge -- "[]string" --> Core
    Core -- "Compile & Unify" --> Cue
    Cue -- "Cue Value" --> Core
    Core -- "JSON String" --> Bridge
    Bridge -- "Promise Resolve" --> JS
```

## API Surface (The Spec)
See `docs/specs/001-api-surface.md`.

## Maintenance Strategy
*   **Dependency Isolation:** The `go.mod` should isolate `cuelang.org/go` versions.
*   **Test Suite:**
    *   **Unit:** Go tests for Core.
    *   **Integration:** Go tests simulating JS calls (if possible) or generic heavy unification tests.
