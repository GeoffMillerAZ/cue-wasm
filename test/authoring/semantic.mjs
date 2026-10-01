import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {loadWasm} from '../../dist/index.js';
const schema=await readFile(new URL('../../examples/authoring/schema.cue',import.meta.url),'utf8');
const draft=await readFile(new URL('../../examples/authoring/draft.cue',import.meta.url),'utf8');
const base='title: "Review"\npanels: [{title: "Map", kind: "diagram"}]';
const cases=[
 {name:'defaults',draft:base,want:{format:'cue-wasm.authoring-example.v1',title:'Review',appearance:'dark',accent:'#818cf8',panels:[{title:'Map',kind:'diagram',limit:100}]}},
 {name:'example',draft,want:{format:'cue-wasm.authoring-example.v1',title:'Deployment review',appearance:'dark',accent:'#818cf8',panels:[{title:'Architecture',kind:'diagram',limit:250},{title:'Recent changes',kind:'timeline',limit:100},{title:'Resource inventory',kind:'table',limit:50}]}},
 {name:'missing-title',draft:'panels: [{title: "Map",kind:"diagram"}]',error:true},
 {name:'unknown-field',draft:base+'\nsecret: "extra"',error:true},
 {name:'bad-color',draft:base+'\naccent: "url(https://example.com)"',error:true},
 {name:'empty-panels',draft:'title:"Review"\npanels: []',error:true},
 {name:'too-many-panels',draft:'title:"Review"\npanels: ['+Array(7).fill('{title:"Map",kind:"diagram"}').join(',')+']',error:true},
 {name:'unbounded-query',draft:base.replace('kind: "diagram"','kind: "diagram",limit:1001'),error:true},
 {name:'invalid-kind',draft:base.replace('"diagram"','"execute"'),error:true},
 {name:'bad-syntax',draft:'title: {',error:true},
];
const inputs=cases.map(c=>({name:c.name,action:'unify',args:[{'/schema.cue':schema,'/draft.cue':c.draft},null,null]}));
const native=JSON.parse(execFileSync('go',['run','./test/semantic/native'],{input:JSON.stringify(inputs),encoding:'utf8',env:{...process.env,GOTOOLCHAIN:'go1.24.4'},timeout:120000}));
const wasm=await loadWasm();
for(const [i,c] of cases.entries()){
 let error=false,result;try{result=await wasm.unify(...inputs[i].args);}catch(cause){error=true;if(!c.error)console.error(cause);}
 assert.equal(error,!!c.error,`${c.name}: WASM outcome`);assert.equal(native[i].error,!!c.error,`${c.name}: native outcome`);
 if(!error){assert.deepEqual(JSON.parse(result),c.want,`${c.name}: independently authored expected defaults`);assert.equal(result,native[i].result,`${c.name}: native/WASM equality`);}
}
console.log(JSON.stringify({passed:cases.length,source:'authoring schema; official CUE v0.15.4 native and WASM',browser:false}));
