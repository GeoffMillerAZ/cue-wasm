# cue-wasm landing verification — 2026-10-01

Baseline: 4559205 plus the reviewed landing corrections. Current manifest pins
Go1.24.4/CUE0.15.4; Node26.3/macOS27 used for local gates. Clean independent clone9af3ce9 rebuilt identical manifest/assets and passed all ten
gates in `clean-checkout/result.json`; warm pinned toolchain/module/npm caches.
Only expected `test/package/receipt.json` changed after tests, no source drift.

- Native, Node/worker/integration/security/examples/archive tests pass.
- 23 fixed native/WASM cases include empty/symbol-free/valid/invalid symbol extraction.
- Authoring: 11 ownership tests and 10 real native/WASM schema cases pass.
- Generated and intent gates pass; installed package rejects missing engine and notices.
- Frozen React archive c35dbfcc passes strict types, four archive/build/HTTP/drift tests,
  and actual Chrome154/React19.2 StrictMode twelve-group browser run under `/nested/`.
  Twenty workers created/terminated; zero live. Downloaded actual receipt retained.
- Docker source build (Linux/arm64, Go1.24.4/Node26.3.0 image tags; resolved digests not retained) passes Node
  semantic assertions and actual HTTP JS/WASM/notice hash/MIME checks. Temporary
  containers and final test image removed; pre-existing stopped Colima state restored.
- All 56 original historical SHA256SUMS entries match relative to their packet roots.
  A reviewer initially resolved README paths against the wrong directory; there was
  no historical corruption and no checksum rebaseline. Seven globally ignored logs
  are explicitly admitted to Git so clean checkouts retain the complete packets.
- Original archives retain exact bytes. Companion attribution supplies pinned upstream
  notices for historical binary archives; new packages ship their notices internally.

`react-before-refresh/` retains prior generated/type/browser receipts. It is historical,
not proof of the current package. No npm release/tag, provider call, paid compilation,
new global configuration or target-browser/resource promotion follows this landing.
The installed-package test needed its existing fixture-local npm cache for offline
installation; missing entries in the default cache were not an application defect.

## Reproduction

From a clean checkout of9af3ce9 (or a later documentation-only descendant), install
Go1.24.4 and Node26.3.0, then run `npm ci`, `go mod download`, `npm run build:wasm`,
`npm run test:native`, `npm test`, `npm run test:semantic`, `npm run test:authoring`,
`npm ci --prefix test/react-consumer --ignore-scripts`,
`npm test --prefix test/react-consumer`,
`node test/react-consumer/scripts/check-current.mjs .`,
`npm run check:generated`, and `npm run check:intent`.
The build selects Go1.24.4 explicitly. Module/registry downloads are needed when
caches are empty; ordinary prepared-package consumers require no Go installation.
Run `npm run test:docker` with a working Docker engine for the independent Linux
example. For actual browser proof run the fixture server described in
`test/react-consumer/README.md`, click Run verification, and retain a fresh receipt.
Do not substitute the retained browser JSON for executing a changed package.
