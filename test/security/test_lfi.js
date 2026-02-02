const fs = require('fs');
const path = require('path');

// Polyfill crypto for Node.js
if (!globalThis.crypto) {
    globalThis.crypto = {
        getRandomValues: (arr) => require("crypto").randomFillSync(arr)
    };
}

require('../../bin/wasm_exec.js');

const go = new Go();
const wasmPath = path.join(__dirname, '../../bin/cue.wasm');
const wasmBuffer = fs.readFileSync(wasmPath);

WebAssembly.instantiate(wasmBuffer, go.importObject).then(async (result) => {
    go.run(result.instance);
    
    // Wait for init
    setTimeout(async () => {
        try {
            console.log("Attempting LFI...");
            // Attempt to import package.json from the root
            // We use absolute path to be sure.
            const target = path.resolve('package.json');
            
            // CUE code that tries to load a file
            // Note: CUE usually loads via strict directory roots, but we want to verify 
            // if the underlying 'load' config allows escaping.
            // However, CUE language itself doesn't have 'fs.readFile'. 
            // It relies on the build context.
            // If we are passing files via 'Unify', we provide the content.
            // The danger is if 'Unify' parses an import like:
            // import "file:///etc/passwd" 
            // or if the tool respects imports that resolve to disk.
            
            // In our service.go, we set Dir: "/" and Overlay.
            // If import is not in Overlay, CUE might look at Dir.
            
            // Let's try to Validate a file that has an import.
            // Since we can't easily synthesize a file on disk that cues imports, 
            // we will try to unify a memory buffer that refers to a local file if possible.
            // Realistically, CUE imports are packages.
            
            // A better test for WASM/Go: 
            // Does the Go process *itself* have FS access?
            // We can't easily inject arbitrary Go code. 
            // We have to rely on what CUE does.
            
            // If CUE cannot read files (because we didn't give it a loader that does), 
            // then we are safe.
            // internal/core/service.go uses `load.Instances`.
            // By default, `load.Instances` *does* look at the disk if `Overlay` doesn't have it.
            
            // We will try to load a simple cue file that is NOT in the overlay but exists on disk.
            // We'll write a temp cue file.
            fs.writeFileSync('secret.cue', 'secret: "data"');
            
            // We pass a file that imports it? 
            // Or we pass a file list that includes it? 
            // But Unify takes a map of content.
            
            // Wait, Unify takes `files map[string]string`.
            // These are placed in Overlay.
            // If I provide `a.cue` in map, and it `import "foo"`, 
            // does it resolve "foo" from disk?
            
            // Let's try to verify this.
            const code = `
            import "github.com/GeoffMillerAZ/cue-wasm/pkg/test"
            out: test.Val
            `;
            
            // We need a package on disk to import.
            // Let's make a directory 'pkg/test'
            if (!fs.existsSync('pkg/test')) {
                fs.mkdirSync('pkg/test', {recursive: true});
            }
            fs.writeFileSync('pkg/test/file.cue', 'package test\nVal: "leaked"');

            // Now we call Unify with 'main.cue' having the import.
            // If it succeeds, it read from disk.
            try {
                const res = await CueWasm.unify({
                    "main.cue": code
                });
                console.log("Result:", res);
                if (res.includes("leaked")) {
                    console.log("VULNERABILITY: CUE read from disk!");
                    process.exit(1); 
                }
            } catch (e) {
                console.log("Caught expected error (safe):", e.toString());
            }
            
            console.log("PASS: Did not read from disk (or failed to import)");
            process.exit(0);

        } catch (e) {
            console.error("Test Error:", e);
            process.exit(1);
        } finally {
            // Cleanup
            if (fs.existsSync('secret.cue')) fs.unlinkSync('secret.cue');
            if (fs.existsSync('pkg/test/file.cue')) fs.unlinkSync('pkg/test/file.cue');
            if (fs.existsSync('pkg/test')) fs.rmdirSync('pkg/test');
            if (fs.existsSync('pkg')) fs.rmdirSync('pkg');
        }
    }, 500);
});
