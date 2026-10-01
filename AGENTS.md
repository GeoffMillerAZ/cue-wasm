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

<!-- fathom:begin v3 sha256:38fe9075ce3ec5f9d2cfecfcd65a9592d7320afb00ed1ad3c26cf8409ec90481 -->
## fathom code intelligence

This repo is indexed by fathom as service "cue-wasm". Route by
question shape (SB-7, docs/vision/27-strengths-bench.md §8 — the home
bench found "index before any grep" over-broad), on this session's
default eight-tool MCP registration (surface reckoning F-86): where a
symbol is defined is `find_symbol`; who-calls it, briefly (definition,
a capped caller/callee list, tests) is `symbol_context`; what-breaks
is `blast_radius`; a composed review verdict over a diff is
`review_diff`; what-governs this repository is `obligations` with no
path (the root conventions); is a plan's box proven is `verify_plan`;
the current text at a cited line is `read_source`. A literal string, a
config value, a log line, or a document-versus-document contradiction
is `search`'s job (grep with a receipt, RC-24), not the other tools'.
Read files to *edit* them, not to discover them. The wider verb set
— the full resolved caller graph, staleness and what-was-known, and
more — lives one hop away at `/rpc/extended` (or its `/rpc/companion`
alias); register that surface instead of `/rpc/agent` for a session
that needs it.

Opening moves by task shape (first 2-3 calls, then edit):
- bug report / stack trace / failing test: search -> symbol_context -> read_source
- feature/change: search -> obligations -> symbol_context
- review/verify: review_diff -> obligations -> verify_plan
- refactor/delete: blast_radius -> review_diff -> verify_plan

The index refreshes itself: a read of a drifted service answers from
what it has and queues a re-ingest in the background (RT-99) —
nothing to call.

Obligations — governing rules for the file you are about to touch — are
injected automatically on every edit via the PostToolUse hook. Treat them
as binding, not advisory.

Continuity: run `fathom prime` at session start if your harness has no
SessionStart hook (Codex does not) — it prints the same identity,
freshness, live-example, thread-brief, and custodian primer this hook
injects on Claude Code. File what the next session must know:
`fathom thread note "…"`.

Done means proven: a plan task is only "done" when the index proves it, not
when it is claimed. Before checking off a `docs/plans/*.md` item, run:

    fathom verify --service cue-wasm --plan docs/plans/<plan>.md

Exit 0 = every claimed task verifies. Exit 1 = a claimed task is unproven —
fix the code or uncheck the box. Exit 2 = operational (daemon down / index
stale) — fail-open, not a verification failure.
<!-- fathom:end -->
