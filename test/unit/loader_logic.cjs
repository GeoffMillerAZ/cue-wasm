const assert = require('assert');
const path = require('path');

// We use the generated file to ensure we are testing reality
const loaderPath = path.resolve(__dirname, '../../dist/index.js');

// Mocking Browser Environment
function testBrowserLogic() {
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

        const { loadWasm } = require(loaderPath);
        
        // Test Case 1: Default CDN
        loadWasm();
        const version = require('../../package.json').version;
        const expectedCdn = `https://cdn.jsdelivr.net/npm/@geoff4lf/cue-wasm@${version}/bin/cue-engine.wasm`;
        assert.strictEqual(fetchedUrl, expectedCdn, "Should use CDN URL by default in browser");
        console.log("✅ Correctly defaulted to CDN in browser.");

        // Test Case 2: Custom Path
        const customPath = "/my/local/cue.wasm";
        loadWasm(customPath);
        assert.strictEqual(fetchedUrl, customPath, "Should respect custom path in browser");
        console.log("✅ Correctly respected custom path in browser.");

    } finally {
        // Cleanup
        global.window = originalWindow;
        global.fetch = originalFetch;
        global.WebAssembly = originalWebAssembly;
        delete global.Go;
        // Clear cache for next tests if needed
        delete require.cache[loaderPath];
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

        const { loadWasm } = require(loaderPath);
        
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
        delete require.cache[loaderPath];
    }
}

async function run() {
    try {
        testBrowserLogic();
        await testNodeLogic();
        console.log("\nLoader Logic Verification Passed!");
    } catch (e) {
        console.error("Verification Failed:", e);
        process.exit(1);
    }
}

run();