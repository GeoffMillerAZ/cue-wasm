import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {loadWasm} from '../../dist/index.js';
const source=await readFile(new URL('./corpus.json',import.meta.url),'utf8'),cases=JSON.parse(source);
const native=JSON.parse(execFileSync('go',['run','./test/semantic/native'],{input:source,encoding:'utf8',env:{...process.env,GOTOOLCHAIN:'go1.24.4'},timeout:120000}));
const cue=await loadWasm();
for(const [i,c] of cases.entries()){
 let result,error=false;try{result=await cue[c.action](...c.args);}catch(cause){error=true;if(!c.error)console.error(`${c.name}: ${cause instanceof Error ? cause.message : cause}`);}
 assert.equal(error,Boolean(c.error),`${c.name}: independently specified outcome`);
 if(!error)assert.equal(result,c.want,`${c.name}: exact JSON string preserves precision`);
 assert.deepEqual({name:c.name,error,...(!error?{result}:{})},native[i],`${c.name}: native/WASM equivalence`);
}
console.log(JSON.stringify({passed:cases.length,cueSource:'v0.15.4',oracle:'same pinned official engine native; fixed expected outcomes independently authored',limitations:['Not exhaustive language conformance','Diagnostic text/location equivalence not covered','No arbitrary module resolution qualified']}));
