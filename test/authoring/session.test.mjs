import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAuthoringSession} from '../../examples/authoring/session.mjs';
const deferred = () => {let resolve, reject; const promise = new Promise((a,b) => {resolve=a; reject=b;}); return {promise,resolve,reject};};
function setup() {
  const work = deferred(); let disposals = 0, changes = 0;
  const worker = {state:'ready', unify: () => work.promise, format: () => work.promise, dispose() {disposals++;}};
  const session = createAuthoringSession({load:async()=>worker,schema:'#Config',draft:'title: "First"',onChange:()=>changes++});
  return {session,worker,work,get disposals(){return disposals;},get changes(){return changes;}};
}
test('only evaluated current revision exports; returned preview cannot mutate owner', async()=>{
  const {session,work} = setup(); await session.start();
  assert.throws(()=>session.exportJSON(),/Evaluate/);
  const run=session.evaluate(); work.resolve('{"title":"First"}'); assert.equal(await run,true);
  const view=session.snapshot(); view.preview.title='Changed';
  assert.equal(JSON.parse(session.exportJSON()).title,'First');
  session.edit('title: "Next"'); assert.equal(session.snapshot().fresh,false);
  assert.equal(session.snapshot().preview.title,'First'); assert.throws(()=>session.exportJSON(),/Evaluate/);
});
for(const kind of ['evaluate','format']) test(`late ${kind} never changes edited draft or preview`, async()=>{
  const {session,work}=setup(); await session.start(); const run=session[kind]();
  session.edit('title: "New"'); work.resolve(kind==='format'?'title: "Old"':'{"title":"Old"}');
  assert.equal(await run,false); assert.equal(session.snapshot().draft,'title: "New"');
  assert.equal(session.snapshot().preview,null); assert.equal(session.snapshot().phase,'ready');
});
test('cancel retires owner, preserves draft and refuses late result',async()=>{
  const s=setup(); await s.session.start(); const run=s.session.evaluate(); s.session.cancel();
  s.work.resolve('{"title":"Late"}'); assert.equal(await run,false); assert.equal(s.disposals,1);
  assert.equal(s.session.snapshot().phase,'idle'); assert.equal(s.session.snapshot().preview,null);
});
test('replaced initialization disposes late owner',async()=>{
  const a=deferred(),b=deferred(); let calls=0,disposed=0;
  const session=createAuthoringSession({load:()=>++calls===1?a.promise:b.promise,schema:'',draft:''});
  const first=session.start(),second=session.start();
  b.resolve({state:'ready',dispose(){}}); await second;
  a.resolve({state:'ready',dispose(){disposed++;}}); assert.equal(await first,false); assert.equal(disposed,1);
  assert.equal(session.snapshot().phase,'ready'); session.dispose();
});
test('failure is recoverable and duplicate evaluations do not queue',async()=>{
  const s=setup(); await s.session.start(); const run=s.session.evaluate();
  assert.equal(await s.session.evaluate(),false); s.work.reject(Error('invalid draft'));
  assert.equal(await run,false); assert.match(s.session.snapshot().error,/invalid draft/);
  assert.equal(s.session.snapshot().phase,'ready');
});
test('dispose prevents all late notifications, is idempotent and rejects edits',async()=>{
  const s=setup(); await s.session.start(); const run=s.session.evaluate(); s.session.dispose(); s.session.dispose();
  const count=s.changes; s.work.resolve('{}'); await run;
  assert.equal(s.changes,count); assert.equal(s.disposals,1); assert.throws(()=>s.session.edit('x'),/disposed/);
});
test('input bounds reject bytes beyond limit without altering draft',()=>{
  const {session}=setup(); assert.throws(()=>session.edit('é'.repeat(32769)),/64 KiB/);
  assert.equal(session.snapshot().revision,0);
});
test('initialization failure retries with finite worker budgets and preserves edits',async()=>{
  let calls=0,received;
  const session=createAuthoringSession({schema:'',draft:'old',load:async options=>{
    received=options;if(++calls===1)throw Error('fetch failed');return {state:'ready',dispose(){}};
  }});
  assert.equal(await session.start(),false);assert.equal(session.snapshot().phase,'failed');
  session.edit('new');assert.equal(await session.start(),true);assert.equal(session.snapshot().draft,'new');
  assert.equal(received.mode,'engine');assert.equal(received.maxPending,1);assert.equal(received.maxInputBytes,131072);
  assert.equal(received.timeoutMs,10000);assert.equal(received.initializationTimeoutMs,30000);session.dispose();
});
test('worker crash enters retry state, never presenting invalid fresh output',async()=>{
  const s=setup();await s.session.start();const run=s.session.evaluate();s.worker.state='failed';s.work.reject(Error('worker crashed'));
  assert.equal(await run,false);assert.equal(s.session.snapshot().phase,'failed');assert.equal(s.disposals,1);
  assert.equal(s.session.snapshot().fresh,false);assert.match(s.session.snapshot().error,/crashed/);
});
test('structured diagnostics preserve source context without raw JSON wrappers',async()=>{
  const {diagnosticMessage}=await import('../../examples/authoring/session.mjs');
  assert.equal(diagnosticMessage(Error('{"message":"invalid field","file":"/draft.cue","line":3,"details":"limit exceeds bound"}')),'/draft.cue:3: invalid field\nlimit exceeds bound');
  assert.equal(diagnosticMessage(Error('fetch failed')),'fetch failed');
});
