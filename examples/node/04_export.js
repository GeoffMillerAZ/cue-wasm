const { loadWasm } = await import('../../dist/index.js');

async function run() {
    try {
        const cue = await loadWasm();

        const input = `
        #User: {
            name: string
            id:   int
        }
        alice: #User & { name: "Alice", id: 1 }
        `;

        console.log("Exporting to JSON...");
        const json = await cue.export(input, "json");
        console.log(json);

        console.log("\nExporting to YAML...");
        const yaml = await cue.export(input, "yaml");
        console.log(yaml);

        console.log("\nFormatting CUE...");
        const formatted = await cue.export("a:1\nb:2", "cue");
        console.log(formatted);

    } catch (err) {
        console.error("Export Error:", err);
        process.exit(1);
    }
}

run();