import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const sources=['internal/js/runtime-environment.js','internal/js/loader.js','internal/js/worker-manager.js','internal/js/worker.js','internal/js/workspace.js','internal/js/index.d.ts','internal/js/workspace.d.ts','internal/react/index.js','internal/react/index.d.ts','scripts/generate-js.mjs','package.json'];
test('generator is idempotent and rejects drift in an isolated source copy',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'cue-generator-'));
 try{
  for(const file of sources){const target=path.join(root,file);await mkdir(path.dirname(target),{recursive:true});await copyFile(file,target);}
  const run=(...args)=>execFileSync(process.execPath,['scripts/generate-js.mjs',...args],{cwd:root,stdio:'pipe'});
  run();const before=await readFile(path.join(root,'dist/index.js'),'utf8');assert.ok(!before.includes('__VERSION__'));
  run();assert.equal(await readFile(path.join(root,'dist/index.js'),'utf8'),before);run('--check');
  await writeFile(path.join(root,'dist/index.js'),before+'\n// stale\n');
  assert.throws(()=>run('--check'),error=>error.stderr.toString().includes('Generated artifact drift: dist/index.js'));
  run();assert.equal(await readFile(path.join(root,'dist/index.js'),'utf8'),before);run('--check');
  await writeFile(path.join(root,'dist/workspace.d.ts'),'// missing tools export\n');
  assert.throws(()=>run('--check'),error=>error.stderr.toString().includes('Generated artifact drift: dist/workspace.d.ts'));
  run();run('--check');
 }finally{await rm(root,{recursive:true,force:true});}
});
