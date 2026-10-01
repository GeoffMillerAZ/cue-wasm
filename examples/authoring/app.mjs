import {loadWasmWorker} from './runtime/dist/index.js';
import {createAuthoringSession} from './session.mjs';
const el = id => document.getElementById(id);
const [schema,draft] = await Promise.all(['schema.cue','draft.cue'].map(async path => {
  const response = await fetch(new URL(path,import.meta.url)); if(!response.ok) throw Error(`Could not load ${path}`); return response.text();
})).catch(error=>{el('status').textContent='Example files could not load. Reload to retry.'; throw error;});
el('draft').value=draft; el('schema').textContent=schema;
let renderedRevision=-1;
const session=createAuthoringSession({load:loadWasmWorker,schema,draft,onChange:render});
function render(state) {
  const busy=['loading','evaluating','formatting'].includes(state.phase);
  el('start').disabled=busy || state.phase==='ready';
  el('start').textContent=state.phase==='failed'?'Retry evaluator':'Start evaluator';
  el('evaluate').disabled=el('format').disabled=state.phase!=='ready';
  el('cancel').disabled=!busy && state.phase!=='ready';
  el('cancel').textContent=busy?'Cancel':'Stop evaluator'; el('download').disabled=!state.fresh;
  const phases={idle:'Evaluator not loaded.',loading:'Loading official CUE engine…',ready:'Evaluator ready.',evaluating:'Evaluating draft…',formatting:'Formatting draft…',failed:'Evaluator unavailable. Retry to recover; your draft is preserved.'};
  el('status').textContent=phases[state.phase];
  el('error').hidden=!state.error; el('error').textContent=state.error??'';
  el('freshness').textContent=state.preview ? state.fresh?'Current draft':'Previous result · draft changed':'Not evaluated';
  if(el('draft').value!==state.draft) el('draft').value=state.draft;
  if(state.preview && renderedRevision!==state.previewRevision) {
    renderedRevision=state.previewRevision;
    const config=state.preview, title=document.createElement('h3'), list=document.createElement('ul');
    title.textContent=config.title;
    for(const panel of config.panels){
      const item=document.createElement('li'),name=document.createElement('strong'),detail=document.createElement('span');
      name.textContent=panel.title; detail.textContent=`${panel.kind} · limit ${panel.limit}`; item.append(name,detail);list.append(item);
    }
    el('preview').replaceChildren(title,list); el('preview').dataset.appearance=config.appearance;
    // Only the closed CUE schema's six-digit hex color crosses into CSS.
    if(/^#[0-9a-f]{6}$/i.test(config.accent)) el('preview').style.setProperty('--preview-accent',config.accent);
    el('json').textContent=JSON.stringify(config,null,2);
  }
}
el('start').onclick=()=>session.start();el('evaluate').onclick=()=>session.evaluate();el('format').onclick=()=>session.format();el('cancel').onclick=()=>session.cancel();
el('draft').addEventListener('input',()=>{try{session.edit(el('draft').value);}catch(error){el('draft').value=session.snapshot().draft;el('error').hidden=false;el('error').textContent=error.message;}});
el('download').onclick=()=>{
  const url=URL.createObjectURL(new Blob([session.exportJSON()],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='workspace-config.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
window.addEventListener('pagehide',()=>session.cancel());
render(session.snapshot());
