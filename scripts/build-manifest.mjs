import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const hash=async path=>createHash('sha256').update(await readFile(path)).digest('hex');
const pkg=JSON.parse(await readFile('package.json','utf8'));
const sources=['main.go','go.mod','go.sum','build.sh','scripts/build-manifest.mjs',...(await readdir('internal/core')).filter(n=>n.endsWith('.go')&&!n.endsWith('_test.go')).map(n=>`internal/core/${n}`)].sort();
const assets={};for(const name of ['cue-reader.wasm','cue-engine.wasm','cue.wasm','wasm_exec.js'])assets[name]={sha256:await hash(`bin/${name}`),bytes:(await readFile(`bin/${name}`)).length};
const manifest={schemaVersion:1,packageVersion:pkg.version,go:execFileSync('go',['env','GOVERSION'],{encoding:'utf8'}).trim(),cue:execFileSync('go',['list','-m','-f','{{.Version}}','cuelang.org/go'],{encoding:'utf8'}).trim(),target:'js/wasm',flags:['-mod=readonly','-trimpath','-buildvcs=false','-s','-w'],optimizer:'none',tags:{reader:['netgo','osusergo','reader'],engine:['netgo','osusergo']},linkerPackageVersion:`v${pkg.version}`,sourceHashes:Object.fromEntries(await Promise.all(sources.map(async p=>[p,await hash(p)]))),assets};
await writeFile('bin/manifest.json',JSON.stringify(manifest,null,2)+'\n');
