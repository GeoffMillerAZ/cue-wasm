import {readFile,readdir,access} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const docs=(await readdir('docs/intent')).filter(n=>n.endsWith('.md')).map(n=>`docs/intent/${n}`);
const records=(await readdir('docs/adr')).filter(n=>/^\d+.*\.md$/.test(n)).map(n=>`docs/adr/${n}`);
for(const file of [...docs,'docs/adr/README.md',...records]){
 const source=await readFile(file,'utf8');assert.ok(source.split('\n').length<=(file.endsWith('intent/README.md')||records.includes(file)?80:150),`${file}: line budget`);
 for(const match of source.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)){
  if(!/^(https?:|mailto:)/.test(match[1]))await access(path.resolve(path.dirname(file),match[1]));
 }
 if(records.includes(file)){assert.match(source,/Status: /);assert.match(source,/## Revisit when/);}
}
const index=await readFile('docs/adr/README.md','utf8');for(const record of records)assert.ok(index.includes(`](${path.basename(record)})`),`${record}: absent from index`);
const stanza=async file=>(await readFile(file,'utf8')).split('## Project intent\n')[1].split('## Working boundaries')[0].replace(/\s+/g,' ').trim();
assert.ok(await stanza('AGENTS.md'),'AGENTS.md: intent stanza missing');
const changes=await readFile('CHANGELOG.md','utf8');assert.match(changes,/## \[Unreleased\]\nRelease impact:/);
assert.match(await readFile('docs/intent/scope.md','utf8'),/## Compatibility surface/);
console.log('Intent structural subset passed: budgets, links, ADR shape/index, intent stanza in AGENTS.md, changelog, compatibility. Not host loading or semantic truth.');
