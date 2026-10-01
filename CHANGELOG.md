# Changelog

## [Unreleased]
Release impact: breaking worker lifecycle/return-contract correction; no release published.

### Breaking
- Virtual file/entry paths are bounded and validated; alias collisions, unsupplied
  entries and remote module resolution are refused ([ADR-0003](docs/adr/0003-offline-virtual-workspaces.md)).
- Workspace helpers reject missing files and stale draft results instead of returning
  an empty result or overwriting current edits.
- Worker initialization now resolves the selected engine or syntax-only reader;
  implicit reader-first/background-engine loading is removed.
- Worker getSymbols returns the same JSON string as direct API; Workspace parses it.
- Worker requests have finite input/queue/deadline limits; active cancellation
  terminates the owner and rejects queued work. Retry requires a fresh owner.

### Fixed
- Symbol-free and empty valid drafts return `[]` from getSymbols, matching its public contract.
- Packages and release assets carry hashed notices for the pinned Go/CUE dependency graph.
- Docker examples build current source assets; bounded smoke tests verify semantics and HTTP delivery.
- Public `/tools` declaration now resolves Workspace; CueWorkerError declares its actual
  `(code, message)` constructor. Real installed TypeScript checks retain negative cases.
- Browser module-local imports use a reserved virtual mount without host filesystem access.
- Direct loader waits for actual bridge readiness; diagnostics retain upstream causes.
- Package includes default engine, reader and matching loader asset paths.
- Worker failures and disposal settle pending promises; initialization can be retried.
- Generated JavaScript/types have an explicit source and drift-check entry point.

### Added
- Independent CUE configuration studio with worker ownership, revision-safe preview/export,
  bounded schema and packaged static delivery; native/WASM and browser evidence recorded.
- Deterministic lifecycle tests, independent archive smoke and actual browser fixture.
- Canonical intent/ADRs and current evidence-based hardening roadmap.
