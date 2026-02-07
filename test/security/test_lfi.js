import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { loadWasm } = await import('../../dist/index.js');

async function testLFI() {
    try {
        console.log("Attempting LFI...");
        const cue = await loadWasm();

        // CUE 'import' normally tries to resolve relative to module root.
        // We want to ensure it cannot escape the virtual sandbox.
        const code = `
        import "github.com/geoff4lf/cue-wasm/pkg/test"
        
        res: test.val
        `;

        try {
            await cue.unify([code]);
            assert.fail("Should not have been able to import external package");
        } catch (e) {
            console.log("Caught expected error (safe):", e.toString());
            assert(e.toString().includes("import failed"));
            console.log("PASS: Did not read from disk (or failed to import)");
        }

    } catch (err) {
        console.error("Security Test Failed:", err);
        process.exit(1);
    }
}

testLFI();
