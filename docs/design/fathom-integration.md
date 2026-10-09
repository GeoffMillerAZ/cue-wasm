# Fathom integration

Service: cue-wasm. Canonical root: /Volumes/m2ext/code/geoffmilleraz/cue-wasm.
Fathom is optional development intelligence, never required by package consumers.

Use find_symbol/symbol_context/blast_radius for definitions, callers and change impact.
Read root and file obligations, checking stale/coverage metadata. Literal searches may
use rg. Read source and execute behavior tests before claiming a refactor is correct.
Run fathom prime when the harness has not supplied a session primer.

## Repository wiring

AGENTS.md is the only instruction file and owns the generated Fathom stanza. Repo-local skills
are shared through .agents/skills -> ../.claude/skills after fleet reconciliation.
Project hooks live in .claude/settings.json. Never silently overwrite modified hooks
or rebaseline drift. Reconciliation is reversible via its receipt.

2026-09-30 reconciliation receipt: 01439419d159. It added two test-result hooks and
updated its owned guidance. Pre-existing source changes remain preserved. Diagnostics
and current limitations are in docs/assessments/fixtures/runtime-hardening-2026-09-30.

## Evidence boundaries

Codex MCP registration and live daemon are detected. This does not prove each repo's
stanza/skills loaded in a fresh Claude/Codex session. Root obligations returned stale
historical rules and uncompiled current scopes; no paid compilation is authorized.
Provider credentials are not required for deterministic development and are not added.
No global configuration or daemon lifecycle changes are part of this uplift.

Index excludes bin, dist, node_modules, caches, archives and private/environment files.
Use the registered daemon's ingest surface for this root, not a new local database.
Run doctor explicitly for codex/claude-code; retain failures and skipped evidence.
Static plan verification supplements native/JS/package/browser gates, never replaces them.

## Current verification

Repo-only doctor: 10 pass, 0 fail, 1 skipped for each of Codex and Claude Code.
Local lefthook pre-push installed. Three guards address observed regressions; a manual
synthetic pre-edit envelope returned the worker guard and current raw guidance.
This is not native host-loading proof. Daemon ingest initially failed to type-load
the JS-only Go entrypoint; adding its js/wasm build constraint resolved that failure.
Final ingest returned ok:true. No paid compile, global configuration or daemon restart.
Plan gate currently passes because no incomplete rows are claimed done; two rows
still lack static test reachability. Runtime JS evidence remains separate.

The installed pre-push command uses `--strict` and propagates nonzero exits,
including operational failures. The generated generic stanza’s fail-open wording
does not waive this concrete repository gate. Retry the registered daemon or report
a blocked push; never skip the hook or create a competing index to make it green.
