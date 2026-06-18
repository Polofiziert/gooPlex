# Slice 01 — Scaffold

Status: done
Depends on: none
Build step: 1

## Requirement

Stand up the pnpm monorepo skeleton so subsequent slices have a home: shared types
package, server package, web package, and a one-command dev workflow.

## Contracts touched

`@gooplex/shared` created (exports the `contracts.md` types). `.env.example` keys.

## Acceptance criteria

- [x] `pnpm-workspace.yaml` lists `packages/*`; root `package.json` has scripts `dev`, `test`, `eval`.
- [x] `packages/shared` builds and exports `SseEvent`, `RawResult`, `RankedResult`, `SearchIntent`, `IdealResult`, `ReasoningTrace` (matches `contracts.md`).
- [x] `packages/server` (Fastify + zod + p-limit + lru-cache) starts and serves a `/health` 200.
- [x] `packages/web` (SolidJS + @solidjs/router + Vite + Tailwind v4 via `@tailwindcss/vite`) renders a blank Home route; Vite proxies `/api` -> server.
- [x] Both packages import types from `@gooplex/shared` via `workspace:*` (no duplicated types).
- [x] `pnpm dev` (via `concurrently`) launches server + web together. (The SearXNG leg is added in slice 02 once `docker-compose.yml` exists.)
- [x] `.gitignore` excludes `logs/`, `eval/cache/`, `node_modules`, build output.
- [x] `.env.example` documents the keys enumerated in `contracts.md` (PORT, AI_PROVIDER, CURSOR_MODEL, OLLAMA_URL, OLLAMA_MODEL, SEARCH_PROVIDER, SEARXNG_URL, MAX_QUERIES, RANK_CANDIDATE_CAP, AI_TIMEOUT_MS, CACHE_TTL_MS, DEBUG_AI).

## Done when

`pnpm dev` brings up server + web and `GET /health` returns 200; `tsc` passes across packages.

## Out of scope

Any search/AI logic, real UI, styling beyond Tailwind wiring.
