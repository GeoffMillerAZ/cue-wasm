# CUE-WASM Performance Optimization Guide

This guide explains how to achieve near-instant load times for CUE-WASM in production environments.

## 1. Phased Loading (The "Reader" Split)

By default, the full CUE evaluator is ~30MB. To prevent blocking the user, we split the binaries:

-   `cue-reader.wasm` (**~5.2MB**): Handles Syntax, Symbols, and Formatting.
-   `cue-engine.wasm` (**~27.1MB**): Handles Full Unification and Validation.

**Implementation**: Use `loadWasmWorker()` instead of `loadWasm()`. It loads the Reader immediately and warms up the Engine in the background.

## 2. Server-Side Optimization (Critical)

Your web server should be configured to serve WASM files with the following optimizations:

### A. Preemptive Pushing (HTTP/2 or /3)
Add a `Link` header to your HTML response to start the download before the browser even parses your JS.

```http
Link: <https://cdn.jsdelivr.net/npm/@geoff4lf/cue-wasm@1.4.1/bin/cue-reader.wasm>; rel=preload; as=fetch
Link: <https://cdn.jsdelivr.net/npm/@geoff4lf/cue-wasm@1.4.1/dist/worker.js>; rel=preload; as=fetch
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

CUE-WASM automatically caches the **compiled** WebAssembly module bytes in the browser's IndexedDB. 
-   **Cold Start**: ~1-3 seconds (Download + Compile).
-   **Hot Start**: **< 50ms** (Skipping download and compilation).

This is handled automatically when using `loadWasmWorker()`.

## 4. React / Next.js Integration

Enable high-performance mode by passing the `useWorker` flag to the `CueProvider`:

```tsx
<CueProvider useWorker={true}>
  <App />
</CueProvider>
```

## 5. Performance Ratings (RAIL Model)

Our Mission Control tool uses the following rating system based on user perception:

- **ULTRA (< 100ms)**: Imperceptible. The "Gold Standard" for responsiveness.
- **FAST (100-300ms)**: Responsive. Comparable to a fast API request.
- **OK (300-1000ms)**: Noticeable but acceptable for background initialization.
- **SLOW (> 1000ms)**: Noticeable lag. Consider enabling caching or preloading.