// Real archive closure: only Node, npm and tar; no Go rebuild or installed tools.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageName = '@geoff4lf/cue-wasm';
const required = [
    'package.json', 'dist/index.js', 'dist/index.d.ts', 'dist/workspace.js',
    'dist/worker.js', 'dist/worker-manager.js', 'dist/react/index.js',
    'dist/react/index.d.ts', 'bin/cue.wasm', 'bin/cue-engine.wasm',
    'bin/cue-reader.wasm', 'bin/wasm_exec.js', 'bin/THIRD_PARTY_NOTICES.txt', 'bin/package.json', 'bin/manifest.json',
];
const assets = {
    './cue.wasm': 'bin/cue.wasm',
    './bin/cue.wasm': 'bin/cue.wasm',
    './cue-engine.wasm': 'bin/cue-engine.wasm',
    './cue-reader.wasm': 'bin/cue-reader.wasm',
    './wasm_exec.js': 'bin/wasm_exec.js',
    './worker.js': 'dist/worker.js',
    './manifest.json': 'bin/manifest.json',
    './THIRD_PARTY_NOTICES.txt': 'bin/THIRD_PARTY_NOTICES.txt',
};
const json = path => JSON.parse(readFileSync(path, 'utf8'));
const sha256 = path => createHash('sha256').update(readFileSync(path)).digest('hex');

function checkClosure(root) {
    for (const file of required) {
        assert.ok(existsSync(join(root, file)), `Missing required package file: ${file}`);
        assert.ok(statSync(join(root, file)).size > 0, `Empty package file: ${file}`);
    }
    const manifest = json(join(root, 'package.json'));
    assert.equal(manifest.name, packageName);
    const build = json(join(root, 'bin/manifest.json'));
    assert.equal(build.schemaVersion, 1); assert.equal(build.packageVersion, manifest.version);
    for (const [name, asset] of Object.entries(build.assets)) {
        assert.equal(sha256(join(root, 'bin', name)), asset.sha256, `Asset hash mismatch: ${name}`);
        assert.equal(statSync(join(root, 'bin', name)).size, asset.bytes);
    }
    const notices = readFileSync(join(root, 'bin/THIRD_PARTY_NOTICES.txt'), 'utf8');
    assert.ok(notices.includes(`COMPONENT: Go ${build.go}`));
    assert.ok(notices.includes(`COMPONENT: cuelang.org/go ${build.cue}`));
    assert.match(notices, /Apache License/);
    assert.match(notices, /Redistribution and use in source and binary forms/);
    assert.equal(build.assets['cue.wasm'].sha256, build.assets['cue-engine.wasm'].sha256);
    assert.equal(json(join(root, 'bin/package.json')).type, 'commonjs');
    assert.equal(manifest.peerDependenciesMeta?.react?.optional, true);
    assert.deepEqual(manifest.dependencies ?? {}, {}, 'Core must remain dependency-free');
    for (const [subpath, file] of Object.entries(assets)) {
        assert.equal(manifest.exports[subpath], `./${file}`);
    }
}

// This exact probe is copied outside the checkout and resolves only the extracted
// package. The parent kills it after 30s even if Go or a loader never settles.
async function probe() {
    const require = createRequire(import.meta.url);
    const root = join(dirname(fileURLToPath(import.meta.url)), 'node_modules', packageName);
    assert.equal(require.resolve(packageName), join(root, 'dist/index.js'));
    assert.throws(() => require.resolve('react'), { code: 'MODULE_NOT_FOUND' });
    globalThis.fetch = () => { throw new Error('Package smoke must not use the network'); };
    const { loadWasm } = await import(packageName);
    const cue = await loadWasm(); // Deliberately no override for the default engine/shim.
    for (const [subpath, file] of Object.entries(assets)) {
        assert.equal(require.resolve(packageName + subpath.slice(1)), join(root, file));
    }
    const evaluated = JSON.parse(await cue.unify(['answer: 6 * 7', 'flavor: *"vanilla" | "chocolate"']));
    assert.deepEqual(evaluated, { answer: 42, flavor: 'vanilla' });
    console.log('PACKAGE_EVAL_OK ' + JSON.stringify(evaluated));
}

