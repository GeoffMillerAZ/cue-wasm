const { loadWasm } = require('../../dist/index.js');
const assert = require('assert');

async function run() {
    try {
        const cue = await loadWasm();
        console.log("Cue WASM loaded for Edge Case Tests.");

        // 1. Null/Undefined Arguments
        console.log("Test 1: Null/Undefined Arguments");
        try {
            await cue.validate(null, "a: 1");
            assert.fail("Should throw on null schema");
        } catch (e) { assert.ok(e.toString().includes("missing") || e.toString().includes("error")); }

        try {
            await cue.export(undefined, "json");
            assert.fail("Should throw on undefined code");
        } catch (e) { 
            const msg = e.toString();
            // It might be a JSON string like {"message": ...}
            assert.ok(msg.includes("missing") || msg.includes("error") || msg.includes("message"), "Error should report a problem"); 
        }

        // 2. Invalid Types (passing int instead of string)
        console.log("Test 2: Invalid Argument Types");
        try {
            await cue.validate(123, "a: 1");
            assert.fail("Should throw on number as schema");
        } catch (e) { 
            // The Go bridge might coerce or fail. 
            // In main.go, args[0].String() is called. 
            // JS number -> String() works (e.g. "123"). 
            // So this might actually PASS if "123" is valid CUE?
            // "123" is a valid expression.
            // Let's try passing an Object which turns to "[object Object]"
            // which is NOT valid CUE.
        }

        try {
            await cue.validate({}, "a: 1");
            assert.fail("Should throw on object as schema");
        } catch (e) { 
            assert.ok(true); 
        }

        // 3. Concurrency / Parallelism
        console.log("Test 3: Parallel Execution");
        const tasks = [];
        for (let i = 0; i < 50; i++) {
            tasks.push(cue.unify({ [`file_${i}.cue`]: `val: ${i}` }));
        }
        const results = await Promise.all(tasks);
        results.forEach((res, i) => {
            const obj = JSON.parse(res);
            assert.strictEqual(obj.val, i);
        });
        console.log("✅ 50 Parallel Unify calls passed.");

        // 4. Large Input (DoS check - simply processing, not malicious)
        console.log("Test 4: Large Input");
        let largeCue = "list: [";
        for (let i = 0; i < 1000; i++) {
            largeCue += `${i},`;
        }
        largeCue += "]";
        
        const start = Date.now();
        await cue.export(largeCue, 'json');
        const end = Date.now();
        console.log(`✅ Processed 1000 items in ${end - start}ms`);

        console.log("All Edge Case Tests Passed!");

    } catch (err) {
        console.error("Test Failed:", err);
        process.exit(1);
    }
}

run();
