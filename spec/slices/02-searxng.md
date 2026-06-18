# Slice 02 — SearXNG search provider

Status: not-started
Depends on: 01-scaffold
Build step: 1

## Requirement

Provide real web results through a swappable `SearchProvider`, defaulting to a local
SearXNG instance, with dedupe, RRF merge, and `sourceType` tagging.

## Contracts touched

`SearchProvider`, `RawResult`, the merge/normalization + `sourceType` table in `contracts.md`.

## Acceptance criteria

- [ ] `docker-compose.yml` runs `searxng/searxng` on `:8080`, mounting `./searxng/settings.yml:/etc/searxng/settings.yml:ro`.
- [ ] `settings.yml` begins with `use_default_settings: true`, sets `server.secret_key`, `search.formats: [html, json]`, `server.limiter: false`.
- [ ] `GET http://localhost:8080/search?q=test&format=json` returns JSON `results[]` (no 429, non-empty engines).
- [ ] `SearxngProvider.search(q)` maps `content`->`snippet` and returns `RawResult[]` (no page-fetching); requests `count = RESULTS_PER_QUERY` and honors an `AbortSignal`.
- [ ] `pnpm dev` now also brings up the SearXNG container (the docker leg deferred from slice 01).
- [ ] `sourceType` classification matches the table in `contracts.md` (unit-tested across all 11 rules).
- [ ] Multi-query merge: dedupe by normalized URL; RRF (`Σ 1/(60+rank)`) sets `rrfRank`; unit-tested deterministically.
- [ ] Timeouts + thrown errors surface as rejections the orchestrator can catch (not silent).

## Done when

A unit test ranks a fixed fixture set by RRF deterministically; a live call returns normalized results.

## Out of scope

Streaming, AI, the HTTP route (next slice). SerpAPI/Google-CSE adapters (interface only).
