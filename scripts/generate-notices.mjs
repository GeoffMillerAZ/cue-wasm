// License closure of the actual reader/engine dependency graph, including Go.
// Uses pinned build inputs; never fetches a license independently of its source.
import {execFileSync} from 'node:child_process';
import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {dirname, relative, resolve, sep} from 'node:path';
import {createHash} from 'node:crypto';
const env = {...process.env, GOTOOLCHAIN:'go1.24.4', GOOS:'js', GOARCH:'wasm', CGO_ENABLED:'0'};
const go = args => execFileSync('go', args, {env, encoding:'utf8', maxBuffer:32*1024*1024});
const goroot = go(['env','GOROOT']).trim();
const version = go(['env','GOVERSION']).trim();
const groups = new Map();
const licenseName = /^(?:licen[cs]e|copying|notice|patents|copyright)(?:[._-].*)?$/i;
function collect(id, root, dir) {
  let group = groups.get(id);
  if (!group) groups.set(id, group = new Map());
  root = resolve(root); dir = resolve(dir);
  if (dir !== root && !dir.startsWith(root + sep)) throw Error(`Dependency outside its source root: ${id}`);
  while (true) {
    for (const entry of readdirSync(dir, {withFileTypes:true})) {
      if (entry.isFile() && licenseName.test(entry.name)) {
        const path = resolve(dir,entry.name);
        group.set(relative(root,path).split(sep).join('/'), readFileSync(path,'utf8'));
      }
    }
    if (dir === root) break;
    dir = dirname(dir);
  }
}
collect(`Go ${version}`, goroot, goroot);
for (const tags of ['netgo,osusergo','netgo,osusergo,reader']) {
  const stream = go(['list','-mod=readonly','-deps','-tags',tags,'-json','.']);
  const deps = JSON.parse('[' + stream.trim().replace(/\n}\n{/g, '\n},{') + ']');
  for (const pkg of deps) {
    if (pkg.Module?.Main) continue; // package's own MIT LICENSE is shipped separately
    if (pkg.Standard || !pkg.Module) {
      if (pkg.Dir) collect(`Go ${version}`,goroot,pkg.Dir);
    } else {
      if (pkg.Module.Replace) throw Error('Replacement module needs an explicit license review');
      collect(`${pkg.Module.Path} ${pkg.Module.Version}`,pkg.Module.Dir,pkg.Dir);
    }
  }
}
let text = 'THIRD-PARTY NOTICES\nGenerated from pinned Go reader and engine dependency graphs.\nProject source is MIT; these upstream components retain their respective terms.\n\n';
for (const [id,files] of [...groups].sort(([a],[b])=>a < b ? -1 : a > b ? 1 : 0)) {
  if (!files.size) throw Error(`No license found for linked dependency: ${id}`);
  text += `COMPONENT: ${id}\n`;
  for (const [path,body] of [...files].sort(([a],[b])=>a < b ? -1 : a > b ? 1 : 0)) {
    const hash = createHash('sha256').update(body).digest('hex');
    text += `FILE: ${path}\nSHA256: ${hash}\n${body}${body.endsWith('\n')?'':'\n'}\n`;
  }
}
writeFileSync('bin/THIRD_PARTY_NOTICES.txt',text);
console.log(`Third-party notices: ${groups.size} components, ${Buffer.byteLength(text)} bytes`);
