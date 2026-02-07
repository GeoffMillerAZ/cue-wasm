const { loadWasm } = require('../../dist/index.js');

async function run() {
    try {
        const cue = await loadWasm();

        console.log("--- Unification with Tags ---");

        const files = {
            "config.cue": `
                package config
                
                env: string @tag(env)
                db: {
                    host: string
                    if env == "prod" {
                        host: "prod-db.internal"
                    }
                    if env != "prod" {
                        host: "localhost"
                    }
                }
            `
        };

        // 1. Run with 'prod' tag
        console.log("1. Injecting tag: env=prod");
        const prodJson = await cue.unify(files, ["env=prod"]);
        console.log("Prod Config:", prodJson);

        // 2. Run with 'dev' tag
        console.log("\n2. Injecting tag: env=dev");
        const devJson = await cue.unify(files, ["env=dev"]);
        console.log("Dev Config:", devJson);

    } catch (err) {
        console.error("Error:", err);
    }
}

run();
