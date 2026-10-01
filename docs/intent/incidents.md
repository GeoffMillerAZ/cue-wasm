# Incidents

## 2026-09-30 — source checkout masked package/lifecycle gaps
Audit found omitted default engine assets and worker readiness advertised before
full evaluation, with no cancellation/disposal settlement. Existing tests did not
exercise an independently installed archive or actual browser lifecycle.
Outcome: package positive/negative smoke and worker lifecycle tests added; broader
source/binary provenance and semantic compatibility remain open in the tracker.

## 2026-09-30 — native filesystem masked browser local-import failure
A new native/WASM local-module case failed only in ordinary browser-style shims.
The upstream loader merges overlay directories with backing directories; ENOSYS
and the shim's absent O_DIRECTORY failed before it could use overlay files.
Outcome: reserved-mount adapter, explicit offline registry and installed-browser
local-import update/removal checks. Official Go shim remains unchanged (ADR-0003).
