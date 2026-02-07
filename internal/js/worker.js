// Web Worker for CUE-WASM with IndexedDB Caching
// Offloads heavy computation and WASM compilation.

let cue = null;
const DB_NAME = 'CUE_WASM_CACHE';
const STORE_NAME = 'wasm_modules';

/**
 * Handles incoming messages from the main thread.
 */
self.onmessage = async (event) => {
    const { id, action, payload } = event.data;

    try {
        switch (action) {
            case 'init':
                await init(payload.wasmPath, payload.version);
                self.postMessage({ id, success: true });
                break;
            case 'unify':
                const result = await cue.unify(payload.overlay, payload.entryPoints, payload.tags);
                self.postMessage({ id, success: true, result });
                break;
            case 'validate':
                const isValid = await cue.validate(payload.schema, payload.data);
                self.postMessage({ id, success: true, result: isValid });
                break;
            case 'format':
                const formatted = await cue.format(payload.code);
                self.postMessage({ id, success: true, result: formatted });
                break;
            case 'getSymbols':
                const symbols = await cue.getSymbols(payload.code);
                self.postMessage({ id, success: true, result: JSON.parse(symbols) });
                break;
            case 'parse':
                const parseRes = await cue.parse(payload.code);
                self.postMessage({ id, success: true, result: parseRes });
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    } catch (error) {
        self.postMessage({ id, success: false, error: error.message || error.toString() });
    }
};

/**
 * Initializes the WASM engine with IndexedDB caching.
 */
async function init(wasmPath, version) {
    if (typeof Go === 'undefined') {
        importScripts('./wasm_exec.js');
    }

    const go = new Go();
    let module = await getCachedModule(version);

    if (module) {
        console.log(`[CUE-WORKER] Loading cached WASM module (v${version})`);
    } else {
        console.log(`[CUE-WORKER] Compiling WASM from network...`);
        const response = await fetch(wasmPath);
        if (!WebAssembly.compileStreaming) {
            const bytes = await response.arrayBuffer();
            module = await WebAssembly.compile(bytes);
        } else {
            module = await WebAssembly.compileStreaming(response);
        }
        await cacheModule(version, module);
    }

    const instance = await WebAssembly.instantiate(module, go.importObject);
    go.run(instance);
    cue = self.CueWasm;
}

/**
 * Retrieves a compiled WebAssembly.Module from IndexedDB.
 */
async function getCachedModule(version) {
    return new Promise((resolve) => {
        try {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE_NAME);
            request.onsuccess = (e) => {
                const db = e.target.result;
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const getReq = store.get(version);
                getReq.onsuccess = () => resolve(getReq.result);
                getReq.onerror = () => resolve(null);
            };
            request.onerror = () => resolve(null);
        } catch (_) {
            resolve(null);
        }
    });
}

/**
 * Stores a compiled WebAssembly.Module in IndexedDB.
 */
async function cacheModule(version, module) {
    return new Promise((resolve) => {
        try {
            const request = indexedDB.open(DB_NAME, 1);
            request.onsuccess = (e) => {
                const db = e.target.result;
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                // Clear old versions
                store.clear();
                store.put(module, version);
                transaction.oncomplete = () => resolve();
            };
        } catch (_) {
            resolve();
        }
    });
}