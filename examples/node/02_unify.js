const { loadWasm } = await import('../../dist/index.js');

async function run() {
    try {
        const cue = await loadWasm();

        // CUE supports merging multiple sources
        const inputs = [
            `package main\na: 1`,
            `package main\nb: 2`,
            `package main\nc: a + b`
        ];

        console.log("Unifying sources...");
        const result = await cue.unify(inputs);
        
        console.log("Unified JSON Result:");
        console.log(JSON.stringify(JSON.parse(result), null, 2));

    } catch (err) {
        console.error("Unify Error:", err);
        process.exit(1);
    }
}

run();