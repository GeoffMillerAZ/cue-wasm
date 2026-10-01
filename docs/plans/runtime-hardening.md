# Runtime hardening work order

Acceptance: [runtime hardening](../design/runtime-hardening.md).
Current execution evidence remains in [tracker](../tracking/implementation_tracker.md).
In-progress rows are not completion claims. Fathom verifies source contracts; actual
browser, package, semantic and resource evidence must also pass acceptance.

- [~] Harden worker lifecycle and qualify supported hosts {id: CW-101, symbol: WorkerManager, package: internal/js}
- [~] Preserve authoritative computation and qualify differential corpus {id: CW-102, symbol: NewCueService, package: internal/core}
- [ ] Complete independent authoring consumer and resource qualification {id: CW-103, symbol: Workspace, package: internal/js, needs: "CW-101, CW-102"}
