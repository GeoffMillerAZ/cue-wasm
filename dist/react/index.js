import React from 'react';
import { loadWasm, loadWasmWorker } from '../index.js'; // Rewritten by generate-js.mjs.

const methods = ['validate', 'unify', 'export', 'parse', 'format', 'getSymbols'];
const unavailable = () => new Error('CUE runtime is unavailable; wait for readiness or retry');
const asError = error => error instanceof Error ? error : new Error(String(error));
const CueContext = React.createContext({
    instance: null, isLoading: true, error: null,
    retry: () => { throw new Error('CueProvider is required'); },
    ...Object.fromEntries(methods.map(name => [name, async () => { throw unavailable(); }])),
});

function CueProvider({ children, wasmPath, useWorker = false, workerOptions = {} }) {
    // Compare supported option values, not the caller's object identity. Inline
    // options and omitted options must not restart a provider on every render.
    const { mode, workerPath, readerPath, enginePath, wasmExecPath, signal,
        timeoutMs, initializationTimeoutMs, maxPending, maxInputBytes } = useWorker ? workerOptions : {};
    const directPath = useWorker ? undefined : wasmPath;
    const config = React.useMemo(() => ({ useWorker, wasmPath: directPath, workerOptions: {
        mode, workerPath, readerPath, enginePath, wasmExecPath, signal,
        timeoutMs, initializationTimeoutMs, maxPending, maxInputBytes,
    } }), [useWorker, directPath, mode, workerPath, readerPath, enginePath, wasmExecPath,
        signal, timeoutMs, initializationTimeoutMs, maxPending, maxInputBytes]);
    const owner = React.useRef(null);
    const [attempt, setAttempt] = React.useState(0);
    const [state, setState] = React.useState({ config: null, attempt: 0,
        session: null, isLoading: true, error: null });
    const retry = React.useCallback(() => {
        if (!owner.current?.live) return;
        owner.current.release();
        setAttempt(value => value + 1);
    }, []);

    React.useEffect(() => {
        const controller = new AbortController();
        const externalSignal = config.workerOptions.signal;
        const abort = () => controller.abort();
        const detach = () => externalSignal?.removeEventListener('abort', abort);
        const session = { live: true, instance: null, release() {
            if (!session.live) return;
            session.live = false;
            detach(); controller.abort();
            // The legacy direct Go host has no disposal contract.
            if (config.useWorker) session.instance?.dispose();
        } };
        owner.current = session;
        setState({ config, attempt, session: null, isLoading: true, error: null });
        async function start() {
            try {
                if (config.useWorker) {
                    externalSignal?.addEventListener('abort', abort, { once: true });
                    if (externalSignal?.aborted) controller.abort();
                }
                const instance = config.useWorker
                    ? await loadWasmWorker({ ...config.workerOptions, signal: controller.signal })
                    : await loadWasm(config.wasmPath);
                if (!session.live) {
                    if (config.useWorker) instance.dispose();
                    return;
                }
                session.instance = instance;
                setState({ config, attempt, session, isLoading: false, error: null });
            } catch (error) {
                if (session.live) setState({ config, attempt, session: null,
                    isLoading: false, error: asError(error) });
            } finally { detach(); }
        }
        start();
        return () => session.release();
    }, [config, attempt]);

    // Hide the previous configuration even before its effect cleanup runs.
    const current = state.config === config && state.attempt === attempt
        ? state : { session: null, isLoading: true, error: null };
    const session = current.session;
    const helpers = React.useMemo(() => Object.fromEntries(methods.map(name => [name, async (...args) => {
        if (!session?.live || owner.current !== session) throw current.error || unavailable();
        const instance = session.instance;
        try {
            if (config.useWorker && instance.state !== 'ready') throw unavailable();
            if (typeof instance[name] !== 'function') throw new Error(`CUE operation ${name} is unavailable`);
            const result = await instance[name](...args);
            // Direct calls cannot be canceled, but their retired result must not
            // escape a provider after cleanup, replacement, or retry.
            if (!session.live || owner.current !== session) throw unavailable();
            return result;
        } catch (error) {
            if (session.live && owner.current === session && config.useWorker &&
                ['failed', 'disposed'].includes(instance.state)) {
                setState({ config, attempt, session: null, isLoading: false, error: asError(error) });
            }
            throw error;
        }
    }])), [session, current.error, config, attempt]);
    return React.createElement(CueContext.Provider, { value: {
        instance: session?.instance ?? null, isLoading: current.isLoading,
        error: current.error, retry, ...helpers,
    } }, children);
}

function useCue() { return React.useContext(CueContext); }
export { CueProvider, useCue };
