// Dependency-free lifecycle contract harness. This does not replace a real
// React renderer/browser test (including React's concurrent scheduling).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../../internal/react/index.js', import.meta.url), 'utf8')
    .replace(/^import .*;.*$/gm, '').replace(/^export \{.*\};$/gm, '');
const deferred = () => {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
};
const tick = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };
const worker = (overrides = {}) => ({ state: 'ready', disposals: 0,
    dispose() { this.disposals++; this.state = 'disposed'; },
    unify: async () => '{"answer":42}', getSymbols: async () => '[]', ...overrides });

function harness() {
    let active;
    const calls = [];
    const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
    const React = {
        createContext: value => ({ Provider: 'provider', value }),
        createElement: (_type, props) => props.value,
        useContext: context => context.value,
        useState(initial) {
            const r = active, i = r.cursor++;
            if (!r.slots[i]) r.slots[i] = { value: initial };
            return [r.slots[i].value, value => {
                if (!r.mounted) r.lateUpdates++;
                r.slots[i].value = typeof value === 'function' ? value(r.slots[i].value) : value;
                r.dirty = true;
            }];
        },
        useRef(initial) {
            const r = active, i = r.cursor++;
            return r.slots[i] ??= { current: initial };
        },
        useMemo(fn, deps) {
            const r = active, i = r.cursor++;
            if (!same(r.slots[i]?.deps, deps)) r.slots[i] = { deps, value: fn() };
            return r.slots[i].value;
        },
        useCallback(fn, deps) { return React.useMemo(() => fn, deps); },
        useEffect(fn, deps) {
            const r = active, i = r.cursor++;
            if (!same(r.slots[i]?.deps, deps)) {
                const previous = r.slots[i];
                r.slots[i] = { deps, fn, cleanup: previous?.cleanup };
                r.effects.push(i);
            }
        },
    };
    const load = kind => options => {
        const call = { kind, options, ...deferred() };
        calls.push(call);
        return call.promise;
    };
    const api = new Function('React', 'loadWasm', 'loadWasmWorker', source + '\nreturn {CueProvider, useCue};')(
        React, load('direct'), load('worker'));
    function mount(props = {}) {
        const r = { slots: [], effects: [], cursor: 0, mounted: true, dirty: true, lateUpdates: 0, props,
            render(next = r.props) {
                r.props = next;
                let rounds = 0;
                do {
                    assert.ok(++rounds < 20, 'provider entered a render/reload loop');
                    r.dirty = false; r.cursor = 0; active = r;
                    r.value = api.CueProvider(r.props);
                    for (const i of r.effects.splice(0)) {
                        r.slots[i].cleanup?.();
                        r.slots[i].cleanup = r.slots[i].fn();
                    }
                } while (r.dirty);
                return r.value;
            },
            replayEffects() {
                for (const slot of r.slots) if (slot?.fn) { slot.cleanup?.(); slot.cleanup = slot.fn(); }
                r.render();
            },
            unmount() { r.mounted = false; for (const slot of r.slots) slot?.cleanup?.(); },
        };
        r.render();
        return r;
    }
    return { mount, calls, outside: api.useCue };
}

test('separate providers own separate workers; equal inline options do not reload', async () => {
    const h = harness(), a = h.mount({ useWorker: true, workerOptions: { maxPending: 2 } });
    const b = h.mount({ useWorker: true, workerOptions: { maxPending: 2 } });
    const wa = worker(), wb = worker();
    h.calls[0].resolve(wa); h.calls[1].resolve(wb); await tick(); a.render(); b.render();
    a.render({ useWorker: true, workerOptions: { maxPending: 2 } });
    assert.equal(h.calls.length, 2); assert.equal(a.value.instance, wa); assert.equal(b.value.instance, wb);
    a.unmount(); assert.equal(wa.disposals, 1); assert.equal(wb.disposals, 0);
    b.unmount(); assert.equal(wb.disposals, 1);
});

test('cleanup aborts initialization and disposes a late result without updating state', async () => {
    const h = harness(), r = h.mount({ useWorker: true });
    r.unmount(); assert.equal(h.calls[0].options.signal.aborted, true);
    const w = worker(); h.calls[0].resolve(w); await tick();
    assert.equal(w.disposals, 1); assert.equal(r.lateUpdates, 0);
});

test('effect replay retires the old attempt and ignores its late success', async () => {
    const h = harness(), r = h.mount({ useWorker: true });
    r.replayEffects(); assert.equal(h.calls.length, 2); assert.ok(h.calls[0].options.signal.aborted);
    const old = worker(), fresh = worker();
    h.calls[1].resolve(fresh); h.calls[0].resolve(old); await tick(); r.render();
    assert.equal(r.value.instance, fresh); assert.equal(old.disposals, 1); r.unmount();
});

test('failed initialization exposes an error; retry creates a fresh owned attempt', async () => {
    const h = harness(), r = h.mount({ useWorker: true });
    h.calls[0].reject('load failed'); await tick(); r.render();
    assert.equal(r.value.isLoading, false); assert.equal(r.value.error.message, 'load failed');
    await assert.rejects(r.value.unify(['a: 1']), /load failed/);
    r.value.retry(); r.render(); assert.equal(h.calls.length, 2); assert.equal(r.value.error, null);
    const w = worker(); h.calls[1].resolve(w); await tick(); r.render();
    assert.equal(r.value.instance, w); r.unmount();
});

