# Roadmap: Cue-WASM Ecosystem

**Current Version:** v1.0.0 (WASM Library)

## Vision
To build the universal "Cuelang Engine" that allows any environment (Browser, Server, CLI) to leverage Cuelang's powerful configuration unification and validation capabilities without invoking the heavy `cue` CLI binary.

## Future Phases

### Phase 2: Server-Side & Microservices
*   **Goal:** Enable non-Go applications (Python, Node, Ruby) to use Cuelang logic via network or IPC.
*   **Deliverable:** `cmd/cue-server`
*   **Architecture:**
    *   Simple HTTP/gRPC server wrapping `internal/core`.
    *   Endpoints: `POST /unify`, `POST /validate`, `POST /export`.
*   **Use Cases:**
    *   **Sidecar Pattern:** Running alongside a legacy app to handle config validation.
    *   **CI/CD Gate:** A centralized service to validate PR configs.

### Phase 3: CLI Utility (`qub`)
*   **Goal:** A lightweight, single-binary alternative to `cue` for specific embedded tasks.
*   **Deliverable:** `cmd/qub`
*   **Features:**
    *   Focused strictly on data manipulation (JSON -> Cue -> JSON).
    *   Zero dependencies (static binary).

### Phase 4: Wasi Interface (Server-Side WASM)
*   **Goal:** Run the existing WASM binary outside the browser using `wasmtime` or `wazero`.
*   **Architecture:** Adapt the `main.go` to support WASI (WebAssembly System Interface) standard I/O instead of `syscall/js`.
*   **Value:** Safe execution of untrusted Cuelang code in a sandboxed environment (Plugin Systems).

### Phase 5: Advanced Tooling
*   **LSP (Language Server):** Expose an LSP implementation over WASM for web IDEs (Monaco/CodeMirror).
*   **Formatter:** Expose `cue fmt` logic to auto-format text in textareas.

## Community Integration
*   **NPM Registry:** Publish `@pac/cue-wasm`.
*   **Docker Hub:** Publish `pac/cue-server` image.
