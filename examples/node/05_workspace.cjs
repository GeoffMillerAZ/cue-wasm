const { loadWasm, Workspace } = require('../../dist/index.js');

async function run() {
    try {
        console.log("Initializing CUE WASM...");
        const cue = await loadWasm();
        
        const ws = new Workspace();
        
        console.log("\n--- Step 1: Setting up multi-file project ---");
        ws.addFile('schema.cue', `
package main
#User: {
    name: string
    age:  int & >=0
}
        `, true); // Schema is an entry point
        
        ws.addFile('data.cue', `
package main
alice: #User & {
    name: "Alice"
    age:  30
}
        `, true); // Alice is an entry point

        console.log("Unifying files...");
        const result = await cue.unify(ws.getOverlay(), ws.getEntryPoints());
        console.log("Result:", JSON.parse(result));

        console.log("\n--- Step 2: Testing Syntax Validation ---");
        const syntaxCheck = await ws.validateSyntax('data.cue', cue);
        console.log("data.cue syntax valid?", syntaxCheck.valid);

        ws.addFile('broken.cue', 'user { name "missing-colon" }');
        const brokenCheck = await ws.validateSyntax('broken.cue', cue);
        console.log("broken.cue syntax valid?", brokenCheck.valid);
        if (!brokenCheck.valid) {
            console.log("Error caught:", brokenCheck.error.message, "at line", brokenCheck.error.line);
        }

        console.log("\n--- Step 3: Testing Auto-Formatting ---");
        const messyCode = `
// User definition
user: {
name:    "bob"
age: 25
}
        `;
        ws.addFile('messy.cue', messyCode);
        const formatted = await ws.formatFile('messy.cue', cue);
        console.log("Formatted Code:\n", formatted);

        console.log("\n--- Step 4: Extracting Symbols (Outline) ---");
        const symbols = await ws.getSymbols('schema.cue', cue);
        console.log("Symbols in schema.cue:");
        symbols.forEach(s => console.log(` - [${s.type}] ${s.name} (line ${s.line})`));

    } catch (err) {
        console.error("Workspace Example Failed:", err);
        process.exit(1);
    }
}

run();