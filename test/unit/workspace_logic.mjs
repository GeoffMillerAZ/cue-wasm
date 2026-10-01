import test from 'node:test';
import assert from 'node:assert/strict';
import {Workspace} from '../../dist/index.js';
const pending=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
test('virtual paths reject traversal, URLs, selectors and aliases before mutating state',()=>{
 const ws=new Workspace();ws.addFile('a.cue','a:1',true);
 for(const path of ['', '/', '../a.cue','/a/../b.cue','a//b.cue','./a.cue','a\\b.cue','https://example.test/a.cue','x?','x*','a\0b','\ud800'])assert.throws(()=>ws.addFile(path,'bad'),{code:'path'});
 assert.deepEqual(ws.getOverlay(),{'/a.cue':'a:1'});assert.deepEqual(ws.getEntryPoints(),['/a.cue']);
 ws.addFile('/a.cue','a:2');assert.equal(ws.files.size,1);assert.equal(ws.getOverlay()['/a.cue'],'a:2');
});
test('formatting cannot overwrite changed, removed or replaced drafts',async()=>{
 for(const mutate of [ws=>ws.addFile('a.cue','new'),ws=>ws.removeFile('a.cue'),ws=>{ws.removeFile('a.cue');ws.addFile('a.cue','old');},ws=>{ws.clear();ws.addFile('a.cue','old');}]){
  const ws=new Workspace();ws.addFile('a.cue','old',true);const job=pending();const result=ws.formatFile('a.cue',{format:()=>job.promise});
  mutate(ws);const before=ws.getOverlay();job.resolve('formatted');await assert.rejects(result,{code:'stale_result'});assert.deepEqual(ws.getOverlay(),before);
 }
});
test('two concurrent formats admit only the first still-current completion',async()=>{
 const ws=new Workspace();ws.addFile('a.cue','a:1',true);const a=pending(),b=pending();
 const first=ws.formatFile('a.cue',{format:()=>a.promise}),second=ws.formatFile('a.cue',{format:()=>b.promise});
 b.resolve('a: 1\n');await second;a.resolve('old');await assert.rejects(first,{code:'stale_result'});assert.equal(ws.getOverlay()['/a.cue'],'a: 1\n');assert.deepEqual(ws.getEntryPoints(),['/a.cue']);
});
test('stale syntax and symbol results are rejected, including invalid old syntax',async()=>{
 for(const [method,engine,reject] of [['validateSyntax','parse',false],['validateSyntax','parse',true],['getSymbols','getSymbols',false]]){
  const ws=new Workspace();ws.addFile('a.cue','old');const job=pending(),result=ws[method]('a.cue',{[engine]:()=>job.promise});
  ws.addFile('a.cue','new');reject?job.reject(new Error('old diagnostic')):job.resolve('[]');await assert.rejects(result,{code:'stale_result'});
 }
});
test('module identity is escaped and unavailable files never invoke the engine',async()=>{
 const ws=new Workspace();ws.setModule('x"\nevil: true');assert.match(ws.getOverlay()['/cue.mod/module.cue'],/x\\"\\nevil/);
 let invoked=false;await assert.rejects(ws.formatFile('missing.cue',{format:()=>{invoked=true;}}),{code:'missing'});assert.equal(invoked,false);
 ws.addFile('a.cue','a:');assert.deepEqual(await ws.validateSyntax('a.cue',{parse:async()=>{throw new Error('{"message":"syntax"}');}}),{valid:false,error:{message:'syntax'}});
});

test('a parser rejection without a payload is still invalid syntax',async()=>{
 const ws=new Workspace();ws.addFile('a.cue','a:');
 assert.deepEqual(await ws.validateSyntax('a.cue',{parse:async()=>{throw undefined;}}),{valid:false,error:{message:'undefined'}});
});
