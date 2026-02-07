// Helper script to load the WASM in a browser or node environment
const fs = require('fs');
const path = require('path');
const { Workspace } = require('./workspace.js');
const { WorkerManager } = require('./worker-manager.js');

const PACKAGE_VERSION = "__VERSION__";
const CDN_URL = `https://cdn.jsdelivr.net/npm/@geoff4lf/cue-wasm@${PACKAGE_VERSION}/bin/cue.wasm`;

/**
 * Traditional synchronous (Node) or streaming (Browser) loader.
 * Runs on the main thread.
 */
function loadWasm(wasmPath) {
    if (typeof Go === 'undefined') {
        if (!globalThis.crypto) {
            globalThis.crypto = {
                getRandomValues: (arr) => require("crypto").randomFillSync(arr)
            };
        }
        try {
            require('../bin/wasm_exec.js');
        } catch (e) {
            throw new Error("Go global not found. Please load wasm_exec.js first.");
        }
    }

    const go = new Go();
    if (typeof window === 'undefined') {
        const localPath = wasmPath || path.join(__dirname, '../bin/cue.wasm');
        const wasmBytes = fs.readFileSync(localPath);
        const mod = new WebAssembly.Module(wasmBytes);
        const inst = new WebAssembly.Instance(mod, go.importObject);
        go.run(inst);
        return global.CueWasm;
    } else {
        const url = wasmPath || CDN_URL;
        return WebAssembly.instantiateStreaming(fetch(url), go.importObject).then((result) => {
            go.run(result.instance);
            return global.CueWasm;
        });
    }
}

/**
 * High-performance Web Worker loader with IndexedDB caching.
 * Prevents UI jank and enables instant reloads.
 */
async function loadWasmWorker(options = {}) {
    if (typeof window === 'undefined') {
        throw new Error("loadWasmWorker is only supported in browser environments.");
    }

    const workerPath = options.workerPath || `https://cdn.jsdelivr.net/npm/@geoff4lf/cue-wasm@${PACKAGE_VERSION}/dist/worker.js`;
    const wasmPath = options.wasmPath || CDN_URL;
    
    const manager = new WorkerManager(workerPath, wasmPath, PACKAGE_VERSION);
    await manager.init();
    return manager;
}

module.exports = { loadWasm, loadWasmWorker, Workspace };
