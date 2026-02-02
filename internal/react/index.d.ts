import * as React from 'react';
import { CueWasmInstance } from '../../dist/index.d.ts';

export interface CueContextValue {
    instance: CueWasmInstance | null;
    isLoading: boolean;
    error: Error | null;
    validate: (schema: string, data: string) => Promise<boolean>;
    unify: (inputs: string[] | Record<string, string>, tags?: string[]) => Promise<string>;
    export: (code: string, format: 'json' | 'yaml' | 'cue') => Promise<string>;
}

export interface CueProviderProps {
    children: React.ReactNode;
    wasmPath?: string;
}

export function CueProvider(props: CueProviderProps): JSX.Element;
export function useCue(): CueContextValue;
