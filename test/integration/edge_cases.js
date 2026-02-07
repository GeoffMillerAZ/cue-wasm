import assert from 'assert';
const { loadWasm } = await import('../../dist/index.js');

async function run() {
    try {
        console.log("Cue WASM loaded for Edge Case Tests.");
        const cue = await loadWasm();

        // Test 1: Null/Undefined Arguments
        console.log("Test 1: Null/Undefined Arguments");
        try {
            await cue.unify(null);
            assert.fail("Should have failed with null");
        } catch (e) {
            assert(e.toString().includes("first argument"));
        }

        // Test 2: Invalid Argument Types
        console.log("Test 2: Invalid Argument Types");
        try {
            await cue.unify({ "a.cue": 123 }); // Content must be string
            assert.fail("Should have failed with invalid content type");
        } catch (e) {}

        // Test 3: Parallel Execution
        console.log("Test 3: Parallel Execution");
        const promises = Array.from({ length: 50 }, (_, i) => 
            cue.unify([`a: ${i}`])
        );
        const results = await Promise.all(promises);
        results.forEach((r, i) => {
            assert.strictEqual(JSON.parse(r).a, i);
        });
        console.log("✅ 50 Parallel Unify calls passed.");

        // Test 4: Large Input
        console.log("Test 4: Large Input");
        const largeInput = Array.from({ length: 1000 }, (_, i) => `item${i}: ${i}`).join("\n");
        const start = Date.now();
        const largeResult = await cue.unify([largeInput]);
        const end = Date.now();
        assert.strictEqual(Object.keys(JSON.parse(largeResult)).length, 1000);
        console.log(`✅ Processed 1000 items in ${end - start}ms`);

        console.log("All Edge Case Tests Passed!");
        process.exit(0);
    } catch (e) {
        console.error("Test Failed:", e);
        process.exit(1);
    }
}

run();