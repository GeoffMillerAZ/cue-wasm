import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Polyfill crypto for Node.js
if (!globalThis.crypto) {
    const { webcrypto } = await import('node:crypto');
    globalThis.crypto = webcrypto;
}

const { loadWasm } = await import('../../dist/index.js');

try {
    console.log("Running Integration Tests...");
    const cue = await loadWasm();

    // Test 1: Unify
    console.log("Test 1: Unify");
    const json = await cue.unify(["a: 1", "b: 2"]);
    const obj = JSON.parse(json);
    assert.strictEqual(obj.a, 1);
    assert.strictEqual(obj.b, 2);
    console.log("PASS: Unify");

    // Test 2: Validate Success
    console.log("Test 2: Validate (Valid)");
    const valid = await cue.validate("a: int", "a: 1");
    assert.strictEqual(valid, true);
    console.log("PASS: Validate (Valid)");

    // Test 3: Validate Fail
    console.log("Test 3: Validate (Invalid)");
    try {
        await cue.validate("a: int", "a: 'string'");
        assert.fail("Should have thrown error");
    } catch (e) {
        console.log("Caught Error:", e.toString());
        const msg = e.toString().replace("Error: ", "");
        try {
            const errObj = JSON.parse(msg);
            assert(errObj.message.includes("mismatched types"));
            console.log("PASS: Structured Error Verified");
        } catch (parseErr) {
            console.error("Failed to parse error JSON:", msg);
            throw e;
        }
    }

    // Test 4: Export YAML
    console.log("Test 4: Export YAML");
    const yaml = await cue.export("a: 1", "yaml");
    assert(yaml.includes("a: 1"));
    console.log("PASS: Export YAML");

    // Test 5: Unify with Tags
    console.log("Test 5: Unify with Tags");
    const taggedJson = await cue.unify(["a: string @tag(foo)"], null, ["foo=bar"]);
    const taggedObj = JSON.parse(taggedJson);
    assert.strictEqual(taggedObj.a, "bar");
    console.log("PASS: Unify with Tags");

    console.log("All Tests Passed!");
    process.exit(0);
} catch (err) {
    console.error("Test Failed:", err);
    process.exit(1);
}