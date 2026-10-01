# Local authoring resource workload v1

Frozen before execution on 2026-09-30. This is a bounded reference-machine admission
screen, not production/network or constrained-device qualification. It does not change
app-kit's viewer payload/frame budgets; the optional CUE authoring engine is separate.

## Procedure

Apple M4/32GiB macOS, Chrome154, Node26.3 packaging, pinned Go1.24.4/CUE0.15.4.
Use verified npm archive assets from the independent authoring directory. One worker
at a time, explicit disposal every run; no provider/network sources. Loopback static
server with no-store and raw assets. Browser/compiler caches are retained and may
already contain these modules: never call the first sample cold startup.

Ten alternating engine/reader pairs. Engine evaluates the example schema/draft and
checks title/three panels. Reader formats the same draft and checks the returned title.
Different capabilities, not equivalent engine-speed competitors. Report every sample,
nearest-rank p50/p95 for initialization, first useful call and whole owner lifetime.
Use performance.now around awaited public operations; includes transfer/startup/call
boundary cost, excludes human input, rendering and next-task scheduling after dispose.
Disposal timing measures synchronous termination call, not demonstrated memory return.

## Fixed screening gates and missing qualification

- Correct output in20/20 serial runs; one owner at a time; every owner disposed.
- Reference loopback retained-cache p95 initialization ≤1500ms per capability and
  first useful call ≤100ms for this small configuration (no claim for arbitrary CUE).
- Selected engine gzip9 ≤8MiB; reader gzip9 ≤2MiB, excluding shim/modules; record all
  assets separately. This is a transfer screen, not measured compressed HTTP delivery.
- Never infer total memory from JavaScript heap. Worker/WASM/renderer/browser resident
  allocations and post-disposal return need a separate controlled process-level study.
- Cold browser/cache, constrained hardware/network, release compression/cache headers,
  large/pathological sources, multi-consumer contention and sustained memory remain
  unavailable until separately measured. A timing pass alone cannot promote G3.

Harness: test/resources/browser.html + browser.mjs, copied into the prepared authoring
root. Serve with scripts/serve-authoring.mjs; run the visible button and retain JSON
from the page. Cancellation aborts the active operation and disposes the current owner.
Record exact source/asset hashes and UA alongside results. Changing a target requires
an evidence-backed decision; do not edit thresholds after observing a failed result.
