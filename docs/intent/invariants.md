# Invariants

| Rule | Enforcement |
|---|---|
| Evaluation uses official CUE Go API, pinned in go.mod/go.sum | code: internal/core/engine.go; semantic coverage expanding |
| Worker readiness means selected advertised capability is ready | test/unit/worker_logic.js; test/browser/runtime.mjs |
| At most one worker call active; finite pending/input/deadline limits | worker-manager.js and deterministic unit tests |
| Active cancellation terminates owner and settles pending work | unit and browser lifecycle checks |
| Disposed owner publishes no late responses | unit lifecycle checks |
| Explicit entries are supplied virtual files; imports never use ambient registries | native virtual boundary tests and native/WASM corpus |
| Late helper results never replace edited/recreated Workspace drafts | test/unit/workspace_logic.mjs and installed browser fixture |
| Generated JS/types derive from internal sources | scripts/generate-js.mjs --check |
| Published archive must contain default engine/reader/shim and upstream notices | test/package/smoke.mjs positive and missing-asset negative checks |
| React/Fathom/app-kit/providers are not core runtime dependencies | package manifest; installed Node smoke without React |
| No source text, credentials or private corpus in routine telemetry | stated; security audit remains required |
| Every new performance/support claim names its evidence and limits | stated; tracker/review gate |
| Preserve unrelated dirty work and do not silently rebaseline security-sensitive wiring | stated; autonomy and Fathom receipts |
