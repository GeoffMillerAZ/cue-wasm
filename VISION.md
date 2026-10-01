# CUE where people author and inspect configuration

Make official CUE semantics practical in local browser and JavaScript tools:
express constraints once, inspect useful diagnostics, compose configuration, and
produce deterministic artifacts without a mandatory service or provider.

The primary experience is an editor or workbench that stays responsive while a
bounded, disposable worker validates a draft. Syntax tooling and full evaluation
are explicit capabilities. Applications keep their drafts, authorization, domain
meaning, and UI; cue-wasm supplies evaluation and host lifecycle contracts.

App-kit can use this for theme experiments, view/dashboard authoring, component
configuration and validation. Prepared viewers consume validated JSON/CSS/assets
without downloading an evaluator. Other consumers remain equally first-class.
There is no app-kit, Fathom, React, or provider dependency in the core runtime.

Excellence means fidelity to the pinned upstream CUE engine, actionable failures,
reproducible packages, honest resource measurements, and installed-consumer proof.
Deterministic evaluation cannot establish that input facts are true, nor authorize
action. Browser WASM is not zero startup or an automatic memory/security quota.

[Intent](docs/intent/README.md) governs decisions; [roadmap](docs/roadmap.md) orders
work; the [tracker](docs/tracking/implementation_tracker.md) holds current evidence.