if (process.argv[2] === '--probe') {
    try {
        await probe();
        process.exit(0); // The Go host intentionally stays alive.
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
} else {
    const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
    const scratch = mkdtempSync(join(tmpdir(), 'cue-wasm-package-'));
    const receiptPath = join(repo, 'test/package/receipt.json');
    const receipt = { schemaVersion: 1, node: process.version, status: 'failed',
        binaryProvenance: 'Packaged bin/manifest.json hashes checked against actual assets; build reproducibility is a separate receipt.' };
    const env = { ...process.env, NODE_PATH: '', NODE_OPTIONS: '',
        npm_config_cache: join(scratch, 'npm-cache'), npm_config_offline: 'true',
        npm_config_audit: 'false', npm_config_fund: 'false', npm_config_update_notifier: 'false' };
    function run(command, args, cwd, timeout = 30000) {
        return execFileSync(command, args, { cwd, env, encoding: 'utf8', timeout,
            killSignal: 'SIGKILL', stdio: 'pipe', maxBuffer: 1024 * 1024 });
    }
    function extract(archive, name) {
        const consumer = join(scratch, name);
        mkdirSync(consumer);
        run('tar', ['-xzf', archive, '-C', consumer], scratch);
        const scope = join(consumer, 'node_modules/@geoff4lf');
        mkdirSync(scope, { recursive: true });
        const root = join(scope, 'cue-wasm');
        renameSync(join(consumer, 'package'), root);
        copyFileSync(fileURLToPath(import.meta.url), join(consumer, 'probe.mjs'));
        return { consumer, root };
    }
    try {
        const [pack] = JSON.parse(run('npm', ['pack', '--json', '--offline', '--ignore-scripts',
            '--pack-destination', scratch], repo, 60000));
        const archive = join(scratch, pack.filename);
        receipt.archive = { name: pack.filename, sha256: sha256(archive), size: pack.size };
        const positive = extract(archive, 'positive');
        checkClosure(positive.root);
        receipt.files = Object.fromEntries(required.map(file => [file, sha256(join(positive.root, file))]));
        const output = run(process.execPath, ['probe.mjs', '--probe'], positive.consumer);
        assert.match(output, /PACKAGE_EVAL_OK/);
        receipt.positive = { requiredFiles: required.length, defaultLoadAndEvaluation: 'passed', reactInstalled: false };

        // Build and extract an actual damaged archive; test the same closure guard.
        const damaged = join(scratch, 'damaged');
        mkdirSync(damaged);
        run('tar', ['-xzf', archive, '-C', damaged], scratch);
        rmSync(join(damaged, 'package/bin/cue-engine.wasm'));
        const missingArchive = join(scratch, 'missing-default-engine.tgz');
        run('tar', ['-czf', missingArchive, '-C', damaged, 'package'], scratch, 60000);
        const negative = extract(missingArchive, 'negative');
        assert.throws(() => checkClosure(negative.root), /Missing required package file: bin\/cue-engine\.wasm/);
        // Also prove the actual default loader cannot evaluate this damaged archive.
        let failure;
        try {
            run(process.execPath, ['probe.mjs', '--probe'], negative.consumer);
        } catch (error) {
            failure = error;
        }
        assert.ok(failure, 'Missing engine unexpectedly loaded');
        assert.equal(failure.status, 1, 'Negative probe must fail, not time out');
        assert.match(String(failure.stderr), /ENOENT/);
        assert.match(String(failure.stderr), /cue-engine\.wasm/);
        receipt.negative = { omitted: 'bin/cue-engine.wasm', archiveSha256: sha256(missingArchive),
            closureGuard: 'rejected missing required file', defaultLoader: 'failed ENOENT', exitCode: failure.status };
        rmSync(join(positive.root, 'bin/THIRD_PARTY_NOTICES.txt'));
        assert.throws(() => checkClosure(positive.root), /Missing required package file: bin\/THIRD_PARTY_NOTICES.txt/);
        receipt.licenseGuard = 'Missing upstream notices rejected';
        receipt.status = 'passed';
        console.log('PASS: independent tarball default load/evaluation without React');
        console.log('PASS: missing-default-engine archive rejected by guard and default loader');
    } catch (error) {
        receipt.error = String(error);
        process.exitCode = 1;
        console.error(error);
    } finally {
        rmSync(scratch, { recursive: true, force: true });
        receipt.scratchCleaned = !existsSync(scratch);
        writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
        console.log(`Receipt: ${receiptPath}`);
    }
}
