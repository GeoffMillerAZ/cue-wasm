# ADR-0003 — Explicit offline virtual workspaces

Status: Accepted, 2026-09-30
Type: security

## Context
CUE's official load overlay supplements an underlying filesystem. Browser Go shims
return ENOSYS and lack a directory flag, whereas the loader needs ENOENT for an
absent backing directory. Native/Node runs with filesystem access can mask this.
Implicit registry configuration also conflicts with the no-remote-resolution scope.
Asynchronous formatting could overwrite a newer or recreated host draft.

## Decision
Reserve /__cue_wasm_workspace__ for supplied files. Normalize bounded UTF-8 paths,
reject traversal, selector syntax and alias collisions, and require every explicit
entry point to be supplied. Use an explicit offline registry, not ambient settings.
Support official builtins and module-local imports supplied with the module manifest.
Do not install a host filesystem to make browser module loading work.

After loading the matching upstream Go shim and before starting Go, a small JS
adapter returns ENOENT for backing reads under the reserved mount. It translates
the shim's unsupported directory sentinel to zero before Go captures constants.
Outside that mount it delegates unchanged. Keep the official shim unmodified.
Generate the same adapter into the classic worker and standalone ESM source.

The native core still uses CUE's filesystem overlay and is not a privileged-process
sandbox. Its ParseFile guard refuses non-supplied CUE sources; this is not a claim
that upstream code never consults OS metadata. Direct browser/Node loading also
retains global Go/shim ownership; prefer dedicated workers for untrusted authoring.

Host Workspace tracks draft revisions. Late formatting, syntax and symbol results
reject as stale_result after edits, removal or recreation. No late write wins over
a newer draft. Diagnostics preserve a structured virtual file anchor and optional
upstream cause details; consumers render both as text, not markup.

## Evidence and compatibility
Native/WASM fixed-outcome corpus, local-registry zero-request test, path fuzzing,
JS draft races and installed browser checks are separate evidence in the tracker.
This narrows accepted paths/import behavior; migration and release versioning are
required. It neither certifies all CUE builtins nor sets a hard memory quota.

## Revisit when
A consumer needs explicitly authorized remote modules, upstream offers a hermetic
filesystem interface, or a pinned Go/CUE update changes overlay/shim behavior.
