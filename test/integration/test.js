const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Polyfill crypto for Node.js
if (!globalThis.crypto) {
    globalThis.crypto = {
        getRandomValues: (arr) => require("crypto").randomFillSync(arr)
    };
}

// 1. Load WASM Exec Shim
// Note: In a real CI env, we'd find this dynamically. 
// For now, we assume build.sh copied it to ../bin/
require('../../bin/wasm_exec.js');

const go = new Go();

// 2. Load WASM Module
const wasmPath = path.join(__dirname, '../../bin/cue.wasm');
const wasmBuffer = fs.readFileSync(wasmPath);

WebAssembly.instantiate(wasmBuffer, go.importObject).then(async (result) => {
    // 3. Run Go Program (It blocks, so we don't await it yet if we want to interact... 
    // BUT our main() blocks with select{}, so we DO run it, but we need it to initialize global scope first.
    // The standard Go WASM model is tricky here. 
    // Usually, we run it, and it registers callbacks.
    go.run(result.instance);
    
    // NOTE: Because our main() blocks forever with select{}, this promise technically never resolves.
    // We need to rely on the fact that `go.run` starts, registers functions, and then blocks.
    // However, in Node, `go.run` might block the event loop if not careful.
    // Actually, `go.run` will run until the Go program exits. Our Go program never exits.
    // This is fine for Browsers (event loop). In Node, we might need a workaround or 
    // structure the Go code to exit after setup if we weren't using callbacks.
    // BUT since we ARE using callbacks, we need the Go runtime alive.
});

// Wait for WASM to initialize (Hack for PoC, better way exists via signals)
setTimeout(async () => {
    try {
        console.log("Running Integration Tests...");

        // Test 1: Unify
        console.log("Test 1: Unify");
        const json = await CueWasm.unify(["a: 1", "b: 2"]);
        const obj = JSON.parse(json);
        assert.strictEqual(obj.a, 1);
        assert.strictEqual(obj.b, 2);
        console.log("PASS: Unify");

        // Test 2: Validate Success
        console.log("Test 2: Validate (Valid)");
        const valid = await CueWasm.validate("a: int", "a: 1");
        assert.strictEqual(valid, true);
        console.log("PASS: Validate (Valid)");

        // Test 3: Validate Fail
        console.log("Test 3: Validate (Invalid)");
        try {
            await CueWasm.validate("a: int", "a: 'string'");
            assert.fail("Should have thrown error");
        } catch (e) {
            console.log("Caught Error:", e.toString());
            // It might be wrapped in "Error: ..." string by Go-WASM bridge,
            // or return the string directly. Let's inspect.
            // If it's JSON, we can try to parse it.
            const msg = e.toString().replace("Error: ", "");
            try {
                const errObj = JSON.parse(msg);
                assert(errObj.message.includes("mismatched types"));
                console.log("PASS: Structured Error Verified");
            } catch (parseErr) {
                // If not JSON, fail
                console.error("Failed to parse error JSON:", msg);
                throw e;
            }
        }

        // Test 4: Export YAML
        console.log("Test 4: Export YAML");
        const yaml = await CueWasm.export("a: 1", "yaml");
        assert(yaml.includes("a: 1"));
        console.log("PASS: Export YAML");

        // Test 5: Unify with Tags
        console.log("Test 5: Unify with Tags");
        const taggedJson = await CueWasm.unify(["a: string @tag(foo)"], null, ["foo=bar"]);
        const taggedObj = JSON.parse(taggedJson);
        assert.strictEqual(taggedObj.a, "bar");
        console.log("PASS: Unify with Tags");

        console.log("All Tests Passed!");
        process.exit(0);
    } catch (err) {
        console.error("Test Failed:", err);
        process.exit(1);
    }
}, 500);
