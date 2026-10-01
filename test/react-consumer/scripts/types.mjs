import { readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { root, installedPackage } from './common.mjs';

await installedPackage();
const tsc = join(root, 'node_modules/typescript/bin/tsc');
const run = args => {
  const result = spawnSync(process.execPath, [tsc, ...args], { cwd: root, encoding: 'utf8', timeout: 30000 });
  if (result.error) throw result.error;
  return { status: result.status, output: result.stdout + result.stderr };
};
const generated = join(root, 'types/generated-negative.tsx');
const tools = join(root, 'types/generated-tools.ts');
const errorConstructor = join(root, 'types/generated-error.ts');
try {
  const positive = run(['-p', 'tsconfig.json', '--pretty', 'false']);
  assert.equal(positive.status, 0, positive.output);
  const text = await readFile(join(root, 'types/negative.tsx'), 'utf8');
  const lines = text.split('\n');
  const expected = lines.flatMap((line, i) => line.includes('@ts-expect-error') ? [i + 2] : []);
  await writeFile(generated, lines.map(line => line.includes('@ts-expect-error') ? '' : line).join('\n'));
  const negative = run(['-p', 'tsconfig.json', '--pretty', 'false']);
  assert.equal(negative.status, 2, negative.output);
  const diagnostics = [...negative.output.matchAll(/types\/generated-negative\.tsx\((\d+),\d+\): error TS\d+/g)].map(match => Number(match[1]));
  assert.deepEqual(diagnostics, expected, `Every negative must fail at its own usage:\n${negative.output}`);
  await rm(generated);

  // Mandatory public-export probes; before-fix results are retained separately.
  await writeFile(tools, "import { Workspace } from '@geoff4lf/cue-wasm/tools';\nnew Workspace();\n");
  const probe = run(['--strict', '--noEmit', '--skipLibCheck', 'false', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', '--pretty', 'false', 'types/generated-tools.ts']);
  await writeFile(errorConstructor, "import { CueWorkerError } from '@geoff4lf/cue-wasm';\nnew CueWorkerError('evaluation', 'failure');\n");
  const constructorProbe = run(['--strict', '--noEmit', '--skipLibCheck', 'false', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', '--pretty', 'false', 'types/generated-error.ts']);
  const result = {
    schemaVersion: 1, node: process.version,
    typescript: '5.9.3', publicRootAndReact: 'passed', skipLibCheck: false,
    positiveConsumerAndBrowserCompiled: true, negativeUsagesRejected: expected.length,
    toolsExport: probe.status === 0 ? 'passed' : 'defect', toolsDiagnostics: probe.output.trim(),
    workerErrorConstructor: constructorProbe.status === 0 ? 'passed' : 'defect', workerErrorDiagnostics: constructorProbe.output.trim(),
    browserExecution: 'not performed by this command',
  };
  await writeFile(join(root, 'evidence/types.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(`Public root/React declarations pass; ${expected.length} negative usages individually rejected.`);
  assert.equal(probe.status, 0, `Public ./tools declarations must pass:\n${probe.output}`);
  assert.equal(constructorProbe.status, 0, `Public CueWorkerError(code, message) must pass:\n${constructorProbe.output}`);
  console.log('Mandatory ./tools and CueWorkerError(code, message) declaration probes both pass.');
} finally {
  await Promise.all([rm(generated, { force: true }), rm(tools, { force: true }), rm(errorConstructor, { force: true })]);
}
