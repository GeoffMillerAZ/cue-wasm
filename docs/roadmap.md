# Roadmap

[Vision](../VISION.md) and [intent](intent/README.md) define the outcome.
[Implementation tracker](tracking/implementation_tracker.md) owns current evidence.
No release or publication is implied by a milestone.

1. **Reliable ownership and package closure:** actual installed assets; engine/reader
   capability selection; bounded queue/input/deadline; failure, abort and disposal;
   accurate framework-neutral and optional React APIs. Actual browser verification.
2. **Authoritative, reproducible computation:** pinned Go/CUE builds and shim,
   deterministic JS generation, artifact manifests; native/WASM corpus and trust
   boundary regression/fuzz tests. Resolve compatibility differences deliberately.
3. **Efficient delivery:** measure compressed assets and cold/warm initialization;
   lazy opt-in evaluation, reader-only syntax; compare streaming/HTTP caching before
   custom cache or binary chunking. Freeze workload/resource gates before claiming gains.
4. **Useful adoption:** independent local authoring workbench for theme/configuration
   and visualization specifications; invalid drafts with actionable errors, cancellation,
   retry and export. [Configuration studio](../examples/authoring/README.md) exercises
   the packaged path; domain-specific adoption and resource qualification remain.
   No sibling checkout dependency.
5. **Release readiness:** clean-checkout/CI matrix, browser/React adoption, resource
   evidence, migration, security review and explicit support levels. Publication needs
   separate authorization.

Future server/CLI/WASI/LSP ideas moved to [futures](intent/futures.md) with admission
conditions. They do not compete with these deliverables or imply current availability.
