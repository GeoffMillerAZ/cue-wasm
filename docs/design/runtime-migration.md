# Worker runtime migration (unreleased)

- Await loadWasmWorker for the capability you need. Default is full engine; reader
  mode supports parse/format/getSymbols/version only. Automatic engine warm-up is gone.
- getSymbols returns a JSON string consistently across direct and worker APIs.
  Workspace parses it; other callers use JSON.parse explicitly.
- Default limits: one active request, eight pending including active, 4 MiB input,
  30-second request deadline including queue time. Configurable maxima are 64 pending,
  16 MiB input and 300 seconds. These are admission limits, not a WASM heap quota.
- Pass {signal, timeoutMs} to requests. Cancelling queued work removes that request.
  Cancelling active work rejects all outstanding requests and terminates the owner.
  Create a new owner to retry. dispose() is idempotent.
- Initialization has its own timeout/AbortSignal. Failed owners are not reused.
- Version is callable; package version is not the CUE language version. Prepared
  bin/manifest.json records toolchain, CUE and asset hashes after rebuilding.
- validate compiles schema and data independently, with schema scope available to
  data, then unifies values. This supports scalar/list constraints and prevents
  data-local bindings from rewriting schema-local bindings. Definition references
  remain supported. Test your previously concatenation-dependent inputs.
- Explicitly self-host worker/WASM/shim for controlled deployments. The direct legacy
  browser loader has different global/shim ownership; prefer workers for browser tools.

- Virtual paths are bounded to 1024 UTF-8 bytes including their canonical leading
  slash. Empty/dot/traversal segments, selectors, URLs and backslashes are refused.
  Raw file maps must not contain aliases such as a.cue and /a.cue together.
  Explicit entry points must identify supplied files, not packages/directories.
- Supply module-local imports and cue.mod/module.cue together. Remote dependencies
  are offline regardless of CUE_REGISTRY. See ADR-0003 for the native-host boundary.
- Workspace helpers reject missing files and stale results with code missing or
  stale_result. Preserve the current draft; optionally re-request the operation.
  Use addFile/removeFile rather than mutating its legacy public Maps to track revisions.
- Diagnostic file anchors omit the internal virtual mount prefix; optional details
  retains upstream cause text. Do not log or render source diagnostics as trusted HTML.
- Direct loadWasm now waits for a newly published bridge, failing on early runtime
  exit or a 30-second readiness deadline. It still cannot terminate a Go instance;
  use a worker when hard cancellation/disposal or independent owners are needed.
