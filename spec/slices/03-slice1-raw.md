# Slice 03 — First vertical slice (no AI)

Status: not-started
Depends on: 02-searxng
Build step: 1

## Requirement

Prove the whole pipe end-to-end with NO AI: query -> SearXNG -> SSE -> rendered cards.
This de-risks the transport, store, and routing before any LLM work.

## Contracts touched

`GET /api/search` SSE, `SseEvent` (`searching`, `done`), `createSearchStream`.

## Acceptance criteria

- [ ] `GET /api/search?q=...` streams `searching` (RRF snapshot) then `done`, with correct SSE headers from `contracts.md`.
- [ ] Slice-1 emits `RankedResult` shape with `score:0, rank:rrfRank, reason:""` (no AI yet).
- [ ] `GET /api/search?q=...&format=json` returns the final `{results, trace}` (no-JS fallback).
- [ ] Web `createSearchStream` consumes via `fetch` + `ReadableStream` (NOT EventSource), buffering partial frames across chunk boundaries.
- [ ] `onCleanup` aborts the in-flight request when the query changes.
- [ ] Home has a big autofocus search bar; submit navigates to `/search?q=` (shareable, back-button works).
- [ ] Results page renders `ResultCard`s from the stream; `searching` **replaces** `partialResults` wholesale (keyed by URL), never appends.
- [ ] Stream always ends in exactly one `done` or one `error` (invariant).

## Done when

Typing a query on Home shows real ranked-by-RRF cards on `/search?q=`, fully streamed, no AI involved.

## Out of scope

AI reason/rank, reasoning panel, final styling.
