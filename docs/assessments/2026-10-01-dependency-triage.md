# Bounded dependency security triage — cue-wasm

Snapshot observed 2026-10-01T10:07:43.386350+00:00 during the completed bounded triage; persisted from cache on 2026-10-01 without refreshing APIs or security evidence. Original inspection was read-only except its cache report and sanitized JSON. Existing gh API authentication worked; no login/auth changes, Git commands, installs, builds, provider calls, global configuration or source edits. No tests executed. Bounded to five minutes.

## Result and concrete next work

**At the recorded observation, no open critical/high alerts in the live API. One open moderate alert remains: #48, golang.org/x/net v0.46.0, affected <0.55.0, first patched v0.55.0.** GitHub returns 68 records: fixed 1 critical / 24 high / 37 moderate / 5 low; open 1 moderate. The pre-existing sanitized cache snapshot agrees. The reported push warning of 56 (1/20/31/4) is historical and is not reproduced by current API state. “Fixed” is GitHub dependency-graph state, not proof that historical installations were upgraded or that exploits are impossible.

1. **Next maintenance unit: resolve #48 without disturbing diagram UX.** Keep CUE v0.15.4 initially. Plan golang.org/x/net v0.46.0 → v0.55.0 (smallest advisory patch). Upstream v0.55.0/go.mod requires Go 1.25.0 and declares x/crypto v0.51.0, x/sys v0.45.0, x/term v0.43.0, x/text v0.37.0. Go 1.24.4 cannot be kept for this normal upstream upgrade. Go 1.25.0 is the minimum compatibility floor, not a claim that this initial patch is the appropriate secure toolchain today. Select an exact supported Go patch in a separately verified maintenance unit and review the resolved graph before accepting it. The owner has already fully authorized maintenance; no extra approval is required. This documentation-only persistence does not perform that maintenance. Do not silently auto-download a toolchain or bump CUE. A local backport/replace would be a separate security-sensitive divergence requiring its own review, not the default recommendation.
2. First establish affected-package reachability for both engine and reader with an offline, pinned GOOS=js GOARCH=wasm package graph under both build tag sets (netgo,osusergo and netgo,osusergo,reader); retain paths and affected Parse/ParseFragment calls. Run a current Go vulnerability scan only in the maintenance scope with explicit tooling/database provenance. Toolchain standard-library advisories are a separate gap: Dependabot go.mod results do not audit Go 1.24.4.
3. Validate the maintenance change using the exact commands below, refresh manifest/notices/shim and installed archive evidence, and confirm #48 resolution through the GitHub API. No emergency npm upgrade is indicated by the current alert set.

## Revision comparison and dependency boundaries

