# gooPlex — Overview Spec

## Vision

A knowledge-first search tool: the AI does the judgment-heavy plumbing
(understand intent, broaden the query, rank sources) but **hands the knowledge
back to the user**. It **ranks, never answers**. It **only links out** — ranks on
SERP snippets, never synthesizes an answer, never re-hosts page content.

## Non-goals

- No synthesized answer box, no AI summary of results.
- No page-body fetching/scraping (latency + ToS + breaks the link-out ethos).
- No ads, sponsored slots, or infinite scroll.
- **Not** a multi-tenant service (see framing).

## Framing: single-user, local-first (load-bearing)

- Default AI backend is the **Cursor CLI** (`cursor-agent`), one process per call,
  tied to the user's Cursor quota. `p-limit(1)` -> AI calls run **serially**.
- Verified latency: ~8-12s per call (API ~5-8s + ~3-4s process startup);
  a full search (reason + rank) ~= **16-24s worst case**, hidden behind streamed
  prelim results.
- Throughput ceiling: ~one full search every ~16-24s, globally. Fine for one user.
- Upgrade path if it must scale: swap `CursorCliProvider` for an HTTP
  OpenAI-compatible provider and lift `p-limit(1)`. The `AiProvider` interface
  already allows this.

## Resolved decisions

1. Single-user / local-first (above).
2. CLI mode `--mode ask --sandbox enabled` (read-only, no tools) — verified to still emit clean JSON.
3. Rank on **snippets only**; no page-fetching; no reading-time.
4. Steering precedence: `searchInitialization.md` (dev system, always) > `rules.md`
   (user rubric, always) > generated per-query `idealResult` > untrusted web
   snippets. `memory.md` injected only when `memory=1` and is **additive context**;
   on conflict `rules.md` wins. The user can never override the dev layer's
   never-answer / output discipline.
5. Rank call receives `searchIntent` + `idealResult` only (rubric reaches it via `idealResult`).
6. **Shuffle the id<->result mapping before the rank call**, RNG seeded from the
   normalized query (eval: from query id), so the model can't echo RRF order, the
   prompt stays byte-stable for caching, and the eval A/B is meaningful.
7. `sourceType` via a fixed first-match-wins heuristic table (see `contracts.md`).
8. Observability ships thin **with** the AI provider; eval ships **right after** the
   rank slice to validate the core value prop before building more.

## Stack

TypeScript pnpm monorepo. Backend Node + Fastify (zod, p-limit, lru-cache, tsx).
Frontend SolidJS + @solidjs/router + Vite + Tailwind v4 (SSE via fetch+ReadableStream,
never EventSource). Search: SearXNG via Docker. Tests: Vitest. Shared types: `@gooplex/shared`.

## Build order & MVP cut line

1. `01-scaffold` -> `02-searxng` -> `03-slice1-raw` (no AI; end-to-end proof)
2. `04-ai-provider` (+ thin observability) + `05-rank-step` -> `06-eval` (go/no-go)
3. `07-reason-step` + `08-config-files`
4. `09-reasoning-panel`, `10-resilience`, `11-design-polish`, `12-tests`
5. `13-creative-deferred` (post-MVP)

**MVP = steps 1-3 (through `08-config-files`).** Steps in 4 are hardening; step 5 is
post-MVP. The `06-eval` gate is the real decision point: does AI ranking earn its latency?