test('configuration change disposes ready worker, invalidates retained helpers, and forwards options', async () => {
    const h = harness(), r = h.mount({ useWorker: true });
    const w = worker(); h.calls[0].resolve(w); await tick(); r.render(); const oldHelper = r.value.unify;
    r.render({ useWorker: true, workerOptions: { mode: 'reader', enginePath: '/new.wasm',
        initializationTimeoutMs: 123, timeoutMs: 456, maxPending: 2, maxInputBytes: 789 } });
    assert.equal(w.disposals, 1); await assert.rejects(oldHelper(['a: 1']), /unavailable/);
    assert.equal(r.value.instance, null); assert.equal(r.value.isLoading, true);
    assert.equal(h.calls[1].options.mode, 'reader'); assert.equal(h.calls[1].options.enginePath, '/new.wasm');
    assert.equal(h.calls[1].options.initializationTimeoutMs, 123); assert.equal(h.calls[1].options.timeoutMs, 456);
    assert.equal(h.calls[1].options.maxPending, 2); assert.equal(h.calls[1].options.maxInputBytes, 789);
    r.unmount();
});

test('helpers reject outside a provider, before readiness, and when a method is absent', async () => {
    const h = harness(); await assert.rejects(h.outside().format('a: 1'), /unavailable/);
    const r = h.mount(); await assert.rejects(r.value.format('a: 1'), /unavailable/);
    h.calls[0].resolve({}); await tick(); r.render();
    await assert.rejects(r.value.format('a: 1'), /operation format is unavailable/); r.unmount();
});

test('helper signatures preserve entry points, tags, request options, this, and JSON symbols', async () => {
    const h = harness(), r = h.mount({ useWorker: true });
    let received;
    const w = worker({ async unify(...args) { assert.equal(this, w); received = args; return '{}'; } });
    h.calls[0].resolve(w); await tick(); r.render();
    const args = [{ '/a.cue': 'a: 1' }, ['/a.cue'], ['env=dev'], { timeoutMs: 10 }];
    assert.equal(await r.value.unify(...args), '{}'); assert.deepEqual(received, args);
    assert.equal(await r.value.getSymbols('a: 1'), '[]'); r.unmount();
});

test('legacy direct calls reject late success after unmount without pretending to dispose Go', async () => {
    const h = harness(), r = h.mount({ wasmPath: '/legacy.wasm' }), pending = deferred();
    assert.equal(h.calls[0].kind, 'direct'); assert.equal(h.calls[0].options, '/legacy.wasm');
    h.calls[0].resolve({ unify: () => pending.promise }); await tick(); r.render();
    const result = r.value.unify(['a: 1']); r.unmount(); pending.resolve('{}');
    await assert.rejects(result, /unavailable/); assert.equal(r.lateUpdates, 0);
});

test('retry immediately retires retained helpers and pending results', async () => {
    const h = harness(), r = h.mount({ useWorker: true }), pending = deferred();
    const w = worker({ unify: () => pending.promise }); h.calls[0].resolve(w); await tick(); r.render();
    const oldHelper = r.value.unify, result = oldHelper(['a: 1']); r.value.retry();
    assert.equal(w.disposals, 1); await assert.rejects(oldHelper(['a: 2']), /unavailable/);
    pending.resolve('{}'); await assert.rejects(result, /unavailable/);
    r.render(); assert.equal(h.calls.length, 2); r.unmount();
});

test('external signal cancels initialization; provider cleanup does not abort caller controller', async () => {
    const h = harness(), controller = new AbortController();
    const r = h.mount({ useWorker: true, workerOptions: { signal: controller.signal } });
    controller.abort(); assert.ok(h.calls[0].options.signal.aborted); r.unmount();
    const other = new AbortController(), s = h.mount({ useWorker: true, workerOptions: { signal: other.signal } });
    s.unmount(); assert.equal(other.signal.aborted, false); assert.ok(h.calls[1].options.signal.aborted);
});

test('terminal worker request failure reaches context error and permits retry', async () => {
    const h = harness(), r = h.mount({ useWorker: true });
    const w = worker({ async unify() { this.state = 'failed'; throw new Error('worker crashed'); } });
    h.calls[0].resolve(w); await tick(); r.render();
    await assert.rejects(r.value.unify(['a: 1']), /worker crashed/); r.render();
    assert.equal(r.value.instance, null); assert.equal(r.value.error.message, 'worker crashed');
    r.value.retry(); r.render(); assert.equal(w.disposals, 1); assert.equal(h.calls.length, 2); r.unmount();
});

test('an idle worker failure becomes provider error on the next helper call', async () => {
    const h = harness(), r = h.mount({ useWorker: true });
    const w = worker(); h.calls[0].resolve(w); await tick(); r.render(); w.state = 'failed';
    await assert.rejects(r.value.unify(['a: 1']), /unavailable/); r.render();
    assert.equal(r.value.instance, null); assert.match(r.value.error.message, /unavailable/); r.unmount();
});

test('initialization signal is detached at readiness and pre-aborted signals are forwarded', async () => {
    const h = harness(), controller = new AbortController();
    const r = h.mount({ useWorker: true, workerOptions: { signal: controller.signal } });
    h.calls[0].resolve(worker()); await tick(); r.render(); controller.abort();
    assert.equal(h.calls[0].options.signal.aborted, false); r.unmount();
    const s = h.mount({ useWorker: true, workerOptions: { signal: controller.signal } });
    assert.equal(h.calls[1].options.signal.aborted, true); s.unmount();
});
