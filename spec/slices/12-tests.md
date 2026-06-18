# Slice 12 — Test suite consolidation

Status: not-started
Depends on: 08-config-files (grows alongside every slice)
Build step: 4 (hardening)

## Requirement

Consolidate deterministic tests for both packages. Tests are derived from each slice's
acceptance criteria; this slice ensures coverage and CI wiring, not after-the-fact testing.

## Contracts touched

Vitest config (`test.projects`), Mock providers.

## Acceptance criteria

- [ ] Backend (node env): prompt-builder snapshots (assert `PROMPT_VERSION`), JSON-ladder + zod fixtures (fenced, extra key, out-of-range score, hallucinated/missing id), URL-dedupe, RRF merge, `sourceType` table, orchestrator with `MockAiProvider`/`MockSearchProvider`, `format=json` + all partial-failure branches, `metrics.ts`.
- [ ] Frontend: `SearchBar`/`ResultCard`/`ReasoningPanel` (jsdom) + `createSearchStream`/frame-parser stubbing `fetch` with a hand-built `ReadableStream` (node env), asserting progressive `understanding->...->done`, partial-frame buffering, and the error branch.
- [ ] node-vs-jsdom split via Vitest **`test.projects`** (NOT `environmentMatchGlobs`, removed in v4).
- [ ] `pnpm test` runs both packages green; the one real-CLI integration gate is tagged and runnable separately.

## Done when

`pnpm test` is green and every slice's acceptance criteria has at least one corresponding automated check (or a documented manual gate).

## Out of scope

Optional Playwright e2e (note as nice-to-have).
