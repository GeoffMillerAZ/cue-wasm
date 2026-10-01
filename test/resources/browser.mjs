import {loadWasmWorker} from './runtime/dist/index.js';
const el=id=>document.getElementById(id);
let controller;
el('cancel').onclick=()=>controller?.abort();
window.addEventListener('pagehide',()=>controller?.abort());
el('run').onclick=async()=>{
 el('run').disabled=true;el('cancel').disabled=false;el('result').textContent='';controller=new AbortController();
 const result={schemaVersion:1,workload:'authoring-resources-v1',userAgent:navigator.userAgent,cache:'retained browser/compiler caches; HTTP no-store',transport:'loopback raw assets',samples:[],metricsUnavailable:['total process/worker/WASM memory','cold startup','constrained machine','production network/compression'],passed:false};
 try{
  const [schema,draft]=await Promise.all(['schema.cue','draft.cue'].map(async p=>{const r=await fetch(p,{signal:controller.signal});if(!r.ok)throw Error(`fixture ${r.status}`);return r.text();}));
  for(let pair=0;pair<10;pair++)for(const mode of ['engine','reader']){
   if(controller.signal.aborted)throw Error('Cancelled');
   let worker;const start=performance.now();el('status').textContent=`Pair ${pair+1}/10 · ${mode}`;
   try{
    worker=await loadWasmWorker({mode,maxPending:1,maxInputBytes:131072,timeoutMs:10000,initializationTimeoutMs:30000,signal:controller.signal});
    const ready=performance.now();
    const output=mode==='engine'?await worker.unify({'/schema.cue':schema,'/draft.cue':draft},undefined,undefined,{signal:controller.signal})
      :await worker.format(draft,{signal:controller.signal});
    const complete=performance.now();
    if(mode==='engine'){const value=JSON.parse(output);if(value.title!=='Deployment review'||value.panels.length!==3)throw Error('Wrong evaluation output');}
    else if(!output.includes('Deployment review'))throw Error('Wrong format output');
    worker.dispose();const disposed=performance.now();
    result.samples.push({pair,mode,initMs:ready-start,callMs:complete-ready,lifetimeMs:disposed-start,disposeCallMs:disposed-complete,state:worker.state});
   }finally{worker?.dispose();}
  }
  const percentile=(xs,p)=>xs.sort((a,b)=>a-b)[Math.ceil(xs.length*p)-1];
  result.summary=Object.fromEntries(['engine','reader'].map(mode=>[mode,Object.fromEntries(['initMs','callMs','lifetimeMs','disposeCallMs'].map(key=>[key,{p50:percentile(result.samples.filter(x=>x.mode===mode).map(x=>x[key]),.5),p95:percentile(result.samples.filter(x=>x.mode===mode).map(x=>x[key]),.95)}]))]));
  result.passed=result.samples.length===20 && result.samples.every(x=>x.state==='disposed') && Object.values(result.summary).every(x=>x.initMs.p95<=1500 && x.callMs.p95<=100);
  el('status').textContent=result.passed?'Timing screen passed; memory and cold-start qualification unavailable.':'Screen failed; inspect retained samples.';
 }catch(error){result.error=String(error.message??error);el('status').textContent='Screen incomplete; inspect error.';}
 finally{el('run').disabled=false;el('cancel').disabled=true;el('result').textContent=JSON.stringify(result,null,2);}
};
