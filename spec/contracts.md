# gooPlex — Interface Contracts (authoritative)

`CONTRACT_VERSION = 1`. Bump on any breaking change. The TypeScript home of these
types is `@gooplex/shared`; both server and web import from it (no hand-duplication).
The prompt/JSON contracts are mirrored by zod schemas in `pipeline/prompts.ts`.

## Data types (`@gooplex/shared`)

```ts
type SourceType = "docs" | "academic" | "forum" | "news" | "other";

interface RawResult { url: string; title: string; snippet: string; engine: string; sourceType: SourceType; rrfRank: number }
interface RankedResult extends RawResult { score: number; rank: number; reason: string } // reason = "why ranked #N"
interface SearchIntent { summary: string; assumptions: string[] }
interface IdealResult { description: string; signals: string[] }
interface ReasoningTrace {
  searchIntent?: SearchIntent; idealResult?: IdealResult;
  alternativeQueries?: string[]; rankingRationale?: Array<{ url: string; reason: string }>;
}
type SseEvent =
  | { event: "understanding"; data: { searchIntent: SearchIntent; idealResult: IdealResult } }
  | { event: "expanding";     data: { queries: string[] } }
  | { event: "searching";     data: { results: RawResult[] } }   // may fire >1x; always the full accumulated merged set with recomputed rrfRank
  | { event: "ranking";       data: { rationale: { url: string; reason: string }[] } }
  | { event: "done";          data: { results: RankedResult[]; trace: ReasoningTrace; finalOrderSource: "ai" | "rrf-fallback" } }
  | { event: "error";         data: { stage: "reasoning" | "searching" | "ranking"; message: string } };
```

## Provider interfaces

```ts
interface AiProvider { complete(input: { system: string; prompt: string; signal?: AbortSignal }): Promise<string> }
interface SearchProvider { search(query: string, opts?: { count?: number; signal?: AbortSignal }): Promise<RawResult[]> }
```

## HTTP API

- `GET /api/search?q=<q>&memory=0|1&lens=<opt>` -> `text/event-stream` of the `SseEvent`
  union. Response headers: `Cache-Control: no-cache`, `Connection: keep-alive`,
  `X-Accel-Buffering: no`; flush per event.
- `GET /api/search?q=<q>&format=json` -> single `{ results: RankedResult[]; trace; finalOrderSource }`
  (no-JS / error fallback; tests assert this).
- `lens` (optional) selects an `idealResult` preset; accepted but a **no-op until slice 13** (post-MVP).

## Stream invariant

The stream **ALWAYS** terminates with exactly one `done` (possibly degraded/empty).
`error` events are **non-terminal** advisories: zero or more may precede the `done`
(e.g. `error{stage:"ranking"}` then a degraded `done`). There is no terminal
error-without-`done` case, so a UI that waits for `done` can never hang.

## Partial-failure contract

- Normal path -> `done` with AI order (`finalOrderSource:"ai"`).
- Search empty -> `done{results:[], trace, finalOrderSource:"rrf-fallback"}` (200).
- Search throws (SearXNG down/429/5xx) -> `error{stage:"searching"}` then `done{results:[], trace, finalOrderSource:"rrf-fallback"}`.
- Reason fails/quota -> `error{stage:"reasoning"}`, **skip rank**, `done` with RRF order +
  empty reasons (`finalOrderSource:"rrf-fallback"`). Never feed undefined sI/iR to rank.
- Rank fails/quota -> `error{stage:"ranking"}` then `done` with RRF order + empty reasons (`finalOrderSource:"rrf-fallback"`).
- Cache hit -> emit cached `done` directly (skips understanding/searching/ranking; panel reads `trace` from `done`).

## Token budget & prompt constants (`pipeline/prompts.ts`)

```ts
const PROMPT_VERSION = "reason@1|rank@1"      // bump on any wording change -> invalidates cache + snapshots
const RESULTS_PER_QUERY = 10                  // per SearXNG query, before merge
const RANK_CANDIDATE_CAP = 24                 // overflow -> keep top-K by RRF
const SNIPPET_MAX_CHARS = 280, TITLE_MAX_CHARS = 120
const altQueryCap = (maxQueries: number) => Math.max(0, maxQueries - 1)
```

