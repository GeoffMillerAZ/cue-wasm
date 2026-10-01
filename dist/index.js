// Phased Loader for CUE-WASM (ESM)
import {prepareVirtualFilesystem} from './runtime-environment.js';
import { Workspace } from './workspace.js';
import { WorkerManager } from './worker-manager.js';

const PACKAGE_VERSION = "1.4.5";
const BASE_CDN = `https://cdn.jsdelivr.net/npm/@geoff4lf/cue-wasm@${PACKAGE_VERSION}`;

// Go initialization can yield before publishing the bridge. Never return an old
// global or undefined as a successfully initialized instance.
function startDirectRuntime(go, instance) {
    const previous = globalThis.CueWasm;
    return new Promise((resolve, reject) => {
        let timer, settled = false;
        const deadline = Date.now() + 30000;
        const finish = (error, value) => {
            if (settled) return;
            settled = true; clearTimeout(timer);
            error ? reject(error) : resolve(value);
        };
        const poll = () => {
            const api = globalThis.CueWasm;
            if (api && api !== previous && typeof api.unify === 'function') return finish(null, api);
            if (Date.now() >= deadline) return finish(new Error('CUE direct runtime initialization timed out'));
            timer = setTimeout(poll, 1);
        };
        Promise.resolve(go.run(instance)).then(
            () => finish(new Error('CUE direct runtime exited before readiness')),
            error => finish(error instanceof Error ? error : new Error(String(error)))
        );
        poll();
    });
}

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

        prepareVirtualFilesystem();
        const go = new globalThis.Go();
        const localPath = wasmPath || path.join(__dirname, '../bin/cue-engine.wasm');
        const wasmBytes = fs.readFileSync(localPath);
        const mod = new WebAssembly.Module(wasmBytes);
        const inst = new WebAssembly.Instance(mod, go.importObject);
        return startDirectRuntime(go, inst);
    } else {
        // Browser implementation
        if (typeof Go === 'undefined') {
            throw new Error("Go global not found. Please load wasm_exec.js first.");
        }
        prepareVirtualFilesystem();
        const go = new Go();
        const url = wasmPath || `${BASE_CDN}/bin/cue-engine.wasm`;
        const result = await WebAssembly.instantiateStreaming(fetch(url), go.importObject);
        return startDirectRuntime(go, result.instance);
    }
}

/** Load one explicitly selected worker capability; resolve only when it is ready. */
async function loadWasmWorker(options = {}) {
    const mode = options.mode ?? 'engine';
    const workerPath = options.workerPath || new URL('./worker.js', import.meta.url).href;
    const wasmPath = mode === 'reader'
        ? options.readerPath || new URL('../bin/cue-reader.wasm', import.meta.url).href
        : options.enginePath || new URL('../bin/cue-engine.wasm', import.meta.url).href;
    const wasmExecPath = options.wasmExecPath || new URL('../bin/wasm_exec.js', import.meta.url).href;
    const manager = new WorkerManager(workerPath, wasmPath, PACKAGE_VERSION, {...options, mode});
    try {
        await manager.init({wasmExecPath, signal: options.signal, timeoutMs: options.initializationTimeoutMs ?? 30000});
        return manager;
    } catch (error) { manager.dispose(); throw error; }
}

export { loadWasm, loadWasmWorker, Workspace };
export { CueWorkerError } from './worker-manager.js';
