# Delivery and performance

WASM still requires transfer, compilation, initialization, memory and input copying.
Use prepared JSON/assets for viewers; load an evaluator only in authoring workflows.

## Select one capability

`loadWasmWorker()` loads the full engine and resolves when evaluation is ready.
`loadWasmWorker({mode: 'reader'})` loads syntax tooling only and refuses evaluation.
There is no automatic background second runtime. Dispose owners when no longer needed;
active cancellation terminates the owner. See [migration](design/runtime-migration.md).

## Deploy assets intentionally

Self-host the worker, Go shim and selected WASM from one prepared release. Use explicit
URLs in apps with a bundler; do not assume that bundlers copy runtime-relative assets.
Serve WASM as application/wasm. Enable gzip/Brotli and correct Content-Encoding/Vary.
Use immutable caching only on content-addressed or genuinely immutable version URLs.
Private source remains in worker messages; do not include it in URLs or access logs.

The worker uses ordinary HTTP caching. The previous custom IndexedDB byte cache has
been removed; it did not prove compiled-module reuse or safe asset identity. No warm
startup timing or cache hit is promised. The development fixture intentionally serves
no-store for repeatable lifecycle tests, not production startup benchmarking.

## Measure before adding a split

`node scripts/measure-assets.mjs` reports raw/gzip-9/Brotli-5 bytes and hashes.
This is transfer evidence only. Splitting one evaluator into HTTP chunks does not
remove code required for evaluation and may add request/assembly costs. Keep the reader
split for syntax-only consumers. Further chunking needs an end-to-end measured benefit.

[Runtime acceptance](design/runtime-hardening.md) requires browser startup/resource
measurements before production performance claims. Record cold/warm cache, hardware,
browser, worker count, inputs, latency distributions and total available memory metrics.
The old near-instant and <50ms claims have no accepted current evidence.

The [frozen local authoring screen](design/authoring-resources.md) now has a
[20-lifetime packet](assessments/fixtures/authoring-2026-09-30/README.md): Apple M4/32GiB,
Chrome154, retained browser caches, loopback raw assets. Engine initialization p95214ms,
first small configuration call73.1ms; reader95.5/13.5ms for syntax formatting. Different
capabilities and tasks, not interchangeable speed competitors. Cold/network/resource
qualification remains incomplete; disposal-call time is not proof of memory return.
