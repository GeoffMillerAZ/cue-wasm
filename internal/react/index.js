import React from 'react';
import { loadWasm, loadWasmWorker } from '../../dist/index.js'; // Fixed via build.sh

// Create Context
const CueContext = React.createContext({
    instance: null,
    isLoading: true,
    error: null,
    // Default no-op functions that warn if used before load
    validate: async () => { throw new Error("CUE WASM not loaded yet"); },
    unify: async () => { throw new Error("CUE WASM not loaded yet"); },
    export: async () => { throw new Error("CUE WASM not loaded yet"); },
    parse: async () => { throw new Error("CUE WASM not loaded yet"); },
    format: async () => { throw new Error("CUE WASM not loaded yet"); },
    getSymbols: async () => { throw new Error("CUE WASM not loaded yet"); }
});

// Singleton promise to prevent double-loading
let loadingPromise = null;

function CueProvider({ children, wasmPath, useWorker = false, workerOptions = {} }) {
    const [state, setState] = React.useState({
        instance: null,
        isLoading: true,
        error: null
    });

    React.useEffect(() => {
        if (state.instance) return;

        if (!loadingPromise) {
            loadingPromise = useWorker ? loadWasmWorker(workerOptions) : loadWasm(wasmPath);
        }

        loadingPromise
            .then(instance => {
                setState({
                    instance,
                    isLoading: false,
                    error: null
                });
            })
            .catch(err => {
                setState(prev => ({ ...prev, isLoading: false, error: err }));
            });
    }, [wasmPath, useWorker, workerOptions, state.instance]);

    // Helpers bound to the instance
    const helpers = React.useMemo(() => ({
        validate: state.instance ? state.instance.validate.bind(state.instance) : async () => {},
        unify: state.instance ? state.instance.unify.bind(state.instance) : async () => {},
        export: state.instance ? (state.instance.export ? state.instance.export.bind(state.instance) : async () => {}) : async () => {},
        parse: state.instance ? state.instance.parse.bind(state.instance) : async () => {},
        format: state.instance ? state.instance.format.bind(state.instance) : async () => {},
        getSymbols: state.instance ? state.instance.getSymbols.bind(state.instance) : async () => {},
    }), [state.instance]);

    const value = {
        ...state,
        ...helpers
    };

    return React.createElement(CueContext.Provider, { value }, children);
}

function useCue() {
    return React.useContext(CueContext);
}

export { CueProvider, useCue };