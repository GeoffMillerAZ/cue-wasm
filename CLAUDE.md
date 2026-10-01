# cue-wasm contributor guidance

## Project intent

Read docs/intent/README.md before material design or architecture work; load only
its routes. Vision: VISION.md. Decisions: docs/adr/README.md. Honor invariants and
state fired revisit triggers. Use intent-design for material design, intent-decide
for consequential decisions, and intent-doctor for structural verification.

Change records: conventional commits with an honest Verified line, one reviewable
unit per commit; no WIP on main. Update CHANGELOG.md for observable compatibility
changes. docs/intent/scope.md defines the surface; do not publish without authority.

Autonomy: implement and verify scoped reversible work; preserve unrelated edits.
Publication, global configuration, paid inference and private-data transmission need
specific authority. Never bypass controls. Full policy: docs/intent/autonomy.md.

## Working boundaries

Resume from docs/tracking/implementation_tracker.md; acceptance is in
docs/design/runtime-hardening.md. Update evidence and next action there.
Go/CUE owns semantics, internal/js owns JS source; dist is generated. React is optional.
Run npm run build:js, node scripts/generate-js.mjs --check, npm test and native tests
appropriate to changes. Browser proof: node test/browser/serve.mjs then run fixture.
Never infer browser, security or performance support from compilation/static analysis.
Independent authoring: examples/authoring/README.md. Optional real React/types proof:
test/react-consumer/README.md; its current-source guard prevents stale archive passes.
Read docs/design/fathom-integration.md for index boundaries and wiring limitations.

<!-- fathom:begin v3 sha256:918b1c90559355ef78f33fdf3562f2b021ef8bdfd8a5c8415e5decd44934de55 -->
@AGENTS.md
<!-- fathom:end -->