## Environment / config (`.env.example`)

`PORT`, `AI_PROVIDER=cursor-cli|ollama`, `CURSOR_MODEL=sonnet-4`, `OLLAMA_URL`,
`OLLAMA_MODEL`, `SEARCH_PROVIDER=searxng`, `SEARXNG_URL=http://localhost:8080`,
`MAX_QUERIES=4`, `RANK_CANDIDATE_CAP=24`, `AI_TIMEOUT_MS=45000`,
`CACHE_TTL_MS=600000`, `DEBUG_AI=0`.

## Observability (JSONL, append-only, `logs/ai-trace-YYYY-MM-DD.jsonl`, gitignored)

- `ai_call`: `ts, traceId, stage, provider, model, promptHash, latencyMs, exitCode, timeoutHit, retryCount, ladderStep(1|2|3|"fail"), zodOk, zodErrors, rawResultLen, rawResultPreview(~120c)`. Full `prompt`+`rawResult` only when `DEBUG_AI=1`.
- `search_trace` (on done/error): `ts, traceId, query, memory, lens, candidateCount, finalOrderSource, stages[{stage,ms}], totalMs, errors[]`.
- `promptHash = sha256(provider+model+system+user)` — cross-links a live trace to its eval AI-cache entry.
- Redaction: never log `memory.md` content (hash + flag only); default logs carry candidate `id`+`url`, not snippet bodies; `logs/` gitignored.

## Merge & normalization

- Dedupe by normalized URL (strip protocol/`www`/trailing slash/tracking params).
- **RRF** merge across queries: `rrfScore = Σ 1/(60 + rank_i)` defines the `rrfRank` order.
  SearXNG's per-engine/per-query score (intentionally NOT stored on `RawResult`) is not
  cross-comparable; never sort by it.
- `sourceType` via first-match-wins table (lowercased host+path, after normalization; default `other`):
  1. `.edu` / `.ac.<cc>` -> academic
  2. arxiv/biorxiv/ssrn/pubmed/ncbi -> academic
  3. doi.org/acm/ieee/springer/sciencedirect/nature/jstor/semanticscholar/researchgate -> academic
  4. `developer.*` / `docs.*` / `*.readthedocs.io` / devdocs -> docs
  5. path has `/docs|/documentation|/reference|/api|/manual|/guide|/man/` -> docs
  6. `*.github.io`/pkg.go.dev/crates.io/docs.rs/npmjs/rust-lang/python.org/nodejs.org/w3.org/rfc-editor/ietf/man7 -> docs
  7. reddit/*.stackexchange/stackoverflow/HN/quora/discourse/host~forum|community -> forum
  8. github.com `/issues|/discussions` -> forum; else github.com repo/code -> docs
  9. curated news list (nyt/bbc/reuters/ap/guardian/bloomberg/wsj/wapo/cnn/theverge/arstechnica/techcrunch/wired/ft) -> news
  10. default -> other (blogs — medium/substack/wordpress/blogspot — fall here)

## AI invocation contract (Cursor CLI)

- `execFile("cursor-agent", ["-p","--output-format","json","--mode","ask","--sandbox","enabled","--model",CURSOR_MODEL, fullPrompt])`
  — arg array, never a shell string; prompt is the trailing positional arg.
- No `--system` flag: `fullPrompt = system + "\n---\n" + prompt`, JSON-schema block stays **last**.
- `p-limit(1)`; 45s timeout -> SIGKILL; <=1 retry with a "JSON only" reminder.
- JSON-extraction ladder on `result`: (1) parse whole; (2) strip ```` ```json ```` fences;
  (3) regex first balanced `{...}`/`[...]`; then **zod validate**. Log `ladderStep`.
- Rank output post-validate: drop `id>=n` or duplicate (keep first); missing id -> `{score:0,reason:""}`.
