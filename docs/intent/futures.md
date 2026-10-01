# Future directions

## F1 Rich browser authoring services
Confidence: medium. Horizon: after G1–G3. Syntax tooling exists; a full language
server requires more than formatting and symbols.
Promote when a consumer needs completion/navigation beyond current APIs and has
bounded worker/resource acceptance. Drop if existing editor integration suffices.

## F2 Server, CLI and WASI hosts
Confidence: low. Horizon: later. Historical roadmap proposed these hosts.
Promote when an independent consumer demonstrates a deployment need not met by
native Go or the JavaScript API, with explicit security/operations ownership.
Drop if it duplicates the upstream CLI or creates an unused service.

## F3 Smaller specialized evaluation delivery
Confidence: medium for delivery optimization, low for evaluator replacement.
Horizon: after reproducible baseline. Promote when profiles show transfer/compile
cost dominates and a compatible split or specialized artifact improves an actual
workflow. Drop if duplication, caches, semantic drift or maintenance outweigh gains.
A Rust rewrite needs its own ADR and full CUE compatibility evidence.
