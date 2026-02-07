# CUE-WASM Performance Optimization Guide

This guide explains how to achieve near-instant load times for CUE-WASM in production environments.

## 1. Phased Loading (The "Reader" Split)

By default, the full CUE evaluator is ~30MB. To prevent blocking the user, we split the binaries:

-   `cue-reader.wasm` (~5MB): Handles Syntax, Symbols, and Formatting.
-   `cue-engine.wasm` (~30MB): Handles Unification and Validation.

**Implementation**: Use `loadWasmWorker()` instead of `loadWasm()`. It loads the Reader immediately and warms up the Engine in the background.

## 2. Server-Side Optimization (Critical)

Your web server should be configured to serve WASM files with the following optimizations:

### A. Preemptive Pushing (HTTP/2 or /3)
Add a `Link` header to your HTML response to start the download before the browser even parses your JS.

```http
Link: <https://cdn.jsdelivr.net/npm/@geoff4lf/cue-wasm@1.3.0/bin/cue-reader.wasm>; rel=preload; as=fetch
Link: <https://cdn.jsdelivr.net/npm/@geoff4lf/cue-wasm@1.3.0/dist/worker.js>; rel=preload; as=fetch
```

### B. Compression (Brotli/Gzip)
Ensure your server compresses `.wasm` files.
-   **Brotli**: Reduces `cue-reader.wasm` to **< 1MB**.
-   **Gzip**: Reduces `cue-reader.wasm` to **~1.2MB**.

### C. Caching Headers
WASM binaries are versioned. Use immutable caching headers.

```http
Cache-Control: public, max-age=31536000, immutable
```

## 3. Persistent Caching (IndexedDB)

CUE-WASM automatically caches the **compiled** WebAssembly module in the browser's IndexedDB. 
-   **Cold Start**: ~2-5 seconds (Download + Compile).
-   **Hot Start**: **< 100ms** (Skipping compilation).

This is handled automatically when using `loadWasmWorker()`.

## 4. Next.js Integration

For Next.js users, use the `CueProvider` with the `workerMode` flag (coming in v1.4.0) to enable these optimizations automatically.
