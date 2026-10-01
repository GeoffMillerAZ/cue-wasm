import {loadWasmWorker,Workspace} from '../../dist/index.js';
const button=document.querySelector('#run'),output=document.querySelector('#result');
const check=(ok,message)=>{if(!ok)throw Error(message);};
const refused=async(promise,code)=>{try{await promise;}catch(error){check(error.code===code,`Expected ${code}, got ${error.code}`);return;}throw Error(`Expected ${code} refusal`);};
button.onclick=async()=>{
 button.disabled=true;const owners=new Set(),receipt={status:'running',checks:[],environment:{userAgent:navigator.userAgent,width:innerWidth,height:innerHeight},performanceQualified:false};
 const stage=name=>{receipt.checks.push(name);output.textContent=JSON.stringify(receipt,null,2);};
 const load=async options=>{const instance=await loadWasmWorker(options);owners.add(instance);return instance;};
 try{
  let cue=await load();check(cue.state==='ready','not ready at load resolution');
  check(JSON.parse(await cue.unify({'a.cue':'package main\na: int','b.cue':'package main\na: 3'})).a===3,'unification mismatch');
  check(JSON.parse(await cue.export('a: 3','json')).a===3,'export mismatch');
  const workspace=new Workspace();workspace.addFile('a.cue','package main\na: 3');check((await workspace.getSymbols('a.cue',cue)).some(s=>s.name==='a'),'symbol contract mismatch');
  stage('actual engine ready on resolution; unification/export and Workspace symbols agree');
  await refused(cue.validate('a: int','a: "wrong"'),'evaluation');check(await cue.validate('a: int','a: 3')===true,'engine failed after invalid input');stage('invalid source rejected; valid next request recovers');
  check(await cue.version()==='v1.4.5','version not callable');check(await cue.validate('int & >0','3')===true,'scalar validation');check(await cue.validate('[...int]','[1,2]')===true,'list validation');await refused(cue.validate('let Limit = 10\nx: int & <Limit','let Limit = 100\nx: 90\ny: Limit'),'evaluation');stage('rebuilt engine: callable version and independent schema/data semantics');
  const files={
   'cue.mod/module.cue':'module: "example.test/work@v0"\nlanguage: version: "v0.12.0"',
   'main.cue':'package main\nimport "example.test/work/lib"\nanswer: lib.value',
   'lib/lib.cue':'package lib\nvalue: 42'
  };
  check(JSON.parse(await cue.unify(files,['main.cue'])).answer===42,'local import failed');
  files['lib/lib.cue']='package lib\nvalue: 43';
  check(JSON.parse(await cue.unify(files,['main.cue'])).answer===43,'changed local import stayed stale');
  delete files['lib/lib.cue'];await refused(cue.unify(files,['main.cue']),'evaluation');
  await refused(cue.unify({'../escape.cue':'a:1'}),'evaluation');
  await refused(cue.unify({'a.cue':'a:1','/a.cue':'a:2'}),'evaluation');
  await refused(cue.unify({'a.cue':'a:1'},['missing.cue']),'evaluation');
  await refused(cue.unify({
   'cue.mod/module.cue':'module: "example.test/work@v0"\nlanguage: version: "v0.12.0"\ndeps: "example.test/remote@v0": v: "v0.1.0"',
   'main.cue':'package main\nimport "example.test/remote"\nx: remote.value'
  },['main.cue']),'evaluation');
  stage('local modules update and disappear correctly; path aliases, traversal, missing entries and remote modules refused');
  workspace.addFile('draft.cue','a:1');
  const format=workspace.formatFile('draft.cue',cue);
  workspace.removeFile('draft.cue');workspace.addFile('draft.cue','a:1');
  await refused(format,'stale_result');check(workspace.getOverlay()['/draft.cue']==='a:1','late format overwrote replacement draft');
  check((await workspace.validateSyntax('draft.cue',cue)).valid,'current draft syntax failed');
  stage('real worker formatting cannot overwrite a replaced draft; current validation recovers');
  const abort=new AbortController(),a=cue.unify(['a: 4'],[],[],{signal:abort.signal}),b=cue.parse('b: 1');
  const rejections=Promise.all([refused(a,'aborted'),refused(b,'aborted')]);abort.abort();await rejections;check(cue.state==='failed','active abort did not terminate owner');cue.dispose();cue.dispose();stage('active cancellation settles queued work; disposal is repeatable');
  for(let i=0;i<3;i++){cue=await load();check(JSON.parse(await cue.unify(['answer: 42'])).answer===42,'restart failed');cue.dispose();}
  stage('three independent engine mount/evaluate/dispose cycles');
  const reader=await load({mode:'reader'});await reader.format('a:1');await refused(reader.unify(['a:1']),'unsupported');reader.dispose();stage('explicit reader capability refuses evaluation');
  await refused(load({enginePath:new URL('./missing-engine.wasm',location.href).href}),'evaluation');stage('missing asset refuses initialization');
  const loadingAbort=new AbortController(),loading=load({signal:loadingAbort.signal});const rejection=refused(loading,'aborted');loadingAbort.abort();await rejection;stage('abort during initialization rejects and releases worker');
  cue=await load();check(await cue.validate('answer: int','answer: 42')===true,'final retry failed');cue.dispose();stage('fresh owner works after failed/aborted initialization');
  receipt.status='passed';
 }catch(error){receipt.status='failed';receipt.error=String(error?.stack??error);}
 finally{for(const owner of owners)owner.dispose();receipt.disposed=[...owners].every(owner=>owner.state==='disposed');output.textContent=JSON.stringify(receipt,null,2);button.disabled=false;}
};
