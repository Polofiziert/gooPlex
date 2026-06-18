# Slice 09 — Reasoning panel (one click)

Status: not-started
Depends on: 08-config-files
Build step: 4 (hardening)

## Requirement

Make the whole reasoning process visible in one click, fed live from the same stream
— the feature that distinguishes gooPlex's "show your work" ethos.

## Contracts touched

`ReasoningPanel { trace, stage, open, onToggle }`; reads the same `SearchState` store.

## Acceptance criteria

- [ ] A persistent "Show reasoning" affordance toggles the panel (one click).
- [ ] Panel reads the **same** `/api/search` stream/store (NOT a second pipeline run).
- [ ] Fills live as events land: `searchIntent`, `idealResult`, `alternativeQueries`, then per-result ranking rationale, with `#` section markers.
- [ ] `aria-expanded`, `aria-controls`, `role="region"`, `Esc` closes.
- [ ] Slides in <=200ms, gated on `prefers-reduced-motion` (instant when reduced).
- [ ] On `error`, the panel shows the failed stage rather than hanging.
- [ ] Renders the full trace from `done.trace` alone when intermediate events are absent (cache-hit path).

## Done when

Clicking "Show reasoning" reveals the live trace for the current query; no extra network/AI call is triggered.

## Out of scope

Final theme polish (next slice).
