// Phased Loader for CUE-WASM
const fs = require('fs');
const path = require('path');
const { Workspace } = require('./workspace.js');
const { WorkerManager } = require('./worker-manager.js');

const PACKAGE_VERSION = "__VERSION__";
const BASE_CDN = `https://cdn.jsdelivr.net/npm/@geoff4lf/cue-wasm@${PACKAGE_VERSION}`;

/**
 * Traditional loader. 
 * In Node: Loads full engine.
 * In Browser: Direct streaming load.
 */
function loadWasm(wasmPath) {
    if (typeof Go === 'undefined') {
        if (!globalThis.crypto) {
            globalThis.crypto = { getRandomValues: (arr) => require("crypto").randomFillSync(arr) };
        }
        try { require('../bin/wasm_exec.js'); } catch (e) { throw new Error("Go global not found."); }
    }

    const go = new Go();
    if (typeof window === 'undefined') {
        const localPath = wasmPath || path.join(__dirname, '../bin/cue-engine.wasm');
        const wasmBytes = fs.readFileSync(localPath);
        const mod = new WebAssembly.Module(wasmBytes);
        const inst = new WebAssembly.Instance(mod, go.importObject);
        go.run(inst);
        return global.CueWasm;
    } else {
        const url = wasmPath || `${BASE_CDN}/bin/cue-engine.wasm`;
        return WebAssembly.instantiateStreaming(fetch(url), go.importObject).then((result) => {
            go.run(result.instance);
            return global.CueWasm;
        });
    }
}

/**
 * Phased High-Performance Loader.
 * 1. Loads Reader immediately (5MB).
 * 2. Loads Engine in background (27MB).
 * 3. Transparently upgrades when ready.
 */
async function loadWasmWorker(options = {}) {
    if (typeof window === 'undefined') throw new Error("Worker mode only supported in Browser.");

    const workerPath = options.workerPath || `${BASE_CDN}/dist/worker.js`;
    const readerPath = options.readerPath || `${BASE_CDN}/bin/cue-reader.wasm`;
    const enginePath = options.enginePath || `${BASE_CDN}/bin/cue-engine.wasm`;

    const manager = new WorkerManager(workerPath, readerPath, PACKAGE_VERSION);
    
    // Phase 1: Initialize Reader
    console.log("[CUE-LOADER] Initializing Reader (Phase 1)...");
    await manager._send('init', { wasmPath: readerPath, version: PACKAGE_VERSION, isReader: true });
    
    // Phase 2: Warm up Full Engine in background
    console.log("[CUE-LOADER] Warming up Engine (Phase 2) in background...");
    manager._send('init', { wasmPath: enginePath, version: PACKAGE_VERSION, isReader: false })
        .then(() => console.log("[CUE-LOADER] Full Engine Ready (Phase 3)."))
        .catch(err => console.warn("[CUE-LOADER] Background engine failed:", err));

    return manager;
}

module.exports = { loadWasm, loadWasmWorker, Workspace };