import React, { StrictMode, useEffect, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { CueProvider, useCue, type CueContextValue } from '@geoff4lf/cue-wasm/react';
import type { CueWorkerInstance, WorkerOptions } from '@geoff4lf/cue-wasm';

const button = document.querySelector<HTMLButtonElement>('#run')!;
const download = document.querySelector<HTMLButtonElement>('#download')!;
const output = document.querySelector<HTMLPreElement>('#result')!;
const mount = document.querySelector<HTMLDivElement>('#mount')!;
const base = new URL('../', import.meta.url);
const asset = (path: string) => new URL(`package/${path}`, base).href;
const defaults: WorkerOptions = {
  workerPath: asset('dist/worker.js'), enginePath: asset('bin/cue-engine.wasm'),
  readerPath: asset('bin/cue-reader.wasm'), wasmExecPath: asset('bin/wasm_exec.js'),
  timeoutMs: 10000, initializationTimeoutMs: 30000, maxPending: 8,
};
function check(ok: unknown, message: string): asserts ok { if (!ok) throw Error(message); }
const tick = (ms = 15) => new Promise(resolve => setTimeout(resolve, ms));
async function wait(predicate: () => boolean, label: string) {
  const deadline = performance.now() + 35000;
  while (!predicate()) {
    if (performance.now() > deadline) throw Error(`Timed out: ${label}`);
    await tick();
  }
}
async function refused(promise: Promise<unknown>, code?: string) {
  try { await promise; } catch (error) {
    if (code) check((error as { code?: string }).code === code, `Expected ${code}, got ${String(error)}`);
    return;
  }
  throw Error(`Expected rejection${code ? ` (${code})` : ''}`);
}
type Probe = { current: CueContextValue | null; setups: number; cleanups: number; commits: number };
function Observer({ probe }: { probe: Probe }) {
  const cue = useCue();
  useLayoutEffect(() => { probe.current = cue; probe.commits++; });
  useEffect(() => { probe.setups++; return () => { probe.cleanups++; }; }, [probe]);
  return <p data-state={cue.isLoading ? 'loading' : cue.error ? 'failed' : 'ready'}>
    {cue.isLoading ? 'Loading worker' : cue.error ? `Worker failed: ${cue.error.message}` : 'Worker ready'}
  </p>;
}
function harness(container: HTMLElement) {
  const root = createRoot(container);
  const probe: Probe = { current: null, setups: 0, cleanups: 0, commits: 0 };
  let options: WorkerOptions | undefined = defaults;
  let live = true;
  const render = (...args: [WorkerOptions?, string?]) => {
    if (args.length) options = args[0];
    const wasmPath = args[1];
    flushSync(() => root.render(<StrictMode><CueProvider useWorker workerOptions={options} wasmPath={wasmPath}>
      <Observer probe={probe} />
    </CueProvider></StrictMode>));
  };
  const current = () => { check(probe.current, 'Consumer has not committed'); return probe.current; };
  return {
    root, probe, render, current,
    async ready(previous?: CueWorkerInstance) {
      await wait(() => !!probe.current?.instance && !probe.current.isLoading && probe.current.instance !== previous, 'provider readiness');
      const cue = current();
      check(!cue.error && cue.instance && 'state' in cue.instance && cue.instance.state === 'ready', 'Wrong ready contract');
      return cue.instance as CueWorkerInstance;
    },
    retry() { flushSync(() => current().retry()); },
    unmount() { if (live) { live = false; flushSync(() => root.unmount()); } },
  };
}
type Receipt = {
  schemaVersion: number; status: string; checks: string[]; error?: string;
  environment: { userAgent: string; react: string; width: number; height: number };
  workerObservation: { created: number; terminated: number; live: number };
  archiveSha256?: string; performanceQualified: boolean;
};
declare global { interface Window { reactConsumerReceipt?: Receipt; runReactConsumer?: () => Promise<Receipt> } }

async function run(): Promise<Receipt> {
  check(!button.disabled, 'Only one run is allowed');
  button.disabled = true; download.disabled = true;
  const NativeWorker = window.Worker;
  const workers: { terminated: boolean }[] = [];
  // Transparent observation only: every worker is a native dedicated Worker running
  // the unmodified installed worker/shim/WASM. No hook, message, or engine mocks.
  class ObservedWorker extends NativeWorker {
    record: { terminated: boolean };
    constructor(url: string | URL, options?: WorkerOptionsForConstructor) {
      super(url, options); this.record = { terminated: false }; workers.push(this.record);
    }
    override terminate() { this.record.terminated = true; super.terminate(); }
  }
  window.Worker = ObservedWorker;
  const owners: ReturnType<typeof harness>[] = [];
  const errors: string[] = [];
  const onError = (event: ErrorEvent) => errors.push(event.message);
  const onRejection = (event: PromiseRejectionEvent) => errors.push(String(event.reason));
  window.addEventListener('error', onError); window.addEventListener('unhandledrejection', onRejection);
  const receipt: Receipt = {
    schemaVersion: 1, status: 'running', checks: [],
    environment: { userAgent: navigator.userAgent, react: React.version, width: innerWidth, height: innerHeight },
    workerObservation: { created: 0, terminated: 0, live: 0 }, performanceQualified: false,
  };
  const liveWorkers = () => workers.filter(worker => !worker.terminated).length;
  const publish = () => {
    receipt.workerObservation = { created: workers.length, terminated: workers.length - liveWorkers(), live: liveWorkers() };
    window.reactConsumerReceipt = receipt; output.textContent = JSON.stringify(receipt, null, 2);
  };
  const stage = (name: string) => { receipt.checks.push(name); publish(); };
  const create = (container = mount) => { const h = harness(container); owners.push(h); return h; };
  try {
    const build = await fetch(new URL('build-receipt.json', base)).then(response => {
      check(response.ok, 'Build receipt unavailable'); return response.json();
    });
    receipt.archiveSha256 = build.archiveSha256;
    check(React.version === '19.2.0', 'Unexpected React version');
    let h = create(); h.render();
    let instance = await h.ready();
    check(h.probe.setups === 2 && h.probe.cleanups === 1, 'Development StrictMode did not replay effects');
    check(workers.length >= 2 && workers[0].terminated && liveWorkers() === 1, 'StrictMode initial owner was not released');
    check(JSON.parse(await h.current().unify({ 'a.cue': 'package main\nanswer: int', 'b.cue': 'package main\nanswer: 42' })).answer === 42, 'Unify result mismatch');
    check(JSON.parse(await h.current().export('answer: 42', 'json')).answer === 42, 'Export result mismatch');
    check(typeof await h.current().parse('answer: 42') === 'string', 'Parse result not text');
    check((await h.current().format('answer:42')).includes('answer'), 'Format result mismatch');
    const symbols: { name: string }[] = JSON.parse(await h.current().getSymbols('answer:42'));
    check(symbols.some(symbol => symbol.name === 'answer'), 'Symbol JSON contract mismatch');
    stage('ReactDOM StrictMode mounts actual installed engine; initial replay releases worker; all six helpers work');

    await refused(h.current().validate('answer: int', 'answer: "bad"'), 'evaluation');
    check(await h.current().validate('answer: int', 'answer: 42') === true, 'Evaluation recovery failed');
    check(h.current().instance === instance && !h.current().error, 'Source diagnostics retired healthy owner');
    stage('Invalid source rejects, subsequent valid request recovers on the same owner');

    const workerCount = workers.length;
    const stableHelper = h.current().validate;
    for (let i = 0; i < 3; i++) {
      h.render({ ...defaults }, `/ignored-direct-${i}.wasm`); await tick();
      check(h.current().instance === instance && h.current().validate === stableHelper, 'Equivalent inline options replaced owner/helpers');
    }
    check(workers.length === workerCount, 'Equivalent options allocated another worker');
    stage('Equivalent inline option values and irrelevant direct wasmPath preserve owner and helper identity');

    const retired = instance;
    h.render({ ...defaults, maxPending: 7 }); instance = await h.ready(retired);
    check(retired.state === 'disposed' && liveWorkers() === 1, 'Changed options did not retire owner');
    await refused(stableHelper('answer: int', 'answer: 42'));
    stage('Changed options replace owner; saved helpers refuse retired sessions');

    const abort = new AbortController();
    const active = refused(h.current().unify(['answer: 42'], [], [], { signal: abort.signal }), 'aborted');
    const queued = refused(h.current().parse('answer:42'), 'aborted');
    abort.abort(); await Promise.all([active, queued]);
    await wait(() => !!h.probe.current?.error && !h.probe.current.instance, 'abort error published');
    check(instance.state === 'failed' && liveWorkers() === 0, 'Abort retained runtime');
    const failed = instance; h.retry(); instance = await h.ready(failed);
    check(await h.current().validate('answer: int', 'answer: 42'), 'Retry after abort failed');
    check(failed.state === 'disposed' && liveWorkers() === 1, 'Retry leaked failed owner');
    stage('Active abort settles queued requests, publishes provider error, and retry creates a working owner');

    const beforeRetry = instance;
    const pending = refused(h.current().unify(['answer:42']), 'disposed');
    const pendingQueue = refused(h.current().parse('answer:42'), 'disposed');
    h.retry(); await Promise.all([pending, pendingQueue]); instance = await h.ready(beforeRetry);
    check(beforeRetry.state === 'disposed' && liveWorkers() === 1, 'Pending retry leaked owner');
    stage('Retry during active work settles both old promises and refuses stale completion');

    const missing = { ...defaults, enginePath: new URL('missing-engine.wasm', base).href };
    h.render(missing);
    await wait(() => !!h.probe.current?.error && !h.probe.current.isLoading, 'fetch failure');
    check(!h.current().instance && liveWorkers() === 0, 'Fetch failure left owner alive');
    await refused(h.current().validate('a:int', 'a:1'));
    const attemptsBeforeRetry = workers.length;
    h.retry();
    await wait(() => !!h.probe.current?.error && !h.probe.current.isLoading, 'retry fetch failure');
    check(workers.length === attemptsBeforeRetry + 1 && liveWorkers() === 0, 'Failed initialization did not retry/release');
    h.render({ ...defaults }); instance = await h.ready();
    check(await h.current().validate('a:int', 'a:1'), 'Recovery after corrected asset path failed');
    stage('Missing self-hosted engine reports failure; retry genuinely reloads; corrected asset options recover');

    h.render({ ...defaults, mode: 'reader' }); const reader = await h.ready(instance);
    check(reader.mode === 'reader', 'Wrong reader capability');
    check(typeof await h.current().format('a:1') === 'string', 'Reader syntax failed');
    await refused(h.current().unify(['a:1']), 'unsupported');
    check(h.current().instance === reader && !h.current().error, 'Unsupported operation destroyed reader');
    h.render({ ...defaults }); instance = await h.ready(reader);
    stage('Actual reader supports syntax and refuses evaluation; switching back loads engine');

    const secondMount = document.createElement('div'); mount.after(secondMount);
    const other = create(secondMount); other.render(); const otherInstance = await other.ready();
    check(otherInstance !== instance && liveWorkers() === 2, 'Providers share worker ownership');
    other.unmount(); secondMount.remove();
    check(otherInstance.state === 'disposed' && liveWorkers() === 1, 'Secondary unmount affected primary');
    check(await h.current().validate('a:int', 'a:1'), 'Primary failed after secondary unmount');
    stage('Simultaneous providers own separate workers; unmounting one preserves the other');

    const saved = h.current().validate;
    const unmountPending = refused(h.current().unify(['answer:42']), 'disposed');
    h.unmount(); await unmountPending; await refused(saved('a:int', 'a:1'));
    check(instance.state === 'disposed' && liveWorkers() === 0, 'Unmount retained owner');
    stage('Unmount settles active helper and prevents saved helpers from publishing late results');

    h = create(); h.render();
    check(h.current().isLoading, 'Initial loading not exposed');
    h.unmount(); const commits = h.probe.commits; await tick(100);
    check(h.probe.commits === commits && liveWorkers() === 0, 'Initialization completed after unmount');
    stage('Unmount during actual worker initialization terminates both StrictMode attempts without late commits');

    for (let cycle = 0; cycle < 3; cycle++) {
      h = create(); h.render(undefined); instance = await h.ready();
      const count = workers.length;
      h.render({}); await tick();
      check(h.current().instance === instance && workers.length === count, 'Omitted and empty options differ');
      check(await h.current().validate('a:int', 'a:1'), 'Repeated mount failed');
      h.unmount(); check(instance.state === 'disposed' && liveWorkers() === 0, 'Repeated mount leaked owner');
    }
    stage('Three StrictMode mount/evaluate/unmount cycles; omitted and empty options are equivalent; installed default URLs work');
    await tick(); check(errors.length === 0, `Unexpected browser errors: ${errors.join('; ')}`);
    receipt.status = 'passed';
  } catch (error) {
    receipt.status = 'failed'; receipt.error = String((error as Error).stack ?? error);
  } finally {
    for (const owner of owners) owner.unmount();
    if (liveWorkers()) { receipt.status = 'failed'; receipt.error = `${receipt.error ?? ''}\n${liveWorkers()} unreleased workers`; }
    window.Worker = NativeWorker;
    window.removeEventListener('error', onError); window.removeEventListener('unhandledrejection', onRejection);
    publish(); button.disabled = false; download.disabled = false;
  }
  return receipt;
}
// Avoid a collision with the package's WorkerOptions interface.
type WorkerOptionsForConstructor = ConstructorParameters<typeof Worker>[1];
window.runReactConsumer = run;
button.onclick = () => { void run(); };
download.onclick = () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(window.reactConsumerReceipt, null, 2) + '\n'], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'react-consumer-browser.json'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
