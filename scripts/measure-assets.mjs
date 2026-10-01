import {readFile} from 'node:fs/promises';
import {gzipSync,brotliCompressSync,constants} from 'node:zlib';
import {createHash} from 'node:crypto';
const assets=[];
for(const name of ['cue-reader.wasm','cue-engine.wasm','wasm_exec.js']){
 const bytes=await readFile(new URL(`../bin/${name}`,import.meta.url));
 assets.push({name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),gzip9:gzipSync(bytes,{level:9}).length,brotli5:brotliCompressSync(bytes,{params:{[constants.BROTLI_PARAM_QUALITY]:5}}).length});
}
console.log(JSON.stringify({schemaVersion:1,node:process.version,compression:{gzipLevel:9,brotliQuality:5},assets,limitations:['Transfer sizes only; not startup or peak memory','Server must serve matching Content-Encoding; browser decompression costs not measured','Existing binary provenance must be checked separately']},null,2));
