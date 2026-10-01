# ADR-0002 — Reproducible artifacts and bounded support claims

Status: Accepted, 2026-09-30

## Context
Existing checked-in WASM lacks a source/toolchain receipt, package checks missed
required assets, and historical docs advertise broad security/performance claims.

## Decision
Generate JS/types from internal source with a drift gate. Build WASM and matching
Go shim from explicit toolchain/CUE pins; record hashes and flags. Optional optimizer
availability must not silently change the release. Validate the actual installed
archive outside the checkout. Package, native, semantic and browser evidence are
separate gates. Retain a focused native/WASM differential corpus and regressions.

Track current acceptance in the existing implementation tracker. Distinguish
implemented, behavior-verified, adopted and release-supported. Document workload,
environment, cold/warm conditions and unavailable metrics for performance claims.
Fathom assists discovery/refactoring; its static proof cannot certify runtime,
security, visual quality or host lifecycle. No ordinary build requires an LLM.

## Revisit when
The build, distribution or host model changes, or upstream CUE changes semantics
that require revising the corpus/compatibility surface.
