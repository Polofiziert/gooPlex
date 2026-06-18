# Slice 02 — SearXNG search provider

Status: done
Depends on: 01-scaffold
Build step: 1

## Requirement

Provide real web results through a swappable `SearchProvider`, defaulting to a local
SearXNG instance, with dedupe, RRF merge, and `sourceType` tagging.

## Contracts touched

`SearchProvider` (already in `@gooplex/shared` — do NOT duplicate a server-side `types.ts`),
`RawResult`, the merge/normalization + `sourceType` table in `contracts.md`. See `conventions.md`
for ports, the `dist/` build contract, NodeNext `.js` imports, and the env-loading gap.

## Acceptance criteria

- [x] Create `packages/server/src/pipeline/prompts.ts` exporting at least `RESULTS_PER_QUERY = 10` (and the other token constants from `contracts.md`); `SearxngProvider` imports the count from there.
- [x] Add env loading: the server loads `.env` (e.g. `dotenv` or node `--env-file`) so `SEARXNG_URL` etc. resolve; live SearXNG tests depend on it.
- [x] `docker-compose.yml` runs `searxng/searxng` on `:8080`, mounting `./searxng/settings.yml:/etc/searxng/settings.yml:ro`.
- [x] `settings.yml` begins with `use_default_settings: true`, sets `server.secret_key`, `search.formats: [html, json]`, `server.limiter: false` (without `use_default_settings`, a mounted file replaces defaults -> zero engines / empty results).
- [x] `GET http://localhost:8080/search?q=test&format=json` returns JSON `results[]` (no 429; non-empty `results` is a live/manual gate, kept separate from the deterministic tests).
- [x] `SearxngProvider.search(q)` maps `content`->`snippet`, sets `engine` from the SearXNG result, returns `RawResult[]` (no page-fetching); requests `count = RESULTS_PER_QUERY` and honors an `AbortSignal`.
- [x] `pnpm dev` gets a third leg `docker compose up searxng` (service name `searxng`); first live call may fail while it warms (acceptable per `overview.md`).
- [x] `sourceType` classification matches the `contracts.md` table; unit-tested across all rules incl. the `other` default case.
- [x] Multi-query merge module: dedupe by normalized URL; RRF (`Σ 1/(60+rank)`) sets `rrfScore`; unit-tested deterministically. Single-query path may use positional rank.
- [x] Timeouts + thrown errors surface as rejections the orchestrator can catch (not silent).
- [x] Add a short `README.md` section: Docker prerequisite + how to generate `server.secret_key`; note the `pnpm install` retry-on-`ERR_PNPM_META_FETCH_FAIL`.

## Done when

A unit test ranks a fixed fixture set by RRF deterministically; a live `SearxngProvider.search("test")` returns normalized `RawResult[]`; `pnpm dev` brings up docker + server + web; `curl 'localhost:8080/search?q=test&format=json'` returns non-empty `results[]`.

## Out of scope

Streaming, AI, the HTTP route (next slice). SerpAPI/Google-CSE adapters (interface only).
