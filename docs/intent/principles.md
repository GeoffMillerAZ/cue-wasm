# Principles

- Upstream semantics over a smaller but divergent evaluator. Optimize delivery and
  ownership first; a replacement engine must earn exhaustive compatibility evidence.
- Pay for needed capabilities. Syntax-only work and evaluation are distinct modes;
  prepared configuration should not require a runtime engine at all.
- Responsiveness requires bounded ownership, not merely a worker. Bound queues,
  input and deadlines, expose failure, release the owner, and preserve host drafts.
- Determinism is relative to source, dependency versions and explicit inputs.
  Pin and record those inputs; never manufacture confidence from successful parsing.
- One source for generated output; no model calls during ordinary generation.
- Measure compressed transfer, initialization and memory separately. A smaller
  archive is not automatically a faster interactive application.
- Reuse without coupling: framework helpers are optional; consumers own UI and policy.
