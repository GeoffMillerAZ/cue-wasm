import { loadWasm, loadWasmWorker } from '@geoff4lf/cue-wasm';
import { CueProvider, useCue } from '@geoff4lf/cue-wasm/react';

// @ts-expect-error Unsupported capability must be rejected by public declarations.
void loadWasmWorker({ mode: 'syntax' });
// @ts-expect-error Initialization takes an AbortSignal, not an AbortController.
void loadWasmWorker({ signal: new AbortController() });
// @ts-expect-error Queue bounds are numeric.
void loadWasmWorker({ maxPending: '8' });
// @ts-expect-error The optional React provider requires a boolean selector.
export const badProvider = <CueProvider useWorker="yes" />;
export async function rejectedUsages() {
  const cue = useCue();
  // @ts-expect-error Result is JSON text, not a decoded object.
  const decoded: { a: number } = await cue.unify(['a:1']);
  // @ts-expect-error getSymbols returns JSON text, not a decoded array.
  const symbols: unknown[] = await cue.getSymbols('a:1');
  // @ts-expect-error CUE cannot export this format.
  await cue.export('a:1', 'xml');
  // @ts-expect-error Request deadline must be numeric.
  await cue.parse('a:1', { timeoutMs: 'fast' });
  // @ts-expect-error Virtual file source values must be strings.
  await cue.unify({ 'a.cue': 123 });
  const worker = await loadWasmWorker();
  // @ts-expect-error Worker version is asynchronous.
  const version: string = worker.version();
  const direct = await loadWasm();
  // @ts-expect-error Direct runtimes do not have worker disposal.
  direct.dispose();
  // @ts-expect-error Direct calls do not accept cancellation options.
  await direct.parse('a:1', { signal: new AbortController().signal });
  void [decoded, symbols, version];
}
