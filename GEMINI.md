# GEMINI Context File

## Project Overview
**cue-wasm** is a Go-based WebAssembly (WASM) runtime for [Cuelang](https://cuelang.org/). It wraps the official CUE Go API to expose core functionality (Validate, Unify, Export) to JavaScript environments (Node.js and Browser) without requiring a backend.

## Architecture
- **Language**: Go (compiled to WASM) and JavaScript (wrapper).
- **Core**: `internal/core/service.go` implements the `CueService` logic.
- **WASM Bridge**: `main.go` uses `syscall/js` to expose `CueWasm` global object.
- **Build**: `build.sh` compiles `main.go` -> `bin/cue.wasm` and copies `wasm_exec.js`.

## Key Directories
- `internal/core`: Go logic for CUE operations.
- `pkg`: (Currently unused, reserved for Go library exports if needed).
- `dist`: TypeScript definitions (`index.d.ts`) and main JS entry point (`index.js`).
- `examples`: Usage examples for Node.js and Browser.
- `test`: Integration and security tests.

## Development Workflow
1.  **Build**: `./build.sh` (Requires Go 1.24+)
2.  **Test**: `npm test` (Runs all suites: Integration, Security, Examples, Edge)
3.  **Lint/Format**: Standard Go tools (`go fmt ./...`).

## Key Dependencies
- **Go**: `cuelang.org/go` (Pinned in `go.mod`)
- **NPM**: None (Zero-dependency runtime). `engines` set to Node >= 18.

## Security
- **Isolation**: Runs in WASM sandbox.
- **Policy**: See `SECURITY.md`.
- **Tests**: `test/security/test_lfi.js` ensures no host filesystem access.
