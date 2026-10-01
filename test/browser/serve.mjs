import http from 'node:http';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url);
let assets=root,scratch;
if(process.argv.includes('--installed')){
 scratch=await mkdtemp(join(tmpdir(),'cue-browser-package-'));
 try{
  const [pack]=JSON.parse(execFileSync('npm',['pack','--json','--offline','--ignore-scripts','--pack-destination',scratch],{cwd:fileURLToPath(root),encoding:'utf8',timeout:60000,env:{...process.env,npm_config_cache:join(scratch,'npm-cache'),npm_config_update_notifier:'false'}}));
  const archive=join(scratch,pack.filename);
  execFileSync('tar',['-xzf',archive,'-C',scratch],{timeout:30000});
  assets=pathToFileURL(join(scratch,'package')+'/');
  const manifest=JSON.parse(await readFile(new URL('bin/manifest.json',assets),'utf8'));
  for(const [name,expected] of Object.entries(manifest.assets)){
   const bytes=await readFile(new URL(`bin/${name}`,assets));
   if(createHash('sha256').update(bytes).digest('hex')!==expected.sha256)throw Error(`Packaged asset mismatch: ${name}`);
  }
  await writeFile(new URL('test/browser/installed-receipt.json',root),JSON.stringify({schemaVersion:1,archiveSha256:createHash('sha256').update(await readFile(archive)).digest('hex'),manifest,source:'npm archive; source checkout used for test harness only',browserResult:'record separately; server startup is not browser proof'},null,2)+'\n');
 }catch(error){await rm(scratch,{recursive:true,force:true});throw error;}
}
const allowed=new Set(['test/browser/runtime.html','test/browser/runtime.mjs','dist/index.js','dist/runtime-environment.js','dist/worker.js','dist/worker-manager.js','dist/workspace.js','bin/cue-reader.wasm','bin/cue-engine.wasm','bin/wasm_exec.js']);
const server=http.createServer(async(req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname.slice(1);
 if(req.method!=='GET'||!allowed.has(path)){res.writeHead(404);res.end();return;}
 try{const bytes=await readFile(new URL(path,path.startsWith('test/')?root:assets));res.writeHead(200,{'Content-Type':path.endsWith('.wasm')?'application/wasm':path.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8','Cache-Control':'no-store'});res.end(bytes);}
 catch{res.writeHead(404);res.end();}
});
server.listen(0,'127.0.0.1',()=>console.log(`http://127.0.0.1:${server.address().port}/test/browser/runtime.html (${scratch?'installed package':'source assets'})`));
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{server.close(async()=>{if(scratch)await rm(scratch,{recursive:true,force:true});});server.closeAllConnections();});
