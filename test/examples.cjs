const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const examplesDir = path.join(__dirname, '../examples/node');
const files = fs.readdirSync(examplesDir).filter(f => f.endsWith('.cjs'));

console.log(`Found ${files.length} examples to test.`);

const runExample = (file) => {
    return new Promise((resolve, reject) => {
        const filePath = path.join(examplesDir, file);
        console.log(`Running ${file}...`);

        execFile('node', [filePath], (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ ${file} failed:`);
                console.error(stderr);
                reject(error);
            } else {
                console.log(`✅ ${file} passed.`);
                // console.log(stdout); // Optional: print output
                resolve();
            }
        });
    });
};

async function runAll() {
    let failed = false;
    for (const file of files) {
        try {
            await runExample(file);
        } catch (e) {
            failed = true;
        }
    }

    if (failed) {
        console.error("Some examples failed.");
        process.exit(1);
    } else {
        console.log("All examples passed!");
    }
}

runAll();
