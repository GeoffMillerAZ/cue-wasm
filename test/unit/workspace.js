const test = require('node:test');
const assert = require('node:assert');
const { Workspace } = require('../../internal/js/workspace.js');

test('Workspace Manager - TDD Suite', async (t) => {

    await t.test('should add files and generate a flat overlay for WASM', () => {
        const ws = new Workspace();
        ws.addFile('main.cue', 'import "foo:bar"\nres: bar.val');
        ws.addFile('pkg/foo/bar.cue', 'val: 42');

        const overlay = ws.getOverlay();
        
        assert.strictEqual(Object.keys(overlay).length, 2);
        // Workspace normalizes to leading slash
        assert.strictEqual(overlay['/main.cue'], 'import "foo:bar"\nres: bar.val');
        assert.strictEqual(overlay['/pkg/foo/bar.cue'], 'val: 42');
    });

    await t.test('should handle file updates correctly', () => {
        const ws = new Workspace();
        ws.addFile('test.cue', 'v: 1');
        ws.addFile('test.cue', 'v: 2'); // Update
        
        const overlay = ws.getOverlay();
        assert.strictEqual(overlay['/test.cue'], 'v: 2');
    });

    await t.test('should support removing files', () => {
        const ws = new Workspace();
        ws.addFile('a.cue', 'a: 1');
        ws.removeFile('a.cue');
        
        const overlay = ws.getOverlay();
        assert.strictEqual(overlay['/a.cue'], undefined);
    });

    await t.test('should throw error when adding invalid paths', () => {
        const ws = new Workspace();
        assert.throws(() => {
            ws.addFile('', 'content');
        }, /Invalid path/);
    });

    await t.test('INTEGRATION: should unify multiple files via Workspace and WASM', async () => {
        const { loadWasm } = require('../../dist/index.js');
        const cue = await loadWasm();
        const ws = new Workspace();

        ws.addFile('a.cue', 'package test\nval: 41', true);
        ws.addFile('b.cue', 'package test\nres: val + 1', true);

        const overlay = ws.getOverlay();
        const entryPoints = ws.getEntryPoints();
        const result = await cue.unify(overlay, entryPoints);
        const json = JSON.parse(result);

        assert.strictEqual(json.res, 42);
        console.log("✅ Integration Test Passed: Workspace correctly prepared WASM inputs.");
    });

    await t.test('Fast Syntax Validation - should catch syntax errors instantly', async () => {
        const { loadWasm } = require('../../dist/index.js');
        const cue = await loadWasm();
        
        // 1. Valid Syntax
        const validRes = await cue.parse('a: 1\nb: 2');
        assert(validRes.includes('a: 1'));
        console.log("✅ Valid syntax parsed successfully.");

        // 2. Invalid Syntax (Missing colon)
        try {
            await cue.parse('a 1');
            assert.fail("Should have caught syntax error");
        } catch (e) {
            // Log the error to see what Go returns
            console.log("Caught Syntax Error:", e);
            const err = JSON.parse(e);
            assert.strictEqual(err.line, 1);
            // The official CUE 0.12 error message might be different
            assert(err.message.length > 0);
            console.log("✅ Syntax error caught with line info.");
        }
    });
});
