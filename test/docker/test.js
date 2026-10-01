import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const owned = `cue-wasm-smoke-${randomUUID()}`;
const image = `${owned}:test`;
const containers = [`${owned}-node`, `${owned}-serve`];
const controller = new AbortController();
for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => controller.abort(new Error(`Interrupted by ${signal}`)));
}

async function docker(args, { timeout = 30_000, cleanup = false } = {}) {
    console.log(`docker ${args.join(' ')}`);
    try {
        const { stdout } = await exec('docker', args, {
            cwd: root, timeout, killSignal: 'SIGKILL', maxBuffer: 16 * 1024 * 1024,
            ...(cleanup ? {} : { signal: controller.signal }),
        });
        return stdout;
    } catch (error) {
        if (error.stderr) console.error(error.stderr);
        throw error;
    }
}

async function request(base, path, timeout = 10_000) {
    const response = await fetch(base + path, {
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(timeout)]),
    });
    assert.equal(response.status, 200, `${path}: HTTP status`);
    // Bound response allocation even if the server unexpectedly returns an endless body.
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
        size += chunk.length;
        assert.ok(size <= 64 * 1024 * 1024, `${path}: response exceeds 64 MiB`);
        chunks.push(chunk);
    }
    return { response, body: Buffer.concat(chunks) };
}

async function waitReady(base) {
    const deadline = Date.now() + 30_000;
    let lastError;
    while (Date.now() < deadline) {
        controller.signal.throwIfAborted();
        try { return await request(base, '/examples/browser/index.html', 1000); }
        catch (error) { lastError = error; }
        await delay(200, undefined, { signal: controller.signal });
    }
    throw new Error('Example server was not ready within 30 seconds', { cause: lastError });
}

function exampleJSON(output, label) {
    const start = output.indexOf(label);
    assert.ok(start >= 0, `Missing example output: ${label}`);
    const match = output.slice(start + label.length).trimStart().match(/^(\{[^\n]*\}|\{[\s\S]*?\n\})/);
    assert.ok(match, `Missing JSON after ${label}`);
    return JSON.parse(match[1]);
}

async function testDocker() {
    await docker(['build', '-f', 'examples/Dockerfile', '-t', image, '.'], { timeout: 15 * 60_000 });
    const output = await docker(['run', '--name', containers[0], '--rm', image, 'node'], { timeout: 120_000 });
    assert.match(output, /Validation Result: ✅ Valid/);
    assert.match(output, /Validation Result: ❌ Invalid/);
    assert.deepEqual(exampleJSON(output, 'Unified JSON Result:'), { a: 1, b: 2, c: 3 });
    assert.deepEqual(exampleJSON(output, 'Result with Injected Tags:'), { env: 'production', debug: true });
    assert.deepEqual(exampleJSON(output, 'Exporting to JSON...'), { alice: { name: 'Alice', id: 1 } });
    assert.match(output, /data\.cue syntax valid\? true/);
    assert.match(output, /broken\.cue syntax valid\? false/);
    assert.doesNotMatch(output, /Fatal Error:|Unify Error:|Tag Error:|Export Error:|Workspace Example Failed:/);
    console.log('Node example semantic output passed.');

    await docker(['run', '-d', '--name', containers[1], '-p', '127.0.0.1::8080', image, 'serve']);
    const binding = (await docker(['port', containers[1], '8080/tcp'])).trim();
    assert.match(binding, /^127\.0\.0\.1:\d+$/);
    const base = `http://${binding}`;
    const html = await waitReady(base);
    assert.match(html.response.headers.get('content-type'), /^text\/html/);
    assert.match(html.body.toString(), /CUE WASM Pro Playground/);
    for (const path of ['/dist/index.js', '/dist/runtime-environment.js', '/dist/workspace.js',
        '/dist/worker-manager.js', '/dist/worker.js']) {
        const asset = await request(base, path);
        assert.match(asset.response.headers.get('content-type'), /^text\/javascript/);
        assert.ok(asset.body.length > 0, `${path}: empty JavaScript`);
        assert.ok(!asset.body.includes(Buffer.from('__VERSION__')), `${path}: ungenerated version`);
    }
    const { body } = await request(base, '/bin/manifest.json');
    const manifest = JSON.parse(body);
    assert.equal(manifest.go, 'go1.24.4');
    for (const name of ['cue.wasm', 'cue-engine.wasm', 'cue-reader.wasm', 'wasm_exec.js', 'THIRD_PARTY_NOTICES.txt']) {
        const asset = await request(base, `/bin/${name}`);
        assert.equal(asset.body.length, manifest.assets[name].bytes, `${name}: size`);
        assert.equal(createHash('sha256').update(asset.body).digest('hex'), manifest.assets[name].sha256, `${name}: hash`);
        if (name.endsWith('.wasm')) {
            assert.equal(asset.response.headers.get('content-type'), 'application/wasm');
            assert.deepEqual(asset.body.subarray(0, 8), Buffer.from([0, 97, 115, 109, 1, 0, 0, 0]));
        }
    }
    console.log('HTTP example, generated JavaScript and manifest-matched WASM assets passed.');
}

let failed = false;
try {
    await testDocker();
} catch (error) {
    failed = true;
    console.error('Docker smoke failed:', error);
} finally {
    // Remove only names owned by this invocation, including containers left by a timeout.
    for (const name of containers) {
        try { await docker(['rm', '-f', name], { timeout: 15_000, cleanup: true }); }
        catch (error) {
            if (!/No such container/i.test(error.stderr || '')) {
                failed = true;
                console.error(`Cleanup failed for ${name}:`, error.message);
            }
        }
    }
    try { await docker(['image', 'rm', image], { timeout: 15_000, cleanup: true }); }
    catch (error) {
        if (!/No such image/i.test(error.stderr || '')) {
            failed = true;
            console.error('Image cleanup failed:', error.message);
        }
    }
}
if (failed) process.exitCode = 1;
else console.log('All Docker smoke checks passed.');
