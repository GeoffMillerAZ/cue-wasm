# Independent configuration authoring

G3 consumer, governed by ADR-0001–0003. No new core/runtime API or future language
server. Official CUE evaluates; this example owns drafts, revisions, UI and policy.

## Task and boundaries

Author a small workspace configuration: title, appearance, accent and bounded panel
specifications. Edit CUE, evaluate schema plus draft, inspect resolved defaults and a
local structural preview, then download validated JSON. Panels are configuration
previews, not connected data or an implemented app-kit dashboard. No source/provider
connection, network import, persistence service or Fathom dependency.

One engine worker per mounted authoring session. Start explicitly, bounded input and
queue, timeout, cancel/retry and disposal. Draft text lives outside the worker. Editing
invalidates export immediately; a previous preview remains visibly labelled stale.
Only an evaluation for the exact current draft revision may publish a fresh preview.
Formatting applies only to an unchanged draft; stale results never overwrite typing.
Cancellation retires the worker. Retry creates a fresh owner and keeps the draft.

Semantic validation and rendering are separate: CUE admits a closed, bounded schema;
DOM output uses textContent and constrained theme values. Rendering never executes
source strings or inserts HTML. No data is stored or sent unless the user downloads it.
Prepared JSON contains configuration only and can be consumed without CUE/WASM.

## Independent delivery and acceptance

A preparation command npm-packs the current package, installs/extracts it into an
isolated static consumer, verifies manifest assets and copies the example source.
Browser imports use only that consumer's packaged assets. No source checkout paths,
Go service, live registry or sibling import is needed to run the prepared directory.
A bounded loopback static server is development tooling, not a runtime backend.

Verify valid/invalid/incomplete drafts, schema defaults and bounds, edit-during-work,
format race, cancellation and restart, loading failure, draft preservation, fresh-only
export, disposal and repeated mount. Unit race tests use controlled promises; actual
installed engine browser checks establish integration. Native/WASM contract fixtures
must check the example schema independently. Record keyboard/narrow/error states.
Startup/resource claims remain separate frozen-workload work; no zero-load claim.
