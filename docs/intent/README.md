# Project intent

Authority: [vision](../../VISION.md), this intent, and [ADRs](../adr/README.md).
ADR means a consequential decision with a revisit trigger. Historical sketches
are not availability claims. Read only the relevant routes before material work.

| Task | Read |
|---|---|
| Product, runtime, dependency change | [scope](scope.md), [principles](principles.md), [domain](domain.md), ADRs |
| Implementation or refactoring | [invariants](invariants.md), [runtime hardening](../design/runtime-hardening.md) |
| New capability | [futures](futures.md), [questions](questions.md), scope |
| Autonomy, recovery, publication | [autonomy](autonomy.md), [incidents](incidents.md) |
| Resume, report progress | [roadmap](../roadmap.md), [tracker](../tracking/implementation_tracker.md) |
| Agent/index wiring | [Fathom guidance](../design/fathom-integration.md) |

| Sensitive surface | Done needs |
|---|---|
| CUE semantics | Native regression plus rebuilt WASM differential corpus |
| Worker ownership | Queue/abort/deadline/crash tests and actual browser lifecycle |
| Generated/packaged assets | Drift check, hashes, installed archive proof |
| Performance/security claim | Declared workload, environment, limits and observed evidence |
| Support/release | Compatibility notes, clean build, browser/consumer evidence; explicit publication authority |

Verified against local Node 26.3 and existing Go/CUE source pins on 2026-09-30.
This is source/runtime verification, not proof that every agent host loaded guidance.
Installed harness versions: Codex0.159.0, Claude Code2.1.285; lefthook1.13.6.
Remaining wiring gaps belong in the Fathom evidence.
