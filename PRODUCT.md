# Authoring experience

## Register
Product: a developer workbench and embeddable runtime, not a marketing site.
Canonical product scope remains [VISION.md](VISION.md) and [intent](docs/intent/README.md).

## Users and purpose
Application developers and configuration authors need official CUE validation,
resolved defaults and portable output without a hosted evaluator. The author owns
source and schemas; the runtime owns computation and lifecycle. Prepared consumers
must remain usable without loading the evaluator.

## Design principles
A restrained, legible workbench: source and result adjacent on wide screens, stacked
on narrow screens. Preserve editing space with a short action bar. Use native labelled
controls, visible keyboard focus, selectable diagnostics and system typography.
Explain readiness, current versus stale preview, failures and recovery in plain text.
Do not rely on color alone. No decorative motion or automatic evaluation while typing.

The existing browser playground is a reference for editor/preview composition, not
an instruction to carry its CDN or global runtime into the independent example.
Avoid an IDE imitation, speculative language server, fake connected dashboard, and
marketing-style cards. Keep the configuration preview visually subordinate to the
source and explicit that its panels have no connected data.

Evidence: VISION.md, docs/design/runtime-hardening.md and
[authoring task](docs/design/authoring-example.md). This file guides example UI only;
it does not impose a design system on consumers or certify accessibility.
