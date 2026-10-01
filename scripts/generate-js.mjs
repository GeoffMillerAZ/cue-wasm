import {readFile,writeFile,mkdir} from 'node:fs/promises';
const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const root=new URL('../',import.meta.url),check=process.argv.includes('--check');
const files=[['internal/js/runtime-environment.js','dist/runtime-environment.js'],['internal/js/loader.js','dist/index.js'],['internal/js/worker-manager.js','dist/worker-manager.js'],['internal/js/worker.js','dist/worker.js'],['internal/js/workspace.js','dist/workspace.js'],['internal/js/index.d.ts','dist/index.d.ts'],['internal/js/workspace.d.ts','dist/workspace.d.ts'],['internal/react/index.js','dist/react/index.js'],['internal/react/index.d.ts','dist/react/index.d.ts']];
for(const [source,target] of files){
 let value=(await readFile(new URL(source,root),'utf8')).replaceAll('__VERSION__',pkg.version);
 if(source==='internal/js/worker.js')value=(await readFile(new URL('internal/js/runtime-environment.js',root),'utf8')).replace('export function prepareVirtualFilesystem','function prepareVirtualFilesystem')+'\n'+value;
 if(source.startsWith('internal/react/'))value=value.replaceAll('../../dist/index.js','../index.js').replaceAll('../../dist/index.d.ts','../index.d.ts');
 const destination=new URL(target,root);let current=null;try{current=await readFile(destination,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;}
 if(current===value)continue;
 if(check)throw Error(`Generated artifact drift: ${target}`);
 await mkdir(new URL('.',destination),{recursive:true});await writeFile(destination,value);
}
