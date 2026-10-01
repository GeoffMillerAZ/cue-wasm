import { build } from 'esbuild';
import { mkdir, readdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { root, site, installedPackage, sha256 } from './common.mjs';

const { dependency, pin, manifest } = await installedPackage();
await rm(site, { recursive: true, force: true });
await mkdir(join(site, 'package/dist/react'), { recursive: true });
await mkdir(join(site, 'package/bin'), { recursive: true });
for (const name of await readdir(join(dependency, 'dist'))) {
  if (name.endsWith('.js')) await copyFile(join(dependency, 'dist', name), join(site, 'package/dist', name));
}
await copyFile(join(dependency, 'dist/react/index.js'), join(site, 'package/dist/react/index.js'));
for (const name of ['cue-engine.wasm', 'cue-reader.wasm', 'wasm_exec.js', 'manifest.json', 'THIRD_PARTY_NOTICES.txt']) {
  await copyFile(join(dependency, 'bin', name), join(site, 'package/bin', name));
}
await copyFile(join(root, 'index.html'), join(site, 'index.html'));
const bundle = await build({
  absWorkingDir: root, entryPoints: { browser: 'src/browser.tsx', react: 'src/react.ts' },
  bundle: true, splitting: true, format: 'esm', platform: 'browser', target: 'es2022',
  outdir: 'site/build', jsx: 'automatic', metafile: true,
  // Development React deliberately exercises StrictMode effect replay.
  define: { 'process.env.NODE_ENV': '"development"' },
  external: ['@geoff4lf/cue-wasm', '@geoff4lf/cue-wasm/react'],
  logLevel: 'warning',
});
const hashes = {};
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collect(path);
    else hashes[relative(site, path).split('\\').join('/')] = sha256(await readFile(path));
  }
}
await collect(site);
const declarations = {};
for (const name of ['dist/index.d.ts', 'dist/react/index.d.ts', 'dist/workspace.d.ts']) declarations[name] = sha256(await readFile(join(dependency, name)));
const receipt = {
  schemaVersion: 1, node: process.version, react: '19.2.0', reactDOM: '19.2.0',
  esbuild: '0.25.12', typescript: '5.9.3', packageVersion: pin.packageVersion,
  archiveSha256: pin.sha256, packageManifest: manifest, declarations, siteHashes: hashes,
  assetSource: 'installed frozen npm archive, never root dist/bin or sibling checkout',
  reactMode: 'development StrictMode; not a production performance build',
  browserExecution: 'not performed by build',
};
await writeFile(join(site, 'build-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
await writeFile(join(root, 'evidence/build.json'), JSON.stringify(receipt, null, 2) + '\n');
await writeFile(join(site, 'metafile.json'), JSON.stringify(bundle.metafile, null, 2) + '\n');
console.log(`Built self-contained site from installed archive ${pin.sha256}.`);
