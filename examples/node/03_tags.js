const { loadWasm } = await import('../../dist/index.js');

async function run() {
    try {
        const cue = await loadWasm();

        const input = `
        env: string @tag(environment)
        debug: bool @tag(debug,type=bool)
        `;

        // Tags allow injecting data into CUE at runtime
        const tags = [
            "environment=production",
            "debug=true"
        ];

        console.log("Unifying with tags...");
        const result = await cue.unify([input], null, tags);
        
        console.log("Result with Injected Tags:");
        console.log(JSON.stringify(JSON.parse(result), null, 2));

    } catch (err) {
        console.error("Tag Error:", err);
        process.exit(1);
    }
}

run();