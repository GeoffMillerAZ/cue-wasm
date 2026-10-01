import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import http from 'node:http';
import { root, site, json, sha256, installedPackage } from './common.mjs';
import { startServer } from './server.mjs';

test('Frozen archive and local installation match; no sibling or source dependency', async () => {
  await installedPackage();
  const lock = await json(join(root, 'package-lock.json'));
  const pin = await json(join(root, 'vendor/pin.json'));
  assert.equal(lock.packages['node_modules/@geoff4lf/cue-wasm'].resolved, `file:vendor/${pin.archive}`);
  for (const [name, pkg] of Object.entries(lock.packages)) {
    if (name && pkg.resolved && name !== 'node_modules/@geoff4lf/cue-wasm') assert.match(pkg.resolved, /^https:\/\/registry\.npmjs\.org\//);
  }
  const meta = await json(join(site, 'metafile.json'));
  for (const input of Object.keys(meta.inputs)) assert.ok(!input.startsWith('../') && !input.startsWith('/'), input);
  assert.ok(Object.keys(meta.inputs).some(input => input.startsWith('node_modules/react-dom/')), 'Real ReactDOM is not bundled');
  assert.ok(Object.keys(meta.inputs).some(input => input.startsWith('node_modules/react/')), 'Real React is not bundled');
});

test('Two builds with the same installed inputs yield identical served bytes', async () => {
  const before = await json(join(site, 'build-receipt.json'));
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual((await json(join(site, 'build-receipt.json'))).siteHashes, before.siteHashes);
});

test('Self-hosted prefix serves complete build, real worker and WASM with correct MIME; rejects missing/private/traversal routes', async () => {
  const { server, origin, url } = await startServer({ prefix: '/test/react-consumer/' });
  try {
    const receipt = await json(join(site, 'build-receipt.json'));
    for (const [path, expected] of Object.entries(receipt.siteHashes)) {
      const response = await fetch(new URL(path, url));
      assert.equal(response.status, 200, path);
      assert.equal(sha256(new Uint8Array(await response.arrayBuffer())), expected, path);
      if (path.endsWith('.wasm')) assert.equal(response.headers.get('content-type'), 'application/wasm');
      if (path.endsWith('.js')) assert.match(response.headers.get('content-type'), /^text\/javascript/);
      assert.match(response.headers.get('content-security-policy'), /connect-src 'self'/);
    }
    assert.equal((await fetch(new URL('index.html', url), { method: 'POST' })).status, 404);
    for (const path of ['missing-engine.wasm', 'package.json', 'node_modules/react/index.js', '../package.json']) {
      assert.equal((await fetch(new URL(path, url))).status, 404, path);
    }
    const raw = path => new Promise((resolve, reject) => {
      const request = http.get(origin + path, response => { response.resume(); response.once('end', () => resolve(response.statusCode)); });
      request.once('error', reject);
    });
    assert.equal(await raw('/test/react-consumer/%2e%2e/package.json'), 404);
    assert.equal(await raw('/test/react-consumer/%5cpackage.json'), 404);
    const html = await fetch(url).then(response => response.text());
    assert.match(html, /type="importmap"/);
    assert.match(html, /\.\/build\/browser.js/);
    // All modules use the installed package; external React resolves to the same shared chunk.
    const importmap = JSON.parse(html.match(/<script type="importmap">([^<]+)<\/script>/)[1]);
    for (const path of Object.values(importmap.imports)) assert.equal((await fetch(new URL(path, url))).status, 200);
    async function inspect(directory) {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) await inspect(path);
        else if (path.endsWith('.js')) {
          const source = await readFile(path, 'utf8');
          for (const match of source.matchAll(/(?:from\s*|import\s*)["'](\.[^"']+)["']/g)) {
            const target = new URL(match[1], new URL(relative(site, path), url));
            assert.equal((await fetch(target)).status, 200, target.href);
          }
        }
      }
    }
    await inspect(join(site, 'build'));
    await inspect(join(site, 'package/dist'));
  } finally {
    await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
  }
});
