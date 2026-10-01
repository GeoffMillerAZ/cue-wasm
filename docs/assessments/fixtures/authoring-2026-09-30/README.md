# Independent authoring proof — 2026-09-30

Dirty implementation based on f703f9afcb10a03cda5388ee59def4c518f844c5. This packet
qualifies this example's observed behavior, not a clean release or complete G3.

- `tests.txt`: 11 deterministic ownership/diagnostic tests and 10 fixed native/WASM
  authoring schema outcomes using Go1.24.4/CUE0.15.4, Node26.3, macOS Apple M4.
- `regression.txt`: full existing npm suite passed. No runtime implementation changed.
- `package-receipt.json`: runtime extracted from an npm archive; assets hash verified.
  Package script metadata predates the final authoring scripts; runtime files unchanged.
- `source.tar.gz`: exact example, preparation/server and tests used; hashes below.
- `workbench.jpg`: actual installed consumer screenshot after final diagnostic helper.
- `exported.json`: actual browser download, compared with independently authored expected
  values by strict deep equality. Browser download remains in user's Downloads.

Chrome154/macOS via restored extension on loopback, synthetic configuration only:
1. Explicit Start loads official engine. Default configuration evaluates; all three
   panels/default limit100 appear, current output enables Download.
2. Editing limit1001 disables export immediately and marks prior preview stale.
   Evaluation rejects it; prior preview remains, usable editor and worker retained.
3. Corrected draft formats; keyboard Enter on Evaluate produces light preview.
   `<img src=x onerror=alert(1)>` remains literal heading text, zero img elements.
4. Narrow override requested390×844; measured CSS viewport520×1125 (existing browser
   zoom). Document/client width500, no horizontal overflow, source/result stack.
   Do not claim an exact390CSSpx acceptance. Override reset after inspection.
5. Final source reload and actual Download produces exported.json with fixed defaults.
6. Owned prepared engine temporarily renamed: real404 displays Retry and preserves
   edited draft. Restored identical engine bytes; Retry+Evaluate succeeds without reload.

Initial test failures preserved in session history: same-package root CUE embedding
allows sibling fields (fixed explicit negative-pattern guard; test not weakened), and
rename across Mac volumes fails EXDEV (preparation now copies and cleans own scratch).
Controller race/cancel/disposal checks are deterministic tests. Actual worker abort/
repeated-mount lifecycle remains the separate installed-runtime packet, not a new
claim that this manual UI flow covered every lifecycle. No total-memory, cold startup, complete accessibility, cross-browser or app-kit schema proof.

Contribution CUE-AUTH-01: consumer-owned revision gate plus fixed negative-schema
fixtures are a reusable adoption lesson, incubating. App-kit owns its schema/theme
contracts; this small example owns configuration and CSS, not a new shared UI API.
Next: real React verification, resource workload and app-kit CUE0.16.1 compatibility.
No new ADR: existing ADR0001–0003 admit this G3 consumer. No publication/push.

## Frozen local resource screen

`docs/design/authoring-resources.md` fixed conditions/gates before execution.
`resource-screen.json` retains20 serial lifetimes (ten alternating pairs), all correct,
all disposed. Apple M4/32GiB confirmed by sysctl; Chrome154 UA in result. Retained
compiler/browser caches, raw/no-store loopback assets; not a cold-start measurement.
Engine p50/p95 init143.2/214ms, first configuration call50.6/73.1ms. Reader init60.6/95.5ms
and format10/13.5ms. Both pass frozen1500ms init/100ms call screens. `assets.json` shows
engine gzip9 6,895,797B and reader1,643,579B, within8/2MiB transfer screens.
These are distinct workloads/capabilities. No total-memory or memory-reclamation proof,
HTTP compressed-delivery claim, constrained-host, production or cold-network support.

Final UI also exposes Stop evaluator while ready: Chrome verified stop preserves
current preview/export and restart evaluates again. Last screenshot/source include it.

## Real React prerequisite

The separate test/react-consumer installed fixture exposed two actual declaration
failures: missing /tools declarations and incorrect CueWorkerError constructor.
`types-before-fix.json` retains the failure; main fixed internal/js sources and
regenerated, including a drift negative for the new declaration. Final pinned consumer
will establish the correction; do not interpret the old receipt as final acceptance.
`react-before-types-fix.json` establishes12 actual React19.2/StrictMode Chrome154 groups
on original9ad024 archive,20 observed native Workers created/terminated,live0. Not a
mock hook harness. Final repackaged declaration proof and nested static host now pass; see below.

Final React archive1633ff5429dfaa7c01cdd0a3328eb02deacf03f4dfd76e98d07ad8e7847efe7b:
strict TS5.9.3 positives,12 individually rejected negative usages, both repaired declaration
probes and four package/build/HTTP/source-drift tests pass. Actual React19.2/StrictMode
Chrome154 under `/nested/` passes12 groups,20Workers created/terminated,0live. Evidence
lives in test/react-consumer/evidence; its source-independent frozen archive is in vendor.
Current generated module/declaration closure, public contracts and engine manifest/assets
match that archive; deliberately changed exports/types/binary bytes are rejected. CI
now includes this guard (remote CI not executed). Optional consumer has its own tooling.
All owned authoring/React servers and test tabs stopped/closed; agent closed. Prepared
authoring68MiB and isolated React dependencies/site retained for reproduction. App-kit
demo8222 remains untouched. Old capture tab2086957708 absent from current Chrome inventory.
