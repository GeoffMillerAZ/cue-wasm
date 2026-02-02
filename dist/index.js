// Helper script to load the WASM in a browser or node environment
// This acts as the entry point for the NPM package.

const fs = require('fs');
const path = require('path');

// In a real build, we might inline wasm_exec.js or expect it to be global.
// For this package, we assume the user sets up the Go global via the provided wasm_exec.js
// or we require it if we detect node.

function loadWasm(wasmPath) {
    if (typeof Go === 'undefined') {
        // Polyfill crypto for Node.js < 19 (or where globalThis.crypto is missing)
        if (!globalThis.crypto) {
            globalThis.crypto = {
                getRandomValues: (arr) => require("crypto").randomFillSync(arr)
            };
        }

        // Try to load local wasm_exec if in Node
        try {
            require('../bin/wasm_exec.js');
        } catch (e) {
            throw new Error("Go global not found. Please load wasm_exec.js first.");
        }
    }

    const go = new Go();
    let wasmBytes;

    if (typeof window === 'undefined') {
        // Node
        wasmBytes = fs.readFileSync(wasmPath || path.join(__dirname, '../bin/cue.wasm'));
    } else {
        // Browser - return a fetch promise
        if (!wasmPath) {
             throw new Error("Must provide path to cue.wasm in browser");
        }
        return WebAssembly.instantiateStreaming(fetch(wasmPath), go.importObject).then((result) => {
            go.run(result.instance);
            return global.CueWasm;
        });
    }

    // Node Sync Load
    const mod = new WebAssembly.Module(wasmBytes);
    const inst = new WebAssembly.Instance(mod, go.importObject);
    go.run(inst);
    return global.CueWasm;
}

module.exports = { loadWasm };
