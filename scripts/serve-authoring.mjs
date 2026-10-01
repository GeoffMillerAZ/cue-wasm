import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
const root=resolve(process.argv[2]??'workspace/authoring');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.wasm':'application/wasm','.cue':'text/plain; charset=utf-8','.json':'application/json'};
const server=http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(req.method!=='GET'||!path.startsWith(root+sep)||!types[extname(path)]){res.writeHead(404);res.end();return;}
  const data=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(data);
 }catch{res.writeHead(404);res.end();}
});
server.listen(0,'127.0.0.1',()=>console.log(`http://127.0.0.1:${server.address().port}/`));
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{server.close();server.closeAllConnections();});
