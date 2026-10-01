# Offline virtual workspace verification — 2026-09-30

Baseline f703f9afcb10a03cda5388ee59def4c518f844c5 plus retained source archive.
Go1.24.4, CUE0.15.4, Node26.3, macOS arm64. Local dirty branch; no release/push.

- native-tests.txt: supplied entry/path/alias checks, actual host-file sentinel
  refusal, local module+builtin success, registry request counter stays zero,
  virtual diagnostic anchor and existing semantic behavior.
- semantic.txt: 19 independently specified results agree in native and rebuilt WASM.
  This includes local modules, missing entries, traversal, aliases and offline imports.
  Not exhaustive CUE conformance or exact diagnostic equivalence.
- tests.txt: package suite, worker ownership, React hook harness, generator drift,
  draft races, shim boundary, direct readiness, examples and negative archive checks.
- fuzz.txt: five seconds, two workers, 54,127 path normalizations without failure.
  This is a bounded run, not proof against all malformed/hostile inputs.
- browser-installed.json: actual Chrome154/macOS, 3033x925, 11 groups passed from the
  npm archive. Local imports update/remove, stale formatting refuses, lifecycle
  recovers and every worker owner is disposed. No resource/other-browser claim.
- installed-package.tgz: exact browser-tested archive identified in the receipt.
- build-manifest.json records actual WASM assets/toolchain/source hashes.
- vet.txt: matching js/wasm/netgo/osusergo target.

Reproduce with npm run build:wasm; npm test; npm run test:native;
npm run test:semantic; node test/browser/serve.mjs --installed, then Run worker checks.
Fuzz: GOTOOLCHAIN=go1.24.4 go test ./internal/core -run '^$'
-fuzz FuzzNormalizeVirtualPath -fuzztime=5s -parallel=2 (one shell command).

Failure retained as a regression: local module evaluation originally returned
"import failed" in WASM despite native success. Upstream detail exposed the shim's
unsupported O_DIRECTORY, then ENOSYS on backing directories. The adapter in
internal/js/runtime-environment.js runs before Go initializes, reserves only the
virtual mount, and does not modify the upstream shim or expose Node filesystem.
Node eval scripts with ambient fs masked the defect; use the ordinary file-based
semantic runner and actual installed browser for verification.

Native overlays still consult the OS; this is not a privileged native sandbox.
Useful authoring consumer, actual React/TypeScript, resource distributions and
clean independent checkout remain open. Older packets are historical evidence.