[Remote comparison](https://github.com/GeoffMillerAZ/cue-wasm/compare/59a445b...03d514a): 03d514a is six commits ahead of 59a445b. The completed triage confirmed remote main and local main/origin/main at pushed revision 03d514a969e34b2b9a6a16a29a587fa2c62ab9fe (normal-hook push verified in the implementation session; this read-only triage did not execute a push). The active checkout HEAD points to feat/authoring-runtime-hardening-20260930; this report does not claim a clean worktree. Remote contents API confirms go.mod is identical at both revisions: Go 1.24.4 / CUE v0.15.4 / x/net v0.46.0. Thus the Go alert was not introduced by this landing.

At 59a445b the root lockfile retained stale development-only MCP tooling: sdk 1.25.3 plus nested sdk 1.0.1, server-github ^2025.4.8 and server-puppeteer ^2025.5.12; its root name/version were stale relative to package.json. At 03d514a and locally, root package-lock.json contains only its root record and no installed npm package entries. Historical critical/high packages were removed from this graph rather than patched in place. They were not core browser/Go dependencies. Do not reinstall the stale lockfile as a fix. Historical installed node_modules or external MCP configurations were not audited.

The separate private test/react-consumer fixture pins React/react-dom 19.2.0, @types/react/@types/react-dom 19.2.2, esbuild 0.25.12, TypeScript 5.9.3; its lockfile adds scheduler 0.27.0 and csstype 3.2.3 plus esbuild platform binaries. These are real React consumer/type/build verification dependencies, not linked Go/WASM modules. Root React is an optional peer >=16.8.0; the adapter imports the consumer React. No returned alert targets this fixture. That absence is not an exhaustive React security assessment or a claim about React server-component exposure.

## Runtime evidence and limits

bin/manifest.json records Go go1.24.4, CUE v0.15.4 and target js/wasm. build.sh pins that toolchain and -mod=readonly; scripts/generate-notices.mjs derives its license closure from engine/reader Go package graphs. Current notices include x/net v0.46.0, x/oauth2 v0.32.0 and protobuf v1.33.0. Direct byte inspection finds embedded x/net v0.46.0 module text in engine and legacy cue.wasm, not reader. No x/net/html text was found in either binary, and no direct x/net/html import was found in the repository core or cached CUE v0.15.4 source. Absence of text is not a call-graph proof, and notices are a module-level union. A full package/function reachability result remains required. The local go version -m reader rejected WASM as an unrecognized format; no binary vulnerability scan was obtained.

The advisory is [GHSA-5cv4-jp36-h3mw](https://github.com/advisories/GHSA-5cv4-jp36-h3mw), CVE-2026-25680 / [GO-2026-5028](https://pkg.go.dev/vuln/GO-2026-5028): arbitrary HTML parsing can consume excessive CPU. The Go vulnerability record names golang.org/x/net/html Parse, ParseFragment, ParseFragmentWithOptions, ParseWithOptions, parser.parse. This does not itself establish exposure through the virtual CUE API. Module membership, version match, function reachability and attacker-controlled input are separate questions. No exploitability claim follows from severity alone.

Binary SHA256 observed (read only):

- cue-engine.wasm: `02f502d5f28b616deb5fb277ec085c342f0ec91e75ba51d93443b350440ac84b`
- cue-reader.wasm: `b502a5709fc88f45ce4855742568f67718d2c00ce1d5980a5f0520eb1961ea9a`
- cue.wasm: `02f502d5f28b616deb5fb277ec085c342f0ec91e75ba51d93443b350440ac84b`

## Critical/high first: historical affected pins and smallest advisory patches

All rows below were fixed in the API at the recorded observation and refer to the removed root development lockfile. Individual minimums are advisory-specific; when maintaining an old tool, use the largest applicable patch floor for each package, not just the critical floor. These are not recommendations to restore the removed tooling.

|Alert|Severity/package|59a445b pin|Affected range|First patched|Advisory|
|---|---|---|---|---|---|
|#7|critical basic-ftp|5.1.0|< 5.2.0|5.2.0|[GHSA-5rq4-664w-9x2c](https://github.com/advisories/GHSA-5rq4-664w-9x2c)|
|#11|high @hono/node-server|1.19.9|< 1.19.10|1.19.10|[GHSA-wc8c-qw6v-h7f6](https://github.com/advisories/GHSA-wc8c-qw6v-h7f6)|
|#1|high @modelcontextprotocol/sdk|1.25.3; nested 1.0.1|< 1.24.0|1.24.0|[GHSA-w48q-cv73-mx4w](https://github.com/advisories/GHSA-w48q-cv73-mx4w)|
|#3|high @modelcontextprotocol/sdk|1.25.3; nested 1.0.1|>= 1.10.0, <= 1.25.3|1.26.0|[GHSA-345p-7cg4-v4c7](https://github.com/advisories/GHSA-345p-7cg4-v4c7)|
|#22|high basic-ftp|5.1.0|<= 5.2.1|5.2.2|[GHSA-6v7q-wjvx-w8wg](https://github.com/advisories/GHSA-6v7q-wjvx-w8wg)|
|#24|high basic-ftp|5.1.0|<= 5.2.2|5.3.0|[GHSA-rp42-5vxx-qpwr](https://github.com/advisories/GHSA-rp42-5vxx-qpwr)|
|#26|high basic-ftp|5.1.0|<= 5.3.0|5.3.1|[GHSA-rpmf-866q-6p89](https://github.com/advisories/GHSA-rpmf-866q-6p89)|
|#66|high extract-zip|2.0.1|<= 2.0.1|No patched version listed; remove/replace|[GHSA-jmr9-qjv8-65gv](https://github.com/advisories/GHSA-jmr9-qjv8-65gv)|
|#73|high extract-zip|2.0.1|<= 2.0.1|No patched version listed; remove/replace|[GHSA-7pqw-9j4j-h8q3](https://github.com/advisories/GHSA-7pqw-9j4j-h8q3)|
|#54|high fast-uri|3.1.0|>= 3.0.0, < 3.1.3|3.1.3|[GHSA-4c8g-83qw-93j6](https://github.com/advisories/GHSA-4c8g-83qw-93j6)|
|#55|high fast-uri|3.1.0|>= 3.0.0, <= 3.1.3|3.1.4|[GHSA-v2hh-gcrm-f6hx](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx)|
|#59|high fast-uri|3.1.0|>= 3.0.0, < 3.1.5|3.1.5|[GHSA-7p8r-x3mc-p8w7](https://github.com/advisories/GHSA-7p8r-x3mc-p8w7)|
|#63|high fast-uri|3.1.0|>= 3.0.0, <= 3.1.1|3.1.2|[GHSA-v39h-62p7-jpjc](https://github.com/advisories/GHSA-v39h-62p7-jpjc)|
|#64|high fast-uri|3.1.0|>= 3.0.0, <= 3.1.0|3.1.1|[GHSA-q3j6-qgpj-74h6](https://github.com/advisories/GHSA-q3j6-qgpj-74h6)|
|#67|high fast-uri|3.1.0|>= 3.0.0, < 3.1.6|3.1.6|[GHSA-f65p-4m7j-42xc](https://github.com/advisories/GHSA-f65p-4m7j-42xc)|
|#68|high fast-uri|3.1.0|>= 3.0.0, < 3.1.6|3.1.6|[GHSA-jqff-g426-hqxp](https://github.com/advisories/GHSA-jqff-g426-hqxp)|
|#45|high form-data|4.0.5|>= 4.0.0, < 4.0.6|4.0.6|[GHSA-hmw2-7cc7-3qxx](https://github.com/advisories/GHSA-hmw2-7cc7-3qxx)|
|#9|high hono|4.11.7|< 4.12.4|4.12.4|[GHSA-q5qw-h33p-qvwr](https://github.com/advisories/GHSA-q5qw-h33p-qvwr)|
|#42|high hono|4.11.7|< 4.12.25|4.12.25|[GHSA-88fw-hqm2-52qc](https://github.com/advisories/GHSA-88fw-hqm2-52qc)|
|#58|high ip-address|10.1.0|<= 10.3.0|10.3.1|[GHSA-mwp4-54f8-5fhr](https://github.com/advisories/GHSA-mwp4-54f8-5fhr)|
|#56|high js-yaml|4.1.1|>= 4.0.0, < 4.3.0|4.3.0|[GHSA-52cp-r559-cp3m](https://github.com/advisories/GHSA-52cp-r559-cp3m)|
|#62|high js-yaml|4.1.1|>= 4.0.0, < 4.3.1|4.3.1|[GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj)|
|#74|high js-yaml|4.1.1|>= 4.0.0, < 4.3.2|4.3.2|[GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh)|
|#14|high path-to-regexp|8.3.0|>= 8.0.0, < 8.4.0|8.4.0|[GHSA-j3q9-mxjg-w52f](https://github.com/advisories/GHSA-j3q9-mxjg-w52f)|
|#46|high ws|8.19.0|>= 8.0.0, < 8.21.0|8.21.0|[GHSA-96hv-2xvq-fx4p](https://github.com/advisories/GHSA-96hv-2xvq-fx4p)|

For a retained historical tooling graph, combined critical/high floors are basic-ftp 5.3.1 (critical alone fixes at 5.2.0), sdk 1.26.0 including nested copies, fast-uri 3.1.6, js-yaml 4.3.2, ip-address 10.3.1, ws 8.21.0, form-data 4.0.6, hono 4.12.25, path-to-regexp 8.4.0, @hono/node-server 1.19.10. The full moderate/low set raises Hono to 4.13.5 and @hono/node-server to 1.19.15, and includes additional packages detailed in sanitized JSON. extract-zip <=2.0.1 has no listed fix for both returned high advisories; remove/replace the owning old browser tooling rather than inventing an upgrade. Exact smallest owning-server upgrades were not established; restoring these packages is unnecessary.

## Exact verification recommendations for the future maintenance change

After deliberate toolchain/dependency updates, in the separately verified maintenance unit under existing owner authorization:

```sh
go vet ./internal/... ./test/semantic/native
npm run test:native
npm run check:generated
npm run build:wasm
GOOS=js GOARCH=wasm CGO_ENABLED=0 go vet -tags netgo,osusergo .
npm test
npm run test:semantic
npm run test:authoring
npm run check:intent
```

Update the existing test:native pin as part of the toolchain change; build.sh, scripts/generate-notices.mjs and both CI workflow pins must agree. Retain before/after resolved modules and manifest/assets; inspect go.sum and semantic corpus differences. Rebuild and refresh the pinned consumer archive before running `npm test --prefix test/react-consumer` and `node test/react-consumer/scripts/check-current.mjs .`; stale archive success is insufficient. Existing README browser verification must be rerun for worker cancellation/crash/readiness and actual installed React lifecycle. Those tests are recommendations, not results from this triage.

## Sources / scope

- Existing gh REST API: /repos/GeoffMillerAZ/cue-wasm/dependabot/alerts?per_page=100 (68 rows, fits one page), /contents/{go.mod,package.json,package-lock.json}?ref={59a445b,03d514a}, /compare/59a445b...03d514a.
- [Patched x/net go.mod](https://github.com/golang/net/blob/v0.55.0/go.mod); [Go vulnerability record](https://github.com/golang/vulndb/blob/master/data/osv/GO-2026-5028.json).
- Local manifests, build scripts, CI workflows, binary bytes and cached pinned CUE source. [dependency-triage-alerts.json](fixtures/landing-2026-10-01/dependency-triage-alerts.json) retains the exact cached sanitized advisory/version/state facts (68 records). Existing dependabot-alerts.sanitized.json was read and preserved.
- No auth material, personal reflog details or private source contents included. No gate bypass, auth change, Git mutation, dependency install, exploit execution or broad vulnerability certification. Main diagram UX work may continue; the one Go maintenance unit is independently scoped.

## Durable documentation handoff

This assessment and its linked sanitized JSON preserve the completed snapshot; no new downloads, builds, API reads or security qualification were performed to persist them. Source/toolchain/dependency pins remain Go1.24.4/CUEv0.15.4/x/netv0.46.0. The [tracker](../tracking/implementation_tracker.md) and [roadmap](../roadmap.md) route the separately verified maintenance unit. Existing user authorization applies; app-kit diagram/chooser UX continues independently. No commit or push was performed for this documentation handoff.
