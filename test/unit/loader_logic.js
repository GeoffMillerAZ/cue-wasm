import assert from 'assert';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const loaderPath = 'file://' + path.resolve(__dirname, '../../dist/index.js');

// Mocking Browser Environment
async function testBrowserLogic() {
    console.log("Testing Browser Branching Logic...");
    
    // Save original state
    const originalWindow = global.window;
    const originalFetch = global.fetch;
    const originalWebAssembly = global.WebAssembly;

    try {
        global.window = {}; // Simulate browser
        let fetchedUrl = '';
        
        // Mock fetch
        global.fetch = (url) => {
            fetchedUrl = url;
            return Promise.resolve({
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
            });
        };

        // Mock WebAssembly
        global.WebAssembly = {
            instantiateStreaming: () => Promise.resolve({ instance: { exports: {} } }),
            Module: class {},
            Instance: class { constructor() { this.exports = {}; } }
        };

        // Mock Go (required by loader)
        global.Go = class {
            constructor() { this.importObject = { gojs: {} }; }
            run() {}
        };

        const { loadWasm } = await import(loaderPath);
        
        // Test Case 1: Default CDN
        await loadWasm();
        const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'));
        const version = pkg.version;
        const expectedCdn = `https://cdn.jsdelivr.net/npm/@geoff4lf/cue-wasm@${version}/bin/cue-engine.wasm`;
        assert.strictEqual(fetchedUrl, expectedCdn, "Should use CDN URL by default in browser");
        console.log("✅ Correctly defaulted to CDN in browser.");

        // Test Case 2: Custom Path
        const customPath = "/my/local/cue.wasm";
        await loadWasm(customPath);
        assert.strictEqual(fetchedUrl, customPath, "Should respect custom path in browser");
        console.log("✅ Correctly respected custom path in browser.");

    } finally {
        // Cleanup
        global.window = originalWindow;
        global.fetch = originalFetch;
        global.WebAssembly = originalWebAssembly;
        delete global.Go;
    }
}

async function testNodeLogic() {
    console.log("\nTesting Node Branching Logic...");
    
    // ENSURE Node detection
    const originalWindow = global.window;
    global.window = undefined;

    const originalFetch = global.fetch;
    global.fetch = () => { throw new Error("Should NOT call fetch in Node"); };

    try {
        // Mock Go for Node check
        global.Go = class {
            constructor() { this.importObject = { gojs: {} }; }
            run() {}
        };

        // Mock WebAssembly for Node
        const originalWA = global.WebAssembly;
        global.WebAssembly = {
            Module: function() {
                throw new Error("FS_SUCCESS_SIGNAL");
            },
            Instance: class { constructor() { this.exports = {}; } }
        };

        const { loadWasm } = await import(loaderPath);
        
        try {
            await loadWasm();
        } catch (e) {
            if (e.message === "FS_SUCCESS_SIGNAL") {
                console.log("✅ Node branch correctly avoided fetch and reached FS logic.");
            } else {
                assert.ok(!e.message.includes("fetch"), "Node should use fs, not fetch. Got: " + e.message);
            }
        }

        global.WebAssembly = originalWA;
    } finally {
        global.fetch = originalFetch;
        global.window = originalWindow;
        delete global.Go;
    }
}

async function run() {
    try {
        await testBrowserLogic();
        await testNodeLogic();
        console.log("\nLoader Logic Verification Passed!");
    } catch (e) {
        console.error("Verification Failed:", e);
        process.exit(1);
    }
}

run();