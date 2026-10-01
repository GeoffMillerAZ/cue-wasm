# Independent CUE configuration studio

A real local authoring consumer of the packaged official CUE engine. Edit a bounded
workspace configuration, inspect defaults, preview its structure/theme, format and
export current validated JSON. Panels have no connected data. This example's schema
is not the app-kit investigation model and its CSS is not a new app-kit token source.

From a prepared source checkout (built assets present):

```sh
mkdir -p workspace
npm run example:authoring
node scripts/serve-authoring.mjs
```

Open the printed loopback URL. Preparation refuses an existing destination; pass a
new empty destination path to `node scripts/prepare-authoring.mjs <path>` to create
another consumer. Its parent must exist. Serve that directory using any static server
with `application/wasm` MIME support; no Go/backend, sibling checkout, registry or
provider is used by the running browser. All modules and runtime assets are local.
Do not open as file://. The development server sends a restrictive same-origin CSP.

The prepared directory includes the verified npm archive's runtime and a manifest/
archive-hash receipt. The archive retains the legacy engine for compatibility; only
the selected engine loads. Keep compressed transfer, archive size and initialized
memory claims separate. No zero-startup claim is made.

Click Start evaluator, then Evaluate. Edits invalidate Download immediately. Invalid
input leaves a visibly stale last-good preview. Cancel or Stop evaluator terminates the worker; Start
creates a new owner and keeps the draft. Format never applies over a newer edit.
There is no automatic persistence: download before navigating away. Exported JSON
can be consumed without WASM. CUE constrains shape; it does not establish source truth.

Verification: `npm run test:authoring` checks revision/ownership races plus fixed
native/WASM schema outcomes. Browser steps: evaluate defaults; change limit to1001
and confirm error/stale/disabled download; correct and format; evaluate by keyboard;
check light appearance and literal HTML-looking titles; download and compare JSON;
inspect narrow layout. Loading/cancel/crash behavior has separate runtime tests.
Full accessibility, sustained resource use and cross-browser qualification remain
explicit acceptance work; a working example is not production certification.
