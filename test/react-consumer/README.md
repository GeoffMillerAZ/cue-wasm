# Bounded installed React consumer verification

This private isolated fixture uses React/ReactDOM **19.2.0**, TypeScript **5.9.3**,
esbuild **0.25.12**, and React declaration pins **19.2.2**. The dependency lock is
local. Core runtime code is installed from the copied npm archive in `vendor/`,
SHA-256 `c35dbfcc8e6797fc00e88443e856f60756293cbd6dda2f8391df33dcd578fea1`.
The active `cue-wasm-1.4.5-landing-20261001.tgz` includes the empty-symbol contract
fix and upstream license notices. It is an unreleased local pack, not an npm
publication. Both earlier archives and their browser/type receipts are preserved;
`vendor/pin.json` records the previous and before-fix identities. Attribution for
those older archives is adjacent in `vendor/ATTRIBUTION.md`.

## Commands

From this directory:

```sh
npm ci --ignore-scripts --cache .npm-cache
npm test
npm run serve
```

Installation downloads only pinned official npm registry dependencies and the
local archive. Tooling, cache, lock and generated site stay in this directory.
No root build, Node global install, symlink, sibling package or CDN is needed.
After installation, type/build/server checks run without network services.
The WASM, shim, worker, React and ReactDOM assets are served from `site/`.

The server binds loopback and chooses an unused ephemeral port. Its first line is
JSON with **owned PID and URL**; stop that process with Ctrl-C or SIGTERM. No server
is started by `build`. `test:build` creates and closes its own ephemeral server.
Do not start an extra fixture server if main already mounts its handler.

## Main's browser step

Open the printed URL and click **Run verification**. The visible JSON and
`window.reactConsumerReceipt` progress through twelve groups. A successful run
ends with `status: "passed"`, `checks.length === 12`,
`workerObservation.live === 0`, and the pinned archive hash. Download the receipt
using the second button. Record browser version and actual result separately;
`evidence/build.json` is build evidence, not browser evidence.

For an existing local server, import the handler and mount the complete site at a
directory prefix (including trailing slash):

```js
import { createHandler } from './test/react-consumer/scripts/server.mjs';
const reactConsumer = await createHandler({ prefix: '/test/react-consumer/' });
// In main's request router, before the default handler:
if (req.url?.startsWith('/test/react-consumer/')) {
  return reactConsumer(req, res);
}
```

Or run `npm run serve -- 0 /test/react-consumer/` for an isolated server. The route
and self-hosted assets were checked under that prefix. A general static server
can also mount `site/` at a directory URL; retain correct JavaScript and WASM MIME.
The included handler supplies CSP allowing same-origin scripts/workers/fetch,
the exact inline import-map hash, and WASM compilation. It refuses traversal,
missing files, and methods other than GET/HEAD. The intentionally missing engine
must remain a 404; do not route it to an HTML fallback.

## Actual browser acceptance implemented

1. Real ReactDOM development StrictMode effect replay, real installed engine,
   initial worker cleanup, and all six hook helpers.
2. Invalid evaluation followed by successful evaluation on the same owner.
3. Equivalent inline options and ignored direct-loader path preserve ownership
   and helper identities.
4. Changed options replace/dispose the owner and saved helpers reject.
5. Active abort settles queued work, publishes the provider error, and retry
   restores successful evaluation.
6. Retry while work is pending disposes the prior owner and settles both promises.
7. Missing self-hosted WASM reports failure; retry performs another real attempt;
   corrected asset options recover.
8. Actual syntax-only reader refuses evaluation; switching back reloads engine.
9. Two simultaneous providers have independent workers and independent cleanup.
10. Unmount settles active work and saved helpers cannot publish late results.
11. Unmount during initialization terminates StrictMode attempts without late commits.
12. Three repeated mounts evaluate and dispose, with omitted/empty option equivalence
    and package-relative default asset URL resolution.

All hooks, DOM rendering, dedicated workers, shim and WASM are real. A transparent
native `Worker` subclass observes construction/termination only; it does not stub
messages, execution, fetch or lifecycle methods. The original constructor is
restored after the run. Each wait is capped at 35 seconds; requests at 10 seconds;
initialization at 30 seconds. There are no unbounded repeat loops. Run one fixture
at a time in its own tab. No memory/performance/support claim follows these checks.

## Deterministic gates and defects for main

`test:types` compiles the consumer and browser using strict NodeNext resolution
and `skipLibCheck: false`, with public package imports and no ambient package
shims. Twelve `@ts-expect-error` usages must compile; a second compilation strips
those directives and requires a diagnostic at each exact usage. Separate probes
record original package defects in `evidence/types-before-fix.json`:

- `@geoff4lf/cue-wasm/tools` exports `dist/workspace.js` with no declaration file
  (TS7016). Root-exported `Workspace` declarations compile.
- `CueWorkerError` runtime constructor is `(code, message)`, but its declaration
  inherits the standard Error constructor; the valid two-string call fails TS2559.

Main fixed both in root source/generation; the active
`cue-wasm-1.4.5-landing-20261001.tgz` preserves those fixes. The type gate
**requires both probes to pass**, and the positive consumer imports the tools
export and constructs a two-string CueWorkerError. Root/React success cannot
hide a missing tools declaration or incorrect constructor. Final results are
in `evidence/types.json`.
This fixture never modifies root runtime or declarations. Replacing the archive requires deliberate hash,
dependency lock and evidence updates; a root edit alone cannot change this fixture.

`test:build` checks archive/registry isolation, real bundled React/ReactDOM,
identical hashes on consecutive builds, and actual HTTP delivery/hash/MIME/import
closure including the real worker and WASM. `site/` is regenerated/ignored;
`evidence/` retains receipts and command outputs. These checks do not execute
browser JavaScript. Main owns actual browser acceptance and tracker integration.

## Current-source gate and final browser result

Maintainers run `node scripts/check-current.mjs ../..` after the current source build.
It compares public package contracts, the complete generated module/declaration tree,
WASM manifest and actual current asset hashes with the installed frozen archive.
Changed contracts or bytes fail: deliberately refresh the pin/lock and repeat acceptance.
The independent consumer itself still builds/runs without the source argument or checkout.
Synthetic negative tests reject changed declarations, exports and binary bytes. CI runs
this guard; this prevents an old passing consumer archive from certifying new source.

Final Chrome154/macOS actual12-group run under `/nested/` passed against1633ff54 archive,
20 native Workers created/terminated and0live. `evidence/browser-nested.json` and screenshot
retain it; no all-React-version, total-memory or production performance claim.

Landing refresh, 2026-10-01: the current archive passes the same actual twelve
Chrome154/macOS/React19.2 StrictMode groups under `/nested/`; 20 workers terminated,
zero live (`evidence/browser-landing.json`). Installed type/build/HTTP checks and
current-source archive parity also pass. The earlier nested receipt remains
historical and is not relabeled as current. Performance is still unqualified.
