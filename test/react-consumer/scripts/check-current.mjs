// Explicit maintainer check. The independent consumer build itself has no source dependency.
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {installedPackage,sha256} from './common.mjs';
export async function compareCandidate(current, installed) {
 const json=async p=>JSON.parse(await readFile(p,'utf8'));
 const [a,b]=await Promise.all([json(join(current,'package.json')),json(join(installed,'package.json'))]);
 for(const field of ['name','version','exports','main','types','files','engines','peerDependencies','peerDependenciesMeta'])
  assert.deepEqual(a[field],b[field],`Package contract drift: ${field}; deliberately refresh the archive and rerun browser acceptance`);
 async function hashes(dir){
  const rows={};
  async function visit(relative=''){
   for(const entry of await readdir(join(dir,relative),{withFileTypes:true})){
    const path=join(relative,entry.name);
    if(entry.isDirectory())await visit(path);else rows[path]=sha256(await readFile(join(dir,path)));
   }
  }
  await visit();return rows;
 }
 assert.deepEqual(await hashes(join(current,'dist')),await hashes(join(installed,'dist')),'Generated runtime/declaration drift; refresh archive and reverify');
 const [ma,mb]=await Promise.all([json(join(current,'bin/manifest.json')),json(join(installed,'bin/manifest.json'))]);
 assert.deepEqual(ma,mb,'WASM build provenance changed; refresh archive and reverify');
 for(const [name,asset] of Object.entries(ma.assets)){
  assert.match(name,/^[a-zA-Z0-9_.-]+$/);
  assert.equal(sha256(await readFile(join(current,'bin',name))),asset.sha256,`Current asset drift: ${name}`);
 }
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(!process.argv[2])throw Error('Usage: node scripts/check-current.mjs CUE_WASM_SOURCE');
 const {dependency}=await installedPackage();await compareCandidate(resolve(process.argv[2]),dependency);
 console.log('Current public contract, generated module closure and WASM manifest/assets match the tested archive.');
}
