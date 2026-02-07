const test = require('node:test');
const assert = require('node:assert');
const { WorkerManager } = require('../../internal/js/worker-manager.js');

test('Worker Manager - TDD Suite', async (t) => {

    await t.test('should send init message and resolve on success', async () => {
        let lastMsg = null;
        // Mock Worker
        global.Worker = class {
            constructor(path) {
                this.path = path;
                setTimeout(() => {
                    this.onmessage({ data: { id: 1, success: true } });
                }, 10);
            }
            postMessage(msg) {
                lastMsg = msg;
            }
        };

        const manager = new WorkerManager('worker.js', 'cue.wasm', '1.2.9');
        await manager.init();
        
        assert.strictEqual(lastMsg.action, 'init');
        assert.strictEqual(lastMsg.payload.wasmPath, 'cue.wasm');
    });

    await t.test('should handle worker errors gracefully', async () => {
        global.Worker = class {
            constructor() {
                setTimeout(() => {
                    this.onmessage({ data: { id: 1, success: false, error: 'WASM Panic' } });
                }, 10);
            }
            postMessage() {}
        };

        const manager = new WorkerManager('w.js', 'c.wasm', '1');
        await assert.rejects(manager.init(), /WASM Panic/);
    });

    await t.test('should route unify calls to worker', async () => {
        let sentMessage = null;
        global.Worker = class {
            constructor() {
                setTimeout(() => {
                    this.onmessage({ data: { id: 1, success: true, result: '{"a":1}' } });
                }, 10);
            }
            postMessage(msg) { sentMessage = msg; }
        };

        const manager = new WorkerManager('w.js', 'c.wasm', '1');
        const res = await manager.unify({ 'a.cue': 'a: 1' });
        
        assert.strictEqual(sentMessage.action, 'unify');
        assert.deepStrictEqual(sentMessage.payload.overlay, { 'a.cue': 'a: 1' });
        assert.strictEqual(res, '{"a":1}');
    });
});