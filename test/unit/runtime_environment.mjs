import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareVirtualFilesystem} from '../../dist/runtime-environment.js';
test('virtual mount refuses backing access; unrelated paths delegate unchanged',()=>{
 const calls=[], backing={constants:{O_DIRECTORY:-1},sentinel:'original'};
 for(const name of ['open','stat','lstat','readdir'])backing[name]=function(...args){calls.push([name,this.sentinel,...args.slice(0,-1)]);args.at(-1)(null,'host');};
 const host={fs:backing};prepareVirtualFilesystem(host);
 assert.equal(host.fs.constants.O_DIRECTORY,0);assert.equal(backing.constants.O_DIRECTORY,-1);
 for(const name of ['open','stat','lstat','readdir']){
  for(const path of ['/__cue_wasm_workspace__','/__cue_wasm_workspace__/lib/a.cue']){
   let error;host.fs[name](path,e=>{error=e;});assert.equal(error.code,'ENOENT');
  }
  assert.equal(calls.length,0);
  for(const path of ['/outside','/__cue_wasm_workspace__other'])host.fs[name](path,(e,v)=>{assert.equal(e,null);assert.equal(v,'host');});
  assert.deepEqual(calls.splice(0),[[name,'original','/outside'],[name,'original','/__cue_wasm_workspace__other']]);
 }
});
test('adapter preserves real directory constants and requires the Go shim',()=>{
 const host={fs:{constants:{O_DIRECTORY:1048576}}};prepareVirtualFilesystem(host);assert.equal(host.fs.constants.O_DIRECTORY,1048576);
 assert.throws(()=>prepareVirtualFilesystem({}),/matching Go shim/);
});
