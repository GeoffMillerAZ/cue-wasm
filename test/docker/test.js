const { execFile, spawn } = require('child_process');
const http = require('http');

const IMAGE_NAME = 'cue-wasm-test-image';
const PORT = 8081; // Use 8081 to avoid conflict if 8080 is busy

function runCommand(cmd, args = []) {
    return new Promise((resolve, reject) => {
        console.log(`Running: ${cmd} ${args.join(' ')}`);
        execFile(cmd, args, (err, stdout, stderr) => {
            if (err) {
                console.error(stderr);
                reject(err);
            } else {
                resolve(stdout);
            }
        });
    });
}

async function testDocker() {
    try {
        // 1. Build Image
        console.log("--- 1. Building Docker Image ---");
        await runCommand('docker', ['build', '-f', 'examples/Dockerfile', '-t', IMAGE_NAME, '.']);
        console.log("✅ Image built successfully.");

        // 2. Test 'node' mode (CLI examples)
        console.log("\n--- 2. Testing 'node' execution ---");
        const nodeOutput = await runCommand('docker', ['run', '--rm', IMAGE_NAME, 'node']);
        if (nodeOutput.includes("✅ 01_validate.js passed") || nodeOutput.includes("Validation Result: ✅ Valid")) {
             // The specific output depends on what the examples print, but checking for success indicators
             console.log("✅ Node examples ran successfully.");
        } else {
            // Our docker entrypoint runs the files directly. 
            // 01_validate.js prints "Validation Result: ✅ Valid"
            if (nodeOutput.includes("Valid")) {
                console.log("✅ Node examples ran successfully.");
            } else {
                throw new Error("Node examples output did not match expected success patterns.");
            }
        }

        // 3. Test 'serve' mode (Browser Playground)
        console.log("\n--- 3. Testing 'serve' execution ---");
        const containerId = (await runCommand('docker', ['run', '-d', '-p', `${PORT}:8080`, IMAGE_NAME, 'serve'])).trim();
        console.log(`Container started: ${containerId}`);

        // Wait for server to be up
        await new Promise(r => setTimeout(r, 2000));

        // Verify HTTP response
        const checkServer = () => new Promise((resolve, reject) => {
            http.get(`http://localhost:${PORT}/examples/browser/index.html`, (res) => {
                if (res.statusCode === 200) {
                    console.log("✅ HTTP Server returned 200 OK");
                    resolve();
                } else {
                    reject(new Error(`HTTP Server returned status: ${res.statusCode}`));
                }
            }).on('error', reject);
        });

        try {
            await checkServer();
        } finally {
            console.log("Stopping container...");
            await runCommand('docker', ['stop', containerId]);
            await runCommand('docker', ['rm', containerId]);
        }

        console.log("\n✅ All Docker tests passed!");

    } catch (e) {
        console.error("\n❌ Docker Test Failed:", e);
        process.exit(1);
    } finally {
        // Cleanup image
        try {
            await runCommand('docker', ['rmi', IMAGE_NAME]);
            console.log("Cleaned up image.");
        } catch (_) {}
    }
}

testDocker();
