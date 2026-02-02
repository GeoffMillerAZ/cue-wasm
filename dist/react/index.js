const React = require('react');
const { loadWasm } = require('../index.js'); // Relative to where this file ends up in dist/

// Create Context
const CueContext = React.createContext({
    instance: null,
    isLoading: true,
    error: null,
    // Default no-op functions that warn if used before load
    validate: async () => { throw new Error("CUE WASM not loaded yet"); },
    unify: async () => { throw new Error("CUE WASM not loaded yet"); },
    export: async () => { throw new Error("CUE WASM not loaded yet"); }
});

// Singleton promise to prevent double-loading
let loadingPromise = null;

function CueProvider({ children, wasmPath }) {
    const [state, setState] = React.useState({
        instance: null,
        isLoading: true,
        error: null
    });

    React.useEffect(() => {
        if (state.instance) return;

        if (!loadingPromise) {
            loadingPromise = loadWasm(wasmPath);
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
    }, [wasmPath, state.instance]);

    // Helpers bound to the instance
    const helpers = React.useMemo(() => ({
        validate: state.instance ? state.instance.validate.bind(state.instance) : async () => {},
        unify: state.instance ? state.instance.unify.bind(state.instance) : async () => {},
        export: state.instance ? state.instance.export.bind(state.instance) : async () => {},
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

module.exports = { CueProvider, useCue };
