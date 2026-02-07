const { loadWasm } = await import('../../dist/index.js');

async function run() {
    try {
        console.log("Initializing CUE WASM...");
        // 1. Load the WASM engine
        const cue = await loadWasm();

        // 2. Define schema and data
        const schema = `
#User: {
    name: string
    age:  int & >=0
}
        `;

        const validData = `
alice: #User & {
    name: "Alice"
    age:  30
}
        `;

        const invalidData = `
bob: #User & {
    name: "Bob"
    age:  -5 // Fails age constraint
}
        `;

        // 3. Validate
        console.log("Validating Alice...");
        const result1 = await cue.validate(schema, validData);
        console.log("Validation Result: ✅", result1 ? "Valid" : "Invalid");

        console.log("\nValidating Bob...");
        try {
            await cue.validate(schema, invalidData);
        } catch (e) {
            console.log("Validation Result: ❌ Invalid");
            // The library returns structured errors as JSON strings
            const err = JSON.parse(e);
            console.log("Error Message:", err.message);
        }

    } catch (err) {
        console.error("Fatal Error:", err);
        process.exit(1);
    }
}

run();