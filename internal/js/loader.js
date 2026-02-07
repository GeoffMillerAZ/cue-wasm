// Phased Loader for CUE-WASM (ESM)
import { Workspace } from './workspace.js';
import { WorkerManager } from './worker-manager.js';

const PACKAGE_VERSION = "__VERSION__";
const BASE_CDN = `https://cdn.jsdelivr.net/npm/@geoff4lf/cue-wasm@${PACKAGE_VERSION}`;

/**
 * Traditional loader.
 */
async function loadWasm(wasmPath) {
    // Check if we are in Node.js
    if (typeof window === 'undefined') {
        // Node implementation
        const fs = await import('fs');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        const { createRequire } = await import('module');
        
        const require = createRequire(import.meta.url);
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        // Polyfill crypto for Go wasm_exec
        if (!globalThis.crypto) {
            const { webcrypto } = await import('node:crypto');
            globalThis.crypto = webcrypto;
        }

        // Load Go global if missing
        if (typeof globalThis.Go === 'undefined') {
            const wasmExecPath = path.join(__dirname, '../bin/wasm_exec.js');
            require(wasmExecPath);
        }

        const go = new globalThis.Go();
        const localPath = wasmPath || path.join(__dirname, '../bin/cue-engine.wasm');
        const wasmBytes = fs.readFileSync(localPath);
        const mod = new WebAssembly.Module(wasmBytes);
        const inst = new WebAssembly.Instance(mod, go.importObject);
        go.run(inst);
        return globalThis.CueWasm;
    } else {
        // Browser implementation
        if (typeof Go === 'undefined') {
            throw new Error("Go global not found. Please load wasm_exec.js first.");
        }
        const go = new Go();
        const url = wasmPath || `${BASE_CDN}/bin/cue-engine.wasm`;
        const result = await WebAssembly.instantiateStreaming(fetch(url), go.importObject);
        go.run(result.instance);
        return globalThis.CueWasm;
    }
}

/**
 * Phased High-Performance Loader.
 */
async function loadWasmWorker(options = {}) {
    const workerPath = options.workerPath || `${BASE_CDN}/dist/worker.js`;
    const readerPath = options.readerPath || `${BASE_CDN}/bin/cue-reader.wasm`;
    const enginePath = options.enginePath || `${BASE_CDN}/bin/cue-engine.wasm`;
    const wasmExecPath = options.wasmExecPath || `${BASE_CDN}/bin/wasm_exec.js`;

    const manager = new WorkerManager(workerPath, readerPath, PACKAGE_VERSION);
    
    await manager._send('init', { 
        wasmPath: readerPath, 
        wasmExecPath, 
        version: PACKAGE_VERSION, 
        isReader: true 
    });
    
    manager._send('init', { 
        wasmPath: enginePath, 
        wasmExecPath, 
        version: PACKAGE_VERSION, 
        isReader: false 
    }).catch(err => console.warn("[CUE-LOADER] Background engine failed:", err));

    return manager;
}

export { loadWasm, loadWasmWorker, Workspace };
