import { readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, sep } from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const site = join(root, 'site');
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const json = async path => JSON.parse(await readFile(path, 'utf8'));

export async function installedPackage() {
  const pin = await json(join(root, 'vendor/pin.json'));
  if (sha256(await readFile(join(root, 'vendor', pin.archive))) !== pin.sha256) {
    throw Error('Archive differs from frozen pin; rebaseline only with an explicit new receipt');
  }
  const dependency = join(root, 'node_modules/@geoff4lf/cue-wasm');
  const resolved = await realpath(dependency);
  if (!resolved.startsWith(join(root, 'node_modules') + sep)) throw Error('Symlink/source coupling is prohibited');
  const pkg = await json(join(dependency, 'package.json'));
  if (pkg.name !== '@geoff4lf/cue-wasm' || pkg.version !== pin.packageVersion) throw Error('Installed package identity mismatch');
  const manifest = await json(join(dependency, 'bin/manifest.json'));
  for (const [name, asset] of Object.entries(manifest.assets)) {
    const bytes = await readFile(join(dependency, 'bin', name));
    if (bytes.length !== asset.bytes || sha256(bytes) !== asset.sha256) throw Error(`Installed asset hash mismatch: ${name}`);
  }
  return { dependency, pin, manifest };
}
