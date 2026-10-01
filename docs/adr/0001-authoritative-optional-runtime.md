# ADR-0001 — Official CUE with capability-selected worker ownership

Status: Accepted, 2026-09-30

## Context
The owner requires dependable CUE for app-kit and other authoring tools, with
smaller/faster delivery where it earns its complexity. Existing phased loading
starts two Go runtimes and exposes readiness before evaluation is available.

## Decision
Keep the pinned official Go evaluator authoritative. JavaScript owns browser
loading, queueing, errors and disposal. Use one dedicated worker per owner and
one active computation; engine is the default, reader is explicitly syntax-only.
No hidden engine warm-up. Cancel active work by terminating the owner; preserve
host drafts and allow a new owner. React is optional and cannot share an implicit
process-wide worker across independently configured providers.

Prepared viewers use derived JSON/assets. Runtime evaluation is opt-in authoring,
not a mandatory visualization dependency. A sibling checkout is not a release dependency.

Prefer HTTP compression/cache and capability selection before arbitrary binary
chunking. Rewriting full CUE in Rust would create another language implementation;
no size saving or compatibility benefit is assumed. WASM has nonzero startup.

## Consequences
Worker behavior and getSymbols shape changes require migration notes. Reader
consumers cannot request evaluation. Active cancellation also rejects queued work.
Direct main-thread loading retains separate, less isolated lifecycle constraints.

## Revisit when
Measured consumer workloads show a required capability cannot fit these boundaries,
or a compatible delivery split provides meaningful end-to-end gains.
