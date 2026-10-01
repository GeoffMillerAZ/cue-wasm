# Scope and goals

## Admitted work

- **G1 Dependable embedded runtime.** Done when installed package, explicit worker
  capabilities, bounded ownership, crash/retry and accurate types pass native,
  JavaScript and browser gates in the runtime-hardening acceptance.
- **G2 Reproducible authoritative computation.** Done when clean builds record Go,
  CUE, source and asset identity, deterministic generators detect drift, and a
  native/WASM semantic corpus covers meaningful valid and invalid cases.
- **G3 Efficient authoring adoption.** Done when representative app-kit-style
  theme/configuration/view drafts work through an independently packaged consumer,
  with measured transfer/startup/resources and documented deployment choices.
- **G4 Maintainable contributor experience.** Done when guidance, ADRs, roadmap,
  CI and Fathom evidence agree, preserve existing work, and distinguish configured
  tooling from actual host invocation/enforcement.

## Compatibility surface

- npm @geoff4lf/cue-wasm exports, direct loader, worker loader and declarations.
- Virtual files/entry points/tags, diagnostics, JSON-string results and Workspace.
- Optional React provider/hook; asset URLs including legacy cue.wasm and Go shim.
- Pinned CUE language behavior and package metadata. Changed semantics/lifecycle
  need migration notes and deliberate versioning before publication.

## Boundaries

Core owns CUE evaluation and lifecycle. Consumers own domain schemas, drafts,
authorization, persistence, visual design and orchestration. Fathom is development
intelligence, never a release/build dependency. App-kit is a consumer, not an import.
No implicit network source resolution or provider use is admitted by this mandate.

## Non-goals

A Rust CUE rewrite, hosted evaluation platform, full language server, custom UI kit,
or WASI service are not current delivery. Revisit when a concrete consumer and
measured constraint justify a separately accepted decision and acceptance workload.
