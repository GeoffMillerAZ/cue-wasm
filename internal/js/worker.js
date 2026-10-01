// One Go runtime per dedicated worker. Browser HTTP caching remains available;
// custom IndexedDB byte caching is deliberately absent until bounded and verified.
let cue = null, mode = null, initializing = false;
self.onmessage = async ({data}) => {
    const {id, action, payload} = data ?? {};
    try {
        let result;
        if (action === 'init') {
            if (cue || initializing) throw new Error('Worker initialization already started');
            if (!['reader', 'engine'].includes(payload.mode)) throw new Error('Invalid worker mode');
            initializing = true;
            importScripts(payload.wasmExecPath);
            prepareVirtualFilesystem();
            const response = await fetch(payload.wasmPath);
            if (!response.ok) throw new Error(`WASM asset fetch failed (${response.status})`);
            const limit = 64 * 1024 * 1024;
            if (Number(response.headers.get('content-length')) > limit) throw new Error('WASM asset exceeds limit');
            const chunks = []; let length = 0;
            const reader = response.body?.getReader();
            if (!reader) throw new Error('WASM asset stream unavailable');
            try {
                for (;;) { const part = await reader.read(); if (part.done) break;
                    length += part.value.length; if (length > limit) throw new Error('WASM asset exceeds limit'); chunks.push(part.value);
                }
            } catch (error) { await reader.cancel().catch(() => {}); throw error; }
            finally { reader.releaseLock(); }
            const bytes = new Uint8Array(length); let offset = 0;
            for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
            const go = new Go(), compiled = await WebAssembly.instantiate(bytes, go.importObject);
            go.run(compiled.instance).then(() => { cue = null; self.postMessage({fatal: true}); }, () => { cue = null; self.postMessage({fatal: true}); });
            cue = self.CueWasm;
            if (!cue || typeof cue.unify !== 'function') throw new Error('CUE runtime did not expose its API');
            mode = payload.mode; result = {mode};
        } else {
            if (!cue) throw new Error('CUE worker is not ready');
            if (mode === 'reader' && ['unify', 'validate', 'export'].includes(action)) throw new Error('Evaluation requires an engine worker');
            switch (action) {
                case 'unify': result = await cue.unify(payload.overlay, payload.entryPoints, payload.tags); break;
                case 'validate': result = await cue.validate(payload.schema, payload.data); break;
                case 'export': result = await cue.export(payload.code, payload.format); break;
                case 'format': result = await cue.format(payload.code); break;
                case 'parse': result = await cue.parse(payload.code); break;
                case 'getSymbols': result = await cue.getSymbols(payload.code); break;
                case 'version': result = cue.version(); break;
                default: throw new Error('Unsupported CUE operation');
            }
        }
        self.postMessage({id, success: true, result});
    } catch (error) {
        self.postMessage({id, success: false, error: error?.message || String(error)});
    }
};
