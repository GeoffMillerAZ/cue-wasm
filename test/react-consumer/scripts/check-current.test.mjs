import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,cp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {compareCandidate} from './check-current.mjs';import {sha256} from './common.mjs';
test('source/archive guard refuses declaration, export and binary drift without silently repinning',async()=>{
 const root=await mkdtemp(join(tmpdir(),'cue-source-guard-')),a=join(root,'source'),b=join(root,'installed');
 try{
  await mkdir(join(a,'dist'),{recursive:true});await mkdir(join(a,'bin'));
  const pkg={name:'fixture',version:'1',exports:{'.':'./dist/index.js'}};
  await writeFile(join(a,'package.json'),JSON.stringify(pkg));await writeFile(join(a,'dist/index.d.ts'),'export class Workspace {}');
  await writeFile(join(a,'bin/engine.wasm'),'fixture');await writeFile(join(a,'bin/manifest.json'),JSON.stringify({assets:{'engine.wasm':{sha256:sha256('fixture')}}}));await cp(a,b,{recursive:true});
  await compareCandidate(a,b);
  await writeFile(join(a,'dist/index.d.ts'),'invalid declaration');await assert.rejects(compareCandidate(a,b),/declaration drift/);
  await writeFile(join(a,'dist/index.d.ts'),'export class Workspace {}');await writeFile(join(a,'package.json'),JSON.stringify({...pkg,exports:{}}));await assert.rejects(compareCandidate(a,b),/contract drift/);
  await writeFile(join(a,'package.json'),JSON.stringify(pkg));await writeFile(join(a,'bin/engine.wasm'),'changed');await assert.rejects(compareCandidate(a,b),/asset drift/);
 }finally{await rm(root,{recursive:true,force:true});}
});
