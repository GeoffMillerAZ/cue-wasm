const { loadWasm } = require('../../dist/index.js');

async function run() {
    try {
        const cue = await loadWasm();

        const input = `
        metadata: {
            name: "my-deployment"
            labels: app: "web"
        }
        spec: replicas: 3
        `;

        console.log("--- Input CUE ---");
        console.log(input);

        // Export as YAML
        console.log("\n--- Export as YAML ---");
        const yaml = await cue.export(input, 'yaml');
        console.log(yaml);

        // Export as JSON
        console.log("--- Export as JSON ---");
        const json = await cue.export(input, 'json');
        console.log(json);

        // Export as CUE (Canonical Formatting)
        console.log("--- Export as Formatted CUE ---");
        const formatted = await cue.export(input, 'cue');
        console.log(formatted);

    } catch (err) {
        console.error("Error:", err);
    }
}

run();
