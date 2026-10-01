import { loadWasm, loadWasmWorker, Workspace, CueWorkerError } from '@geoff4lf/cue-wasm';
import { Workspace as ToolsWorkspace } from '@geoff4lf/cue-wasm/tools';
import type { CueWasmInstance, CueWorkerInstance, RequestOptions, WorkerOptions, Format } from '@geoff4lf/cue-wasm';
import { CueProvider, useCue } from '@geoff4lf/cue-wasm/react';
import type { CueContextValue, CueProviderProps } from '@geoff4lf/cue-wasm/react';

const controller = new AbortController();
const request: RequestOptions = { signal: controller.signal, timeoutMs: 3000 };
const options: WorkerOptions = {
  mode: 'engine', workerPath: '/package/dist/worker.js', enginePath: '/package/bin/cue-engine.wasm',
  readerPath: '/package/bin/cue-reader.wasm', wasmExecPath: '/package/bin/wasm_exec.js',
  initializationTimeoutMs: 30000, maxPending: 8, maxInputBytes: 4096, ...request,
};
export const props: CueProviderProps = { useWorker: true, workerOptions: options };
export const element = <CueProvider {...props}><Consumer /></CueProvider>;
function Consumer() {
  const cue: CueContextValue = useCue();
  const valid: Promise<boolean> = cue.validate('a: int', 'a: 1', request);
  const unified: Promise<string> = cue.unify({ 'a.cue': 'a:1' }, ['a.cue'], [], request);
  const exported: Promise<string> = cue.export('a:1', 'json', request);
  const symbols: Promise<string> = cue.getSymbols('a:1', request);
  const parsed: Promise<string> = cue.parse('a:1', request);
  const formatted: Promise<string> = cue.format('a:1', request);
  const instance: CueWasmInstance | CueWorkerInstance | null = cue.instance;
  const error: Error | null = cue.error;
  cue.retry();
  void [valid, unified, exported, symbols, parsed, formatted, instance, error];
  return <span>{cue.isLoading ? 'loading' : 'ready'}</span>;
}
export async function publicOperations(format: Format) {
  const direct = await loadWasm('/package/bin/cue-engine.wasm');
  const worker = await loadWasmWorker(options);
  const directVersion: string = direct.version();
  const workerVersion: Promise<string> = worker.version(request);
  const result: Promise<string> = direct.export('a:1', format);
  const workspace = new Workspace();
  workspace.addFile('a.cue', 'a:1', true);
  workspace.setModule('example.test/consumer@v0');
  const diagnostics: { valid: boolean; error?: unknown } = await workspace.validateSyntax('a.cue', worker);
  const names: string[] = (await workspace.getSymbols('a.cue', direct)).map(symbol => symbol.name);
  const toolsWorkspace: Workspace = new ToolsWorkspace();
  toolsWorkspace.addFile('tools.cue', 'a:1');
  const code: string = new CueWorkerError('evaluation', 'failure').code;
  worker.dispose();
  return { directVersion, workerVersion, result, diagnostics, names, code };
}
