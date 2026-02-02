# Implementation Tracker: Cue-WASM

**Design:** [System Overview](../design/system_overview.md)
**Status Legend:** ⚪ Todo | 🔵 Drafted | 🟠 Implemented | ✅ Verified

## TDD Workflow

```mermaid
stateDiagram-v2
    [*] --> WriteSpec
    WriteSpec --> WriteTest: Defined Behavior
    WriteTest --> RunTest: Fail (Red)
    RunTest --> WriteCode: Implement Logic
    WriteCode --> RunTest: Pass (Green)
    RunTest --> Refactor: Clean Code
    Refactor --> [*]
```

## Task Dependency Graph

```mermaid
graph TD
    classDef todo fill:#fff,stroke:#ccc,stroke-width:1px,color:#333;
    classDef verified fill:#cce5ff,stroke:#0056b3,stroke-width:2px,color:#002a80;

    T1[CW-001: Core Service]:::verified
    T2[CW-002: Core Tests]:::verified
    T3[CW-003: WASM Adapter]:::verified
    T4[CW-004: Build Script]:::verified

    T1 --> T2
    T1 --> T3
    T3 --> T4
```

## Task List

| ID | Task | Spec Ref | Test Ref | Status |
| :--- | :--- | :--- | :--- | :--- |
| **CW-001** | Implement Core Cue Logic (Unify/Export) | `specs/001-api-surface.md` | `internal/core/service_test.go` | ✅ Verified |
| **CW-002** | Gold Standard Core Tests (Table Driven) | `specs/001-api-surface.md` | `internal/core/service_test.go` | ✅ Verified |
| **CW-003** | Implement WASM Bridge (`syscall/js`) | `specs/001-api-surface.md` | `pkg/cue-wasm/test/integration/test.js` | ✅ Verified |
| **CW-004** | Create Build Script (`build_wasm.sh`) | N/A | N/A | ✅ Verified |
