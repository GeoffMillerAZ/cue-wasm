const { loadWasm } = require('../../dist/index.js');

async function run() {
    try {
        const cue = await loadWasm();

        console.log("--- Unifying Multiple Files ---");

        // Simulating multiple files in a build context
        const files = {
            "base.cue": `
                app: {
                    name: string
                    port: *8080 | int
                }
            `,
            "prod.cue": `
                app: {
                    name: "production-app"
                    port: 9090
                }
            `
        };

        // Unify returns the JSON result of the merged configuration
        const jsonResult = await cue.unify(files);
        const config = JSON.parse(jsonResult);

        console.log("Resulting Configuration:");
        console.log(JSON.stringify(config, null, 2));

        // Validation check on the result
        if (config.app.port === 9090) {
            console.log("\n✅ 'prod.cue' successfully overrode the default port.");
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

run();
