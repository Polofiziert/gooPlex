# Slice 03 — First vertical slice (no AI)

Status: not-started
Depends on: 02-searxng
Build step: 1

## Requirement

Prove the whole pipe end-to-end with NO AI: query -> SearXNG -> SSE -> rendered cards.
This de-risks the transport, store, and routing before any LLM work.

## Contracts touched

`GET /api/search` SSE, `SseEvent` (`searching`, `done`), `createSearchStream`.

## Reconciliations (do FIRST, before slice-03 work)

- [ ] Rename the shipped slice-02 field `rrfRank` -> `rrfScore` everywhere (`@gooplex/shared` type, `SearxngProvider`, `merge.ts`, tests). Mechanical rename, value unchanged; aligns code with `contracts.md`.
- [ ] Migrate the SearXNG secret out of the committed `searxng/settings.yml` to env (`SEARXNG_SECRET`): use the `searxng/searxng` image's env substitution (verify the image's mechanism, e.g. `secret_key: "ultrasecretkey"` placeholder + `SEARXNG_SECRET` env), pass it via `docker-compose.yml` `environment: - SEARXNG_SECRET=${SEARXNG_SECRET}` (read from repo-root `.env`), document it in `.env.example` with a generation hint, and rotate the value so the one already in git history (from the slice-02 commit) is dead. From this slice on, no real secret lives in a tracked file.

## Acceptance criteria

- [ ] `GET /api/search?q=...` streams `searching` (RRF snapshot) then `done`, with correct SSE headers from `contracts.md`.
- [ ] Slice-1 emits `RankedResult` with `score:0, reason:""`, and `rank` = **1-based ordinal** from the RRF order (sort by `rrfScore` desc) — do NOT copy `rrfScore` into `rank`. `done` (and `format=json`) carries `finalOrderSource:"rrf-fallback"` (no AI yet).
- [ ] `GET /api/search?q=...&format=json` returns the final `{results, trace, finalOrderSource}` (no-JS fallback).
- [ ] Web `createSearchStream` consumes via `fetch` + `ReadableStream` (NOT EventSource), buffering partial frames across chunk boundaries.
- [ ] `onCleanup` aborts the in-flight request when the query changes.
- [ ] Home has a big autofocus search bar; submit navigates to `/search?q=` (shareable, back-button works).
- [ ] Results page renders `ResultCard`s from the stream; `searching` **replaces** `partialResults` wholesale (keyed by URL), never appends.
- [ ] Accept `memory` and `lens` query params but treat them as no-ops in this slice.
- [ ] Stream invariant per `contracts.md`: `error` is **non-terminal**; the stream always ends with exactly one `done`. A search failure emits `error{stage:"searching"}` then a degraded `done{results:[], trace:{}, finalOrderSource:"rrf-fallback"}` (200) — never a hang.

## Done when

Typing a query on Home shows real ranked-by-RRF cards on `/search?q=`, fully streamed, no AI involved.

## Out of scope

AI reason/rank, reasoning panel, final styling.
