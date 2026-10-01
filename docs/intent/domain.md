# Domain

- **Evaluator**: pinned official CUE implementation; syntax validity, completeness
  and successful export are different outcomes.
- **Reader**: parsing, formatting and symbol inspection; cannot evaluate constraints.
- **Virtual workspace**: explicit source map, entry points and tags; no implicit
  authority to read arbitrary host files or download private modules.
- **Worker owner**: one runtime with loading/ready/failed/disposed lifecycle. Active
  cancellation destroys that owner; a new owner is required to retry.
- **Draft revision**: consumer identity for editor input. Hosts discard results for
  superseded drafts; transport request identity is not a source revision.
- **Artifact**: derived JS/types/WASM/shim with source and toolchain provenance.
  Package version, Go version and CUE version are distinct facts.
- **Validation**: schema and data evaluated then unified; successful constraint
  satisfaction does not establish truth, provenance or external authorization.
- **Admission** permits implementation. **Verified** names a tested behavior and
  environment. **Supported** requires all promised gates, not one passing fixture.
