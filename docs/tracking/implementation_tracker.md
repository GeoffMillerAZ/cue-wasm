# cue-wasm execution and acceptance

Owner-authorized uplift, 2026-09-30. [Intent](../intent/README.md),
[roadmap](../roadmap.md), [acceptance](../design/runtime-hardening.md).
Baseline f703f9afcb10a03cda5388ee59def4c518f844c5; branch
feat/authoring-runtime-hardening-20260930. Pre-existing agent/Fathom edits preserved;
fleet-managed reconciliation has reversible receipt 01439419d159. No publish/push.
Historical extraction/checklist claims remain in Git history, not current acceptance.

## Current outcomes

| Need | Implementation and verified behavior | Remaining acceptance |
|---|---|---|
| Package closure | Required engine/reader/shim/manifest shipped; independent npm archive evaluates without React/network; missing-engine archive is refused; hashes checked | Clean-checkout and target-version matrix |
| Worker ownership | One active request, finite queue/input/deadlines; cancellation, disposal, failure, immutable queued inputs; engine or explicit reader | Sustained resource/host qualification |
| Semantic fidelity | Pinned Go1.24.4/CUE0.15.4; independent schema/data with scoped definitions; validated virtual paths, offline registry; temporary Go executor callbacks released | Supplied local modules and bounded paths pass; broader security qualification and CUE0.16.1 consumer compatibility |
| Determinism | Generated JS/types idempotence + deliberate drift negative; two consecutive WASM builds have identical manifests | Reproduction from a clean independent checkout/CI |
| Native/WASM | 19 shared fixed-outcome cases: precision, defaults, closedness, conflicts, incomplete data, scalar/list constraints, binding isolation, tags, builtin entry selection, virtual identity, offline dependencies and local modules | Not exhaustive CUE conformance or diagnostic equivalence |
| Browser | Chrome154/macOS source and installed npm archive: 11 lifecycle/boundary groups pass, including restart after abort/fetch failure and three repeated mounts | Other browsers and resource qualification; no memory claim |
| React | React19.2/StrictMode actual12 groups pass on final installed archive under nested hosting;20 workers terminated/0live; TS5.9 strict positive and12 negative cases; tools/error declarations fixed | Other React/browser versions and resource qualification; current-source/archive drift guard now required |
| Project governance | Vision/intent/ADRs, migration, roadmap, generated/intent checks, CI and local pre-push updated | Remote CI not run; no production promotion |
| Fathom | Repo-only doctors each 10 pass/0 fail/1 skipped; index refresh succeeds; synthetic pre-hook emits guard; source plan present | Fresh host loading unproven; compiled obligations incomplete; no paid compilation |
| Efficient delivery | Only chosen runtime loaded; frozen local serial screen passes20 lifetimes; engine init p95214ms and first call73.1ms, reader95.5/13.5ms; engine gzip6,895,797B | Retained caches/loopback only; cold network, constrained host and total memory unavailable; no chunking claim |
| Authoring adoption | Independent static configuration studio uses npm archive; official CUE defaults/limits, revision-safe preview/export, keyboard format/evaluate; 11 ownership tests, 10 native/WASM schema cases and Chrome flow | Resource workload, broader accessibility/browser qualification and app-kit-specific schema adoption |

## Evidence and commands

Packet: ../assessments/fixtures/runtime-hardening-2026-09-30.
Final tests: final-tests.txt (12 worker, 13 React harness, generator drift plus existing
integration/example/edge/package checks). final-semantics.txt: 14 passed.
Build provenance: build-manifest-final.json; final-build.txt/final-rebuild.txt, cmp passed.
Assets: assets-final.json. Installed Node package receipt: test/package/receipt.json.
Browser harness: test/browser/runtime.mjs; installed server uses npm archive assets only.
Native tests and matching-target vet passed; JS-only main has explicit js/wasm constraint.

```sh
npm ci
npm run build:wasm
npm run test:native
npm test
npm run test:semantic
npm run check:generated
npm run check:intent
node test/browser/serve.mjs --installed
```

Installed browser mode writes test/browser/installed-receipt.json, verifies asset
hashes and cleans its owned temporary package when stopped via SIGTERM/SIGINT.
Go/CUE/package versions remain distinct; binary version is not language compatibility.
Node26.3 locally tested. CI18/20/22 configured, not executed locally or remotely here.

## Size interpretation

Final engine: 31,701,719 raw bytes; gzip9 6,892,905; Brotli5 5,778,705.
Reader: 5,875,788 raw; gzip9 1,643,419; Brotli5 1,422,263. Shim separate.
The old binary lacked build provenance and was smaller raw; compression is nearly
unchanged. Selecting one capability removes unused-runtime transfer/initialization;
this does not prove startup/memory improvement. The ~15.4MB npm archive retains a
legacy engine copy for compatibility and is not the browser transfer workload.

## Resume checkpoint

Virtual-workspace follow-up passes native tests, 19 native/WASM cases, the npm suite,
five-second path fuzzing and 11 installed-package Chrome groups. Packet:
../assessments/fixtures/virtual-workspace-2026-09-30 (ADR-0003). Earlier size measurements
above describe the prior packet; do not substitute them for the new manifest.
The follow-up fixes the browser shim/local-import boundary and late draft overwrites.
Direct loader now waits for actual bridge readiness. Browser-installed.json retains the result.
Earlier runtime server stopped and scratch cleaned. Independent authoring now has an installed Chrome proof; see
[authoring example](../design/authoring-example.md) and packet
../assessments/fixtures/authoring-2026-09-30. Real React/TypeScript adoption now passes at the stated version; see test/react-consumer/evidence.
Next: broader security/resource qualification and clean-source build proof. Keep the official Go engine;
no Rust CUE rewrite is admitted. No provider credentials, global config, daemon restart
or remote publication was performed. Original app-kit work remains active; ARCH129/130
record its checkpoint, diagrams remain the main visual priority after this prerequisite.
