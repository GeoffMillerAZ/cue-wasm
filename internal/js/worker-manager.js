/** One owner, one active call, bounded pending work. Active cancellation kills the worker. */
export class CueWorkerError extends Error {
    constructor(code, message) { super(message); this.name = 'CueWorkerError'; this.code = code; }
}
const failure = (code, message) => new CueWorkerError(code, message);
const positive = (value, fallback, maximum, name) => {
    value ??= fallback;
    if (!Number.isSafeInteger(value) || value < 1 || value > maximum) throw failure('options', `Invalid ${name}`);
    return value;
};
export class WorkerManager {
    constructor(workerPath, wasmPath, version, options = {}) {
        this.timeoutMs = positive(options.timeoutMs, 30000, 300000, 'timeoutMs');
        this.maxPending = positive(options.maxPending, 8, 64, 'maxPending');
        this.maxInputBytes = positive(options.maxInputBytes, 4 * 1024 * 1024, 16 * 1024 * 1024, 'maxInputBytes');
        this.wasmPath = wasmPath; this.packageVersion = version;
        this.callbacks = new Map(); this.queue = []; this.nextId = 1; this.active = null;
        this.state = 'loading'; this.mode = options.mode ?? 'engine';
        if (!['engine', 'reader'].includes(this.mode)) throw failure('options', 'Invalid worker mode');
        this.worker = new Worker(workerPath);
        this.worker.onmessage = ({data}) => {
            if (data?.fatal === true) return this._fail(failure('worker_failed', 'CUE runtime exited'));
            if (!data || data.id !== this.active) return;
            if (typeof data.success !== 'boolean') return this._fail(failure('protocol', 'Invalid worker response'));
            const entry = this.callbacks.get(data.id);
            if (entry.action === 'init' && data.success) this.state = 'ready';
            const error = data.success ? null : failure('evaluation', typeof data.error === 'string' ? data.error : 'CUE evaluation failed');
            if (entry.action === 'init' && error) return this._fail(error);
            this._settle(data.id, error, data.result); this._pump();
        };
        this.worker.onerror = event => { event.preventDefault?.(); this._fail(failure('worker_failed', 'CUE worker failed')); };
        this.worker.onmessageerror = () => this._fail(failure('protocol', 'CUE worker message could not be decoded'));
    }
    async init(options = {}) {
        if (this.state !== 'loading' || this.callbacks.size) throw failure('state', 'Worker initialization already started');
        return this._send('init', {wasmPath: this.wasmPath, wasmExecPath: options.wasmExecPath,
            mode: this.mode, maxInputBytes: this.maxInputBytes}, options);
    }
    unify(overlay, entryPoints = [], tags = [], options = {}) { return this._send('unify', {overlay, entryPoints, tags}, options); }
    validate(schema, data, options = {}) { return this._send('validate', {schema, data}, options); }
    export(code, format, options = {}) { return this._send('export', {code, format}, options); }
    format(code, options = {}) { return this._send('format', {code}, options); }
    getSymbols(code, options = {}) { return this._send('getSymbols', {code}, options); }
    parse(code, options = {}) { return this._send('parse', {code}, options); }
    version(options = {}) { return this._send('version', {}, options); }
    dispose() {
        if (this.state === 'disposed') return;
        this._fail(failure('disposed', 'CUE worker disposed'), 'disposed');
    }
    _settle(id, error, result) {
        const entry = this.callbacks.get(id); if (!entry) return;
        this.callbacks.delete(id); clearTimeout(entry.timer); entry.signal?.removeEventListener('abort', entry.abort);
        this.queue = this.queue.filter(key => key !== id); if (this.active === id) this.active = null;
        if (error) entry.reject(error); else entry.resolve(result);
    }
    _fail(error, state = 'failed') {
        if (this.state === 'disposed') return;
        this.state = state; this.worker.terminate();
        this.worker.onmessage = this.worker.onerror = this.worker.onmessageerror = null;
        for (const id of [...this.callbacks.keys()]) this._settle(id, error);
    }
    _pump() {
        if (this.active !== null || ['failed', 'disposed'].includes(this.state)) return;
        const id = this.queue.shift(); if (id === undefined) return;
        const entry = this.callbacks.get(id); this.active = id;
        try { this.worker.postMessage({id, action: entry.action, payload: entry.payload}); }
        catch { this._fail(failure('worker_failed', 'CUE request could not be sent')); }
    }
    _send(action, payload, options = {}) {
        try {
            if (this.state !== 'ready' && !(action === 'init' && this.state === 'loading')) throw failure('state', `CUE worker is ${this.state}`);
            if (this.mode === 'reader' && ['unify', 'validate', 'export'].includes(action)) throw failure('unsupported', 'Evaluation requires an engine worker');
            if (options.signal?.aborted) throw failure('aborted', 'CUE request aborted');
            if (this.callbacks.size >= this.maxPending) throw failure('queue_limit', 'CUE request queue is full');
            if (options.signal && (typeof options.signal.addEventListener !== 'function' || typeof options.signal.removeEventListener !== 'function')) throw failure('options', 'Invalid AbortSignal');
            const timeout = positive(options.timeoutMs, this.timeoutMs, 300000, 'timeoutMs');
            // Bound shape and UTF-8 source before postMessage cloning. No user data in errors.
            let bytes = 0, values = 0;
            const measure = (value, depth = 0) => {
                if (++values > 4096 || depth > 8) throw failure('input_limit', 'CUE input shape exceeds limits');
                if (typeof value === 'string') {
                    if (value.length > this.maxInputBytes || (bytes += new TextEncoder().encode(value).length) > this.maxInputBytes) throw failure('input_limit', 'CUE input exceeds byte limit');
                } else if (value === null || value === undefined || typeof value === 'number' || typeof value === 'boolean') return;
                else if (Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null) {
                    for (const key of Object.keys(value)) { measure(key, depth + 1); measure(value[key], depth + 1); }
                } else throw failure('input', 'CUE input must contain plain data');
            };
            measure(payload);
            if (action === 'unify' && (!payload.overlay || typeof payload.overlay !== 'object' || Object.keys(payload.overlay).length > 128 || Object.values(payload.overlay).some(v => typeof v !== 'string') || !Array.isArray(payload.entryPoints ?? []) || !Array.isArray(payload.tags ?? []) || [...payload.entryPoints ?? [], ...payload.tags ?? []].some(v => typeof v !== 'string'))) throw failure('input', 'Invalid CUE virtual files or entry points');
            if (action === 'validate' && (typeof payload.schema !== 'string' || typeof payload.data !== 'string')) throw failure('input', 'Validation requires source strings');
            if (['export', 'format', 'parse', 'getSymbols'].includes(action) && typeof payload.code !== 'string') throw failure('input', 'Operation requires a source string');
            if (action === 'export' && !['cue', 'json', 'yaml'].includes(payload.format)) throw failure('input', 'Unsupported export format');
            return new Promise((resolve, reject) => {
                const id = this.nextId++;
                const cancel = code => {
                    const error = failure(code, code === 'aborted' ? 'CUE request aborted' : 'CUE request deadline exceeded');
                    if (this.active === id) this._fail(error); else { this._settle(id, error); this._pump(); }
                };
                const entry = {action, payload: structuredClone(payload), resolve, reject, signal: options.signal, abort: () => cancel('aborted')};
                this.callbacks.set(id, entry); this.queue.push(id);
                entry.timer = setTimeout(() => cancel('timeout'), timeout);
                options.signal?.addEventListener('abort', entry.abort, {once: true}); this._pump();
            });
        } catch (error) { return Promise.reject(error); }
    }
}
