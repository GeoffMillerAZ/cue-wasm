import test from 'node:test';
import assert from 'node:assert/strict';
import {WorkerManager} from '../../dist/worker-manager.js';
import {loadWasmWorker, Workspace} from '../../dist/index.js';

class FakeWorker {
    static instances=[];
    constructor(url){this.url=url;this.sent=[];this.terminations=0;FakeWorker.instances.push(this);}
    postMessage(message){this.sent.push(message);}
    terminate(){this.terminations++;}
    reply(result, success=true){this.onmessage?.({data:{id:this.sent.at(-1).id,success,result,error:success?undefined:result}});}
}
function setup(t,options={}){
    t.mock.method(globalThis,'Worker',FakeWorker);
    const manager=new WorkerManager('worker.js','engine.wasm','test',options),worker=FakeWorker.instances.at(-1);
    t.after(()=>manager.dispose());return {manager,worker};
}
// Node has no global Worker. Restore the exact previous descriptor after this file.
const previous=Object.getOwnPropertyDescriptor(globalThis,'Worker');
if(!previous)Object.defineProperty(globalThis,'Worker',{value:FakeWorker,writable:true,configurable:true});
process.on('exit',()=>{if(previous)Object.defineProperty(globalThis,'Worker',previous);else delete globalThis.Worker;});
async function ready(manager,worker){const loading=manager.init({wasmExecPath:'shim.js'});assert.equal(manager.state,'loading');worker.reply({mode:manager.mode});await loading;assert.equal(manager.state,'ready');}

