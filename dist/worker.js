// Web Worker for CUE-WASM with Phased Loading & IndexedDB Caching
let cue = null;
let isFullEngine = false;

const DB_NAME = 'CUE_WASM_CACHE';
const STORE_NAME = 'wasm_bytes'; // Changed to bytes

/**
 * Handles incoming messages from the main thread.
 */
self.onmessage = async (event) => {
    const { id, action, payload } = event.data;

    try {
        switch (action) {
            case 'init':
                await init(payload.wasmPath, payload.wasmExecPath, payload.version, payload.isReader);
                self.postMessage({ id, success: true, isFullEngine });
                break;
            case 'unify':
            case 'validate':
                if (!isFullEngine) {
                    throw new Error("Evaluation requires the Full Engine (still loading...)");
                }
                const res = action === 'unify' 
                    ? await cue.unify(payload.overlay, payload.entryPoints, payload.tags)
                    : await cue.validate(payload.schema, payload.data);
                self.postMessage({ id, success: true, result: res });
                break;
            case 'format':
            case 'getSymbols':
            case 'parse':
                const result = action === 'format' ? await cue.format(payload.code)
                             : action === 'getSymbols' ? JSON.parse(await cue.getSymbols(payload.code))
                             : await cue.parse(payload.code);
                self.postMessage({ id, success: true, result });
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    } catch (error) {
        self.postMessage({ id, success: false, error: error.message || error.toString() });
    }
};

/**
 * Initializes the WASM engine.
 */
async function init(wasmPath, wasmExecPath, version, isReaderRequest) {
    if (typeof Go === 'undefined') {
        importScripts(wasmExecPath || './wasm_exec.js');
    }

    const go = new Go();
    const cacheKey = `${version}_${isReaderRequest ? 'reader' : 'engine'}`;
    let bytes = await getCachedBytes(cacheKey);

    let module;
    if (bytes) {
        console.log(`[CUE-WORKER] Loading cached WASM bytes (v${version})`);
        module = await WebAssembly.compile(bytes);
    } else {
        console.log(`[CUE-WORKER] Fetching WASM from network: ${wasmPath}`);
        const response = await fetch(wasmPath);
        bytes = await response.arrayBuffer();
        module = await WebAssembly.compile(bytes);
        await cacheBytes(cacheKey, bytes);
    }

    const instance = await WebAssembly.instantiate(module, go.importObject);
    go.run(instance);
    cue = self.CueWasm;
    isFullEngine = !isReaderRequest;
}

async function getCachedBytes(key) {
    return new Promise((resolve) => {
        try {
            const request = indexedDB.open(DB_NAME, 2);
            request.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE_NAME);
            request.onsuccess = (e) => {
                const db = e.target.result;
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const getReq = transaction.objectStore(STORE_NAME).get(key);
                getReq.onsuccess = () => resolve(getReq.result);
                getReq.onerror = () => resolve(null);
            };
            request.onerror = () => resolve(null);
        } catch (_) { resolve(null); }
    });
}

async function cacheBytes(key, bytes) {
    return new Promise((resolve) => {
        try {
            const request = indexedDB.open(DB_NAME, 2);
            request.onsuccess = (e) => {
                const db = e.target.result;
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                transaction.objectStore(STORE_NAME).put(bytes, key);
                transaction.oncomplete = () => resolve();
            };
        } catch (_) { resolve(); }
    });
}