/**
 * WorkerManager handles communication with the CUE Web Worker.
 * It provides a Promise-based API that mirrors the WASM engine.
 */
class WorkerManager {
    constructor(workerPath, wasmPath, version) {
        this.worker = new Worker(workerPath);
        this.wasmPath = wasmPath;
        this.version = version;
        this.callbacks = new Map();
        this.nextId = 1;

        this.worker.onmessage = (event) => {
            const { id, success, result, error } = event.data;
            const callback = this.callbacks.get(id);
            if (callback) {
                this.callbacks.delete(id);
                if (success) callback.resolve(result);
                else callback.reject(new Error(error));
            }
        };
    }

    async init() {
        return this._send('init', { wasmPath: this.wasmPath, version: this.version });
    }

    async unify(overlay, entryPoints = [], tags = []) {
        return this._send('unify', { overlay, entryPoints, tags });
    }

    async validate(schema, data) {
        return this._send('validate', { schema, data });
    }

    async format(code) {
        return this._send('format', { code });
    }

    async getSymbols(code) {
        return this._send('getSymbols', { code });
    }

    async parse(code) {
        return this._send('parse', { code });
    }

    _send(action, payload) {
        return new Promise((resolve, reject) => {
            const id = this.nextId++;
            this.callbacks.set(id, { resolve, reject });
            this.worker.postMessage({ id, action, payload });
        });
    }
}

module.exports = { WorkerManager };
