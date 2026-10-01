# @geoff4lf/cue-wasm

Official CUE evaluation and syntax tooling for browser and Node authoring tools.
Go owns CUE semantics; JavaScript owns loading and worker lifecycle. React is optional.
[Vision](VISION.md) · [Roadmap](docs/roadmap.md) · [Current evidence](docs/tracking/implementation_tracker.md)

## Browser worker

```js
import { loadWasmWorker } from '@geoff4lf/cue-wasm';
const cue = await loadWasmWorker({
  workerPath: '/cue/worker.js',
  enginePath: '/cue/cue-engine.wasm',
  wasmExecPath: '/cue/wasm_exec.js',
});
try {
  const json = await cue.unify({'app.cue': 'replicas: *3 | int'});
  console.log(json);
} finally {
  cue.dispose();
}
```

Copy the worker and matching assets from a prepared package to your hosting path.
For syntax-only tools pass mode: 'reader' and readerPath. The default engine is ready
for evaluation when initialization resolves; no second runtime loads automatically.
Prepared viewers can consume exported JSON without loading CUE at all.

## Try local authoring

The [configuration studio](examples/authoring/README.md) installs a verified npm archive
into a standalone static directory. Edit CUE, inspect resolved defaults and a structural
preview, correct diagnostics, and export only the current validated revision.
No app-kit, framework or service is required. It is a bounded example, not an IDE.

## Node and source builds

`loadWasm()` supports direct Node evaluation. `Workspace` manages virtual source files
and symbol parsing. Public declarations are in dist/index.d.ts; changes are described
in [migration](docs/design/runtime-migration.md). Browser workers provide stronger
lifecycle ownership than the legacy direct browser loader.

```sh
npm ci
npm run build:wasm       # pinned Go 1.24.4; builds matching shim and asset manifest
npm run test:native
npm test
npm run test:semantic    # fixed expected outcomes + native/WASM comparison
npm run check:generated
node test/browser/serve.mjs
```

Open the printed local URL and run actual worker checks. These are distinct from
mock lifecycle tests. Do not treat local success as all-browser production support.

## Status and security

This checkout is undergoing owner-authorized hardening; no new release is published.
Source CUE pin is v0.15.4. Engine, package and Go versions are separate metadata.
[Performance guidance](docs/performance_guide.md) distinguishes measured bytes from
startup and memory. [Security](SECURITY.md) describes current boundaries and gaps.
No paid provider, backend, Fathom checkout or private corpus is required.

MIT. Contributions follow [AGENTS.md](AGENTS.md) and [intent](docs/intent/README.md).

## Upstream attribution

`bin/THIRD_PARTY_NOTICES.txt` is generated from the pinned reader/engine dependency
graph, including Go and CUE. Keep it with redistributed WASM/shim assets; the package
MIT license does not replace upstream terms. The build manifest hashes the notice
and the installed-package gate rejects its omission. No license fetching is needed
beyond the pinned Go modules used by the build.
