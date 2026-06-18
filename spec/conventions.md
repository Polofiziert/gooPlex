# gooPlex — Repo Conventions (durable, established in slice 01)

Facts every slice agent needs. These are reconciled discoveries from building — if a
slice changes one, update this file.

## Ports & dev topology

- Server `PORT` defaults to **3001** (zod `z.coerce.number().default(3001)` in `packages/server/src/index.ts`).
- Web dev server (Vite) **proxies only `/api`** -> `http://localhost:${PORT}` (default 3001), `changeOrigin: true`.
- `/health` is served directly on `:3001` (not proxied). SearXNG is direct on `:8080` (added in slice 02).
- Root `pnpm dev`: `pnpm --filter @gooplex/shared build && concurrently -n searxng,server,web "docker compose up searxng" "...server dev" "...web dev"`.

## Monorepo / build contract

- `@gooplex/shared` resolves to **`dist/`** (`exports` -> `./dist/index.js` + `./dist/index.d.ts`), NOT `src/`.
- Root `pnpm dev` **builds shared once, no watch.** After changing a shared type, rebuild it
  (`pnpm --filter @gooplex/shared build`) — or run its own `pnpm --filter @gooplex/shared dev`
  (`tsc --watch`) in parallel — before server/web see the change.
- Package manager: `pnpm@10.12.1`. Fresh installs may hit `ERR_PNPM_META_FETCH_FAIL`
  (registry timeout); just re-run `pnpm install`.

## TypeScript / module rules

- Base config (`tsconfig.base.json`): `module`/`moduleResolution: NodeNext`, `strict`,
  `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `isolatedModules`.
- **Server + shared are NodeNext** -> relative imports MUST use `.js` extensions (e.g. `./prompts.js`).
- **Web is `module: ESNext`, `moduleResolution: bundler`, `jsx: preserve`, `jsxImportSource: solid-js`, `noEmit`** -> no `.js` extension needed there.
- `noUnusedLocals`/`noUnusedParameters` are on: prefix intentionally-unused with `_` or `void` them
  (slice 01 stubs `void limit; void cache;` to satisfy this).

## Server patterns

- `buildServer()` is **exported** so Vitest can use `app.inject(...)` without binding a port.
  Keep new routes registered inside `buildServer()` and test them that way.
- `main()` only runs when invoked as the entry (`process.argv[1] === fileURLToPath(import.meta.url)`).
- Fastify is created with `logger: true` — tests print JSON request logs to stdout (harmless, noisy).
- `p-limit(1)`, `LRUCache`, and `zod` are installed and currently stubbed; wire real usage when a slice needs it.

## Env loading

- Server loads `.env` from the repo root via `dotenv` in `packages/server/src/env.ts` (imported first from `index.ts`).
- `.env.example` is the canonical key list (mirrors `contracts.md` Environment section).

## Testing

- Each package has its own `vitest.config.ts`; root `pnpm test` runs `pnpm -r test` (all three).
- Server/shared tests run in Node; web tests in jsdom. Use Vitest `test.projects` for any
  per-file env split (NOT `environmentMatchGlobs`, removed in Vitest 4).

## Web structure

- Routes live under `packages/web/src/routes/` (slice 01 convention), **not** `pages/`
  (the plan said `pages/{Home,Results}.tsx`; reality is `routes/`). Extend `routes/`.
- `@solidjs/router` is wired; `/` (Home) and `/search` (Results, added slice 03) exist. Vite
  proxies `/api` only -> `:3001`, so web code uses **relative** `fetch('/api/...')`, never an absolute URL.

## Search provider (built in slice 02)

- Use `createSearchProvider()` (`providers/search/index.ts`), selected by `SEARCH_PROVIDER`;
  don't instantiate `SearxngProvider` ad hoc.
- `SearxngProvider.search(q)` is **single-query** and returns normalized `RawResult[]`.
  `mergeResults()` (RRF) exists for the multi-query orchestrator (slice 07+); single-query
  slices don't need it.
- `RESULTS_PER_QUERY` is enforced **client-side** (`.slice(0, count)`); no count param is
  sent to SearXNG (it may return more, e.g. 24 raw).
- Search timeout is currently **hardcoded 15s** in the provider (not yet reading
  `SEARCH_TIMEOUT_MS`); a later slice can make it env-configurable.
- `rrfScore` holds the RRF fusion score (`1/(60+rank)` per query), NOT an ordinal 1,2,3.
- Live tests use the `describe.runIf(searxngAvailable)` pattern in `searxng.test.ts`.

## Stub scripts

- `pnpm eval` is a placeholder until slice 06 — ignore for now.
- `p-limit` / `LRUCache` are installed but stubbed (`void`) in `index.ts`; wire real usage only
  when a slice needs them (`p-limit` = AI layer in slice 04, cache = slice 10).

## Known deferred gaps (recorded slice 03, owned by later slices)

These are conscious deferrals, not bugs — don't "discover" them again:

- **Client-abort not wired from the route.** `runSearchOrchestrator` accepts `signal`, but
  `routes/search.ts` never passes the request's close/abort signal, so a client disconnect
  doesn't cancel in-flight SearXNG/AI work. Owned by **slice 10**.
- **No per-event SSE flush.** The route writes frames but never calls `reply.raw.flush()`;
  fine for local `app.inject` tests, may buffer behind a proxy. Owned by **slice 10**.
- **`format=json` is asymmetric by design.** On failure it returns `{results:[], ...}` with a
  200 and **no `error` field** (no-JS fallback), unlike the SSE `error` event. Intentional;
  documented in `contracts.md`.
- **`SEARCH_TIMEOUT_MS` not wired.** Provider hardcodes 15s; the env key exists in
  `contracts.md` + `.env.example` for when a slice makes it configurable.
