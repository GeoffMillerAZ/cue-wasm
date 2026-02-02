const { loadWasm } = require('../../dist/index.js');

async function run() {
    try {
        // Load the WASM runtime
        const cue = await loadWasm();
        console.log("Cue WASM loaded successfully.");

        // Define a schema
        const schema = `
        #User: {
            name: string
            age:  int & >=0
            role: "admin" | "editor" | "viewer"
        }
        
        user: #User
        `;

        // Case 1: Valid Data
        const validData = `
        user: {
            name: "Alice"
            age: 30
            role: "admin"
        }
        `;

        console.log("\n--- Validating Valid Data ---");
        const isValid = await cue.validate(schema, validData);
        console.log(`Validation Result: ${isValid ? "✅ Valid" : "❌ Invalid"}`);

        // Case 2: Invalid Data
        const invalidData = `
        user: {
            name: "Bob"
            age: -5
            role: "hacker"
        }
        `;

        console.log("\n--- Validating Invalid Data ---");
        try {
            await cue.validate(schema, invalidData);
        } catch (e) {
            console.log("❌ Validation failed as expected!");
            
            // The error from WASM is a JSON string describing the error
            let errObj;
            try {
                // If it's a JS Error object
                const msg = e instanceof Error ? e.message : e.toString();
                // Strip optional "Error: " prefix if present
                const jsonStr = msg.replace(/^Error: /, '');
                errObj = JSON.parse(jsonStr);
            } catch (parseErr) {
                // Fallback if not JSON
                errObj = { message: e.toString() };
            }

            console.log("Error Message:", errObj.message);
            
            // Check for structured error details if available
            if (errObj.line) {
                console.log(`Location: Line ${errObj.line}, Column ${errObj.column}`);
            }
        }

    } catch (err) {
        console.error("Fatal Error:", err);
        process.exit(1);
    }
}

run();
