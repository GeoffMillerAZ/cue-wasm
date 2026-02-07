import * as React from 'react';
import { CueWasmInstance } from '../../dist/index.d.ts';

export interface CueContextValue {
    instance: CueWasmInstance | null;
    isLoading: boolean;
    error: Error | null;
    validate: (schema: string, data: string) => Promise<boolean>;
    unify: (inputs: string[] | Record<string, string>, tags?: string[]) => Promise<string>;
    export: (code: string, format: 'json' | 'yaml' | 'cue') => Promise<string>;
    parse: (code: string) => Promise<string>;
    format: (code: string) => Promise<string>;
    getSymbols: (code: string) => Promise<Array<{name: string, type: string, line: number, column: number}>>;
}

export interface CueProviderProps {
    children: React.ReactNode;
    wasmPath?: string;
    useWorker?: boolean;
    workerOptions?: {
        workerPath?: string;
        readerPath?: string;
        enginePath?: string;
        wasmExecPath?: string;
    };
}

export function CueProvider(props: CueProviderProps): JSX.Element;
export function useCue(): CueContextValue;