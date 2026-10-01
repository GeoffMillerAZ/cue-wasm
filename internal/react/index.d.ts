import * as React from 'react';
import type { CueWasmInstance, CueWorkerInstance, WorkerOptions } from '../../dist/index.js';

export interface CueContextValue {
    instance: CueWasmInstance | CueWorkerInstance | null;
    isLoading: boolean;
    error: Error | null;
    /** Retire the current attempt and load a fresh provider-owned instance. */
    retry(): void;
    /** Request cancellation/deadlines apply only when useWorker is enabled. */
    validate: CueWorkerInstance['validate'];
    unify: CueWorkerInstance['unify'];
    export: CueWorkerInstance['export'];
    parse: CueWorkerInstance['parse'];
    format: CueWorkerInstance['format'];
    /** JSON text, matching the direct and worker bridges. */
    getSymbols: CueWorkerInstance['getSymbols'];
}

export interface CueProviderProps {
    children?: React.ReactNode;
    /** Legacy direct-loader path. Worker asset paths belong in workerOptions. */
    wasmPath?: string;
    /** Recommended for cancellation and cleanup. Defaults to legacy direct loading,
     * whose Go host cannot be disposed or interrupted by this provider. */
    useWorker?: boolean;
    /** Equivalent option values preserve the current instance; changes reload it.
     * signal cancels initialization. Use helper request options for later calls. */
    workerOptions?: WorkerOptions;
}

export function CueProvider(props: CueProviderProps): React.ReactElement;
export function useCue(): CueContextValue;
