export interface CueError { message: string; details?: string; line?: number; column?: number; file?: string; }
export type Format = 'json' | 'yaml' | 'cue';
export type VirtualFiles = string[] | Record<string, string>;
export interface CueSymbol { name: string; type: string; line: number; column: number; }
/** Direct Go bridge: source diagnostics may reject as strings. getSymbols returns JSON text. */
export interface CueWasmInstance {
    unify(files: VirtualFiles, entryPoints?: string[] | null, tags?: string[] | null): Promise<string>;
    validate(schema: string, data: string): Promise<boolean>;
    export(code: string, format: Format): Promise<string>;
    parse(code: string): Promise<string>;
    format(code: string): Promise<string>;
    getSymbols(code: string): Promise<string>;
    /** Package bridge version; not the underlying CUE SDK version. */
    version(): string;
}
export interface RequestOptions { signal?: AbortSignal; timeoutMs?: number; }
export interface WorkerOptions extends RequestOptions {
    mode?: 'engine' | 'reader';
    workerPath?: string; readerPath?: string; enginePath?: string; wasmExecPath?: string;
    initializationTimeoutMs?: number; maxPending?: number; maxInputBytes?: number;
}
export class CueWorkerError extends Error { constructor(code: string, message: string); code: string; }
export interface CueWorkerInstance {
    readonly state: 'loading' | 'ready' | 'failed' | 'disposed';
    readonly mode: 'engine' | 'reader';
    unify(files: VirtualFiles, entryPoints?: string[] | null, tags?: string[] | null, options?: RequestOptions): Promise<string>;
    validate(schema: string, data: string, options?: RequestOptions): Promise<boolean>;
    export(code: string, format: Format, options?: RequestOptions): Promise<string>;
    parse(code: string, options?: RequestOptions): Promise<string>;
    format(code: string, options?: RequestOptions): Promise<string>;
    getSymbols(code: string, options?: RequestOptions): Promise<string>;
    version(options?: RequestOptions): Promise<string>;
    dispose(): void;
}
/** Direct loading does not offer hard cancellation/disposal; use a worker for owned browser evaluation. */
export function loadWasm(wasmPath?: string): Promise<CueWasmInstance>;
/** Resolves at the selected capability's readiness. Default URLs resolve beside the installed module. */
export function loadWasmWorker(options?: WorkerOptions): Promise<CueWorkerInstance>;
export class Workspace {
    constructor();
    addFile(path: string, content: string, isEntryPoint?: boolean): void;
    removeFile(path: string): void;
    getEntryPoints(): string[];
    getOverlay(): Record<string,string>;
    validateSyntax(path: string, cue: CueWasmInstance | CueWorkerInstance): Promise<{valid: boolean; error?: unknown}>;
    formatFile(path: string, cue: CueWasmInstance | CueWorkerInstance): Promise<string>;
    getSymbols(path: string, cue: CueWasmInstance | CueWorkerInstance): Promise<CueSymbol[]>;
    clear(): void;
    setModule(name: string, version?: string): void;
}
declare global { const CueWasm: CueWasmInstance; }