test('readiness means selected engine ready; no background reader or hidden runtime',async t=>{
    t.mock.method(globalThis,'Worker',FakeWorker);
    const pending=loadWasmWorker({enginePath:'local.wasm',workerPath:'local-worker.js',wasmExecPath:'shim.js'}),worker=FakeWorker.instances.at(-1);
    assert.equal(worker.sent.length,1);assert.equal(worker.sent[0].payload.mode,'engine');assert.equal(worker.sent[0].payload.wasmPath,'local.wasm');
    let resolved=false;pending.then(()=>{resolved=true;});await Promise.resolve();assert.equal(resolved,false);
    worker.reply({mode:'engine'});const manager=await pending;assert.equal(manager.state,'ready');assert.equal(worker.sent.length,1);manager.dispose();
});
test('single active call, exact routing and immutable queued payloads',async t=>{
    const {manager,worker}=setup(t);await ready(manager,worker);
    const files={'a.cue':'a: 1'},a=manager.unify(files),b=manager.format('b:2');files['a.cue']='a: 99';
    assert.equal(worker.sent.length,2);assert.equal(worker.sent.at(-1).payload.overlay['a.cue'],'a: 1');
    worker.reply('{"a":1}');assert.equal(await a,'{"a":1}');assert.equal(worker.sent.at(-1).action,'format');worker.reply('b: 2');assert.equal(await b,'b: 2');assert.equal(manager.callbacks.size,0);
});
test('loading/unsupported/queue/input refusals do not dispatch extra work',async t=>{
    const {manager,worker}=setup(t,{maxPending:1,maxInputBytes:128});
    await assert.rejects(manager.parse('a: 1'),{code:'state'});await ready(manager,worker);
    const a=manager.parse('a:1');await assert.rejects(manager.parse('b:2'),{code:'queue_limit'});worker.reply('a: 1');await a;
    const count=worker.sent.length;
    await assert.rejects(manager.parse('x'.repeat(129)),{code:'input_limit'});
    await assert.rejects(manager.unify({'x.cue':3}),{code:'input'});
    await assert.rejects(manager.export('a:1','xml'),{code:'input'});assert.equal(worker.sent.length,count);
    manager.dispose();await assert.rejects(manager.parse('a:1'),{code:'state'});
});
test('reader supports syntax and explicitly refuses evaluation',async t=>{
    const {manager,worker}=setup(t,{mode:'reader'});await ready(manager,worker);
    for(const promise of [manager.unify(['a:1']),manager.validate('a:int','a:1'),manager.export('a:1','json')])await assert.rejects(promise,{code:'unsupported'});
    const syntax=manager.parse('a: 1');worker.reply('a: 1');assert.equal(await syntax,'a: 1');
});
test('evaluation errors settle one call and allow the next call',async t=>{
    const {manager,worker}=setup(t);await ready(manager,worker);
    const a=manager.validate('a:int','a:"bad"'),b=manager.parse('a:1');const refusal=assert.rejects(a,{code:'evaluation'});
    worker.reply('conflicting values',false);await refusal;worker.reply('a: 1');await b;assert.equal(manager.state,'ready');
});
test('queued cancellation removes only that request; active abort rejects all and terminates',async t=>{
    const {manager,worker}=setup(t);await ready(manager,worker);
    const active=new AbortController(),queued=new AbortController();
    const a=manager.parse('a:1',{signal:active.signal}),b=manager.parse('b:2',{signal:queued.signal});
    const qb=assert.rejects(b,{code:'aborted'});queued.abort();await qb;assert.equal(worker.terminations,0);assert.equal(manager.callbacks.size,1);
    const c=manager.parse('c:3'),qa=assert.rejects(a,{code:'aborted'}),qc=assert.rejects(c,{code:'aborted'});
    const late=worker.onmessage;active.abort();await Promise.all([qa,qc]);assert.equal(worker.terminations,1);assert.equal(manager.callbacks.size,0);assert.equal(manager.state,'failed');
    late({data:{id:2,success:true,result:'late'}});assert.equal(manager.callbacks.size,0);
});
test('deadlines include queue wait and kill active computation',async t=>{
    let now=0,id=0;const timers=new Map();
    t.mock.method(globalThis,'setTimeout',(fn,delay)=>{timers.set(++id,{fn,at:now+delay});return id;});
    t.mock.method(globalThis,'clearTimeout',key=>timers.delete(key));
    const tick=delta=>{now+=delta;for(const [key,entry] of [...timers])if(entry.at<=now){timers.delete(key);entry.fn();}};
    const {manager,worker}=setup(t);await ready(manager,worker);
    const a=manager.parse('a:1',{timeoutMs:20}),b=manager.parse('b:2',{timeoutMs:10});const qb=assert.rejects(b,{code:'timeout'});
    tick(10);await qb;assert.equal(manager.state,'ready');assert.equal(worker.terminations,0);
    const qa=assert.rejects(a,{code:'timeout'});tick(10);await qa;assert.equal(manager.state,'failed');assert.equal(worker.terminations,1);
});
test('crash, decoding failure, runtime exit and malformed reply settle active and queued work',async t=>{
    for(const kind of ['crash','decode','runtime','protocol']){
        const {manager,worker}=setup(t);await ready(manager,worker);const a=manager.parse('a:1'),b=manager.parse('b:2');
        const settled=Promise.allSettled([a,b]);
        if(kind==='crash')worker.onerror({});else if(kind==='decode')worker.onmessageerror();else if(kind==='runtime')worker.onmessage({data:{fatal:true}});else worker.onmessage({data:{id:2,success:'yes'}});
        assert.ok((await settled).every(r=>r.status==='rejected'));assert.equal(manager.callbacks.size,0);assert.equal(manager.state,'failed');
    }
});
test('disposal during initialization is idempotent and settles all pending work',async t=>{
    const {manager,worker}=setup(t),loading=manager.init();const refused=assert.rejects(loading,{code:'disposed'});
    manager.dispose();manager.dispose();await refused;assert.equal(worker.terminations,1);assert.equal(manager.callbacks.size,0);
});
test('failed initialization rejects loader and disposes the worker',async t=>{
    t.mock.method(globalThis,'Worker',FakeWorker);const pending=loadWasmWorker();const worker=FakeWorker.instances.at(-1),refused=assert.rejects(pending,{code:'evaluation'});
    worker.reply('asset missing',false);await refused;assert.ok(worker.terminations>=1);assert.equal(worker.onmessage,null);
});
test('export and Workspace symbol results have the same shape as direct engine',async t=>{
    const {manager,worker}=setup(t);await ready(manager,worker);
    const exported=manager.export('a:1','json');assert.equal(worker.sent.at(-1).action,'export');worker.reply('{"a":1}');assert.equal(await exported,'{"a":1}');
    const workspace=new Workspace();workspace.addFile('a.cue','a:1');const symbols=workspace.getSymbols('a.cue',manager);
    worker.reply('[{"name":"a","type":"field","line":1,"column":1}]');assert.equal((await symbols)[0].name,'a');
});

test('worker version remains callable and distinct from package identity', async t => {
 const {manager,worker}=setup(t);await ready(manager,worker);
 const result=manager.version();assert.equal(worker.sent.at(-1).action,'version');
 worker.reply('v1.4.5');assert.equal(await result,'v1.4.5');assert.equal(manager.packageVersion,'test');
});
