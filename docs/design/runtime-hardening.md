# Runtime hardening and independent adoption

Owner-authorized 2026-09-30. Governing direction supplements architecture.md; the older
v1 API draft and checked task list are historical, not current package/browser proof.
Execution lives in docs/tracking/implementation_tracker.md, one authoritative status.

## Purpose and boundaries

Make official CUE evaluation dependable in browser and Node authoring tools. Keep the Go
evaluator authoritative, JavaScript responsible for hosting/lifecycle, and React optional.
No Rust language rewrite, mandatory provider/backend, implicit data upload or premature
server/CLI/WASI product. App-kit is a candidate consumer, not an internal dependency.
Authoring and evaluation are separate from trusted authorization and factual correctness.
WASM is not zero startup, a memory quota or automatic host isolation.

## Delivery sequence and acceptance

1. Package the actual default engine, reader and matching Go shim; test the installed
   archive outside the source checkout. Preserve documented legacy asset compatibility.
   Keep generated JavaScript/types reproducible from source and dependency state coherent.
2. Explicit worker state: loading, ready (engine or syntax-only reader), failed, disposed.
   Loading resolves only for advertised capabilities. One active call, bounded queue/input,
   deadlines, AbortSignal, worker crash/message failures and disposal settle promises.
   Active computation cancellation terminates the dedicated worker; retry creates a new
   owner. Queued cancellation removes only that request. Never publish a late response.
3. Explicit asset URLs and content identity, recoverable fetch/cache failure and cache
   bounds. Prefer one full engine for evaluation; phased double-runtime loading must earn
   its cost. No automatic background evaluation engine hidden behind syntax readiness.
4. Align direct/worker/Workspace/React return contracts and declarations; no silent no-op
   for unsupported methods. Source drafts outlive workers; helper instances have explicit
   ownership and retry. Separate schema/data compilation semantics need native regression.
5. Differential native/WASM corpus: defaults, disjunctions, conflicts, closedness, precision,
   missing/incomplete data, imports/tags, diagnostics and actual authoring consumers.
   Add property/fuzz cases for trust boundaries; pin oracle/toolchain and retain failures.
6. Real browser and independently installed package tasks: valid/invalid authoring,
   syntax-only unsupported evaluation, abort/restart, crash/fetch/cache recovery, narrow/
   keyboard flow, repeated mount/dispose and bounded growth. Record cold/warm resource
   distributions under frozen conditions before speed/memory or production claims.

## Compatibility and security

No remote publication or release follows local authorization. Existing source pins remain
until deliberately evaluated; CUE/package/Go versions are separate metadata. Use app-owned
self-hosted assets for private/offline authoring. Default asset strategy changes and public
error/return-shape changes require documented migration. Reject invalid paths/requests and
bound inputs before allocation where possible; do not infer sandbox guarantees from one
failed filesystem import. CSP, imported builtins, network and host capabilities need
explicit verification. Source content and secrets stay out of routine logs.

## Current evidence and resumption

Initial audit: package manifest omitted default engine/reader; reader readiness preceded
evaluation readiness; worker had no disposal/cancellation/crash handling. Node execution
of current app-kit CUE command agrees with app-kit's native evaluator for one example,
but neither that nor historical mock tests proves browser or release adoption.
The first milestone is package closure, followed by bounded worker lifecycle. Subsequent
work must extend these exact gates rather than replacing them with a smaller happy path.
