// Helper script to load the WASM in a browser or node environment
// This acts as the entry point for the NPM package.

const fs = require('fs');
const path = require('path');

// Injected during build
const PACKAGE_VERSION = "__VERSION__";
const CDN_URL = `https://cdn.jsdelivr.net/npm/@GeoffMillerAZ/cue-wasm@${PACKAGE_VERSION}/bin/cue.wasm`;

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
        // Node Environment
        // If no path provided, assume relative to this file in the package structure
        const localPath = wasmPath || path.join(__dirname, '../bin/cue.wasm');
        wasmBytes = fs.readFileSync(localPath);
    } else {
        // Browser Environment
        // If no path provided, default to CDN
        const url = wasmPath || CDN_URL;
        
        return WebAssembly.instantiateStreaming(fetch(url), go.importObject).then((result) => {
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

const { Workspace } = require('./workspace.js');

module.exports = { loadWasm, Workspace };