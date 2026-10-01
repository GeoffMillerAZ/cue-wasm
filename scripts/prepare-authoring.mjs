import {mkdtemp,mkdir,readFile,writeFile,cp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const destination=resolve(process.argv[2]??'workspace/authoring');
// Never merge into an existing directory or replace a consumer's work.
await mkdir(destination,{recursive:false});
const scratch=await mkdtemp(join(tmpdir(),'cue-authoring-'));
try {
 const [pack]=JSON.parse(execFileSync('npm',['pack','--json','--offline','--ignore-scripts','--pack-destination',scratch],{cwd:root,encoding:'utf8',timeout:60000,env:{...process.env,npm_config_cache:join(scratch,'cache'),npm_config_update_notifier:'false'}}));
 const archive=join(scratch,pack.filename);
 execFileSync('tar',['-xzf',archive,'-C',scratch],{timeout:30000});
 const runtime=join(scratch,'package'),manifest=JSON.parse(await readFile(join(runtime,'bin/manifest.json'),'utf8'));
 for(const [name,asset] of Object.entries(manifest.assets)) {
   if(!/^[a-zA-Z0-9_.-]+$/.test(name)) throw Error('Invalid manifest asset path');
   if(createHash('sha256').update(await readFile(join(runtime,'bin',name))).digest('hex')!==asset.sha256) throw Error(`Asset mismatch: ${name}`);
 }
 await cp(join(root,'examples/authoring'),destination,{recursive:true});
 await cp(runtime,join(destination,'runtime'),{recursive:true});
 await writeFile(join(destination,'package-receipt.json'),JSON.stringify({schemaVersion:1,package:pack.name,version:pack.version,archiveSha256:createHash('sha256').update(await readFile(archive)).digest('hex'),manifest,source:'npm archive; independent static consumer; no browser verification implied'},null,2)+'\n');
 console.log(destination);
} catch(error) {await rm(destination,{recursive:true,force:true});throw error;}
finally {await rm(scratch,{recursive:true,force:true});}
