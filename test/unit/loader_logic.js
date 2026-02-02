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
            instantiateStreaming: () => Promise.resolve({ instance: { exports: {} } })
        };

        // Mock Go (required by loader)
        global.Go = class {
            constructor() { this.importObject = {}; }
            run() {}
        };

        const { loadWasm } = require(loaderPath);
        
        // Test Case 1: Default CDN
        loadWasm();
        const expectedCdn = "https://cdn.jsdelivr.net/npm/@GeoffMillerAZ/cue-wasm@1.0.0/bin/cue.wasm";
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

function testNodeLogic() {
    console.log("\nTesting Node Branching Logic...");
    const { loadWasm } = require(loaderPath);
    
    // In Node, loadWasm returns a Promise that resolves immediately (due to our select{} in Go, 
    // it's a bit sync/async mix, but the current test.js verifies the functional part).
    // Here we just verify it doesn't try to 'fetch'.
    
    const originalFetch = global.fetch;
    global.fetch = () => { throw new Error("Should NOT call fetch in Node"); };
    
    try {
        // We expect this to fail in this unit test because 'Go' isn't fully mocked for Node sync load,
        // but we want to see it NOT hitting the 'fetch' branch.
        loadWasm();
    } catch (e) {
        assert.ok(!e.message.includes("fetch"), "Node should use fs, not fetch");
        console.log("✅ Node branch correctly avoided fetch.");
    } finally {
        global.fetch = originalFetch;
    }
}

try {
    testBrowserLogic();
    testNodeLogic();
    console.log("\nLoader Logic Verification Passed!");
} catch (e) {
    console.error("Verification Failed:", e);
    process.exit(1);
}
