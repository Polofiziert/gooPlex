# Slice 04 — AI provider + thin observability

Status: not-started
Depends on: 03-slice1-raw
Build step: 2

## Requirement

A swappable `AiProvider` with a hardened Cursor CLI default and an Ollama alternate,
plus the minimal logging needed to debug LLM behavior from day one.

## Contracts touched

`AiProvider`, the AI invocation contract + JSON ladder in `contracts.md`, observability records.

## Acceptance criteria

- [ ] `CursorCliProvider` uses `execFile` (arg array, no shell), flags `-p --output-format json --mode ask --sandbox enabled --model $CURSOR_MODEL`, prompt as trailing arg.
- [ ] `fullPrompt = system + "\n---\n" + prompt`; the JSON-schema block stays last.
- [ ] `p-limit(1)`; 45s timeout -> SIGKILL; <=1 retry with a "JSON only" reminder.
- [ ] JSON-extraction ladder (parse -> strip fences -> regex balanced -> zod) implemented; unit-tested against fixtures: clean JSON, fenced JSON, prose+JSON, malformed.
- [ ] `OllamaProvider` implements the same interface against `/api/generate`.
- [ ] Env factory selects provider via `AI_PROVIDER`.
- [ ] Observability per `contracts.md`: append-only JSONL `logs/ai-trace-YYYY-MM-DD.jsonl`. `ai_call` records include `ts, traceId, stage, provider, model, promptHash (=sha256(provider+model+system+user)), latencyMs, exitCode, timeoutHit, retryCount, ladderStep, zodOk, zodErrors, rawResultLen, rawResultPreview`. Full prompt/result only when `DEBUG_AI=1`.
- [ ] `log.ts` also supports the `search_trace` record (emitted by the orchestrator on done/error in later slices; schema in `contracts.md`).
- [ ] `memory.md` content is never logged (hash + flag only); default logs carry candidate `id`+`url`, not snippet bodies; `logs/` gitignored.
- [ ] Integration gate: one real `cursor-agent` call feeds the ladder successfully (manual/CI-tagged, not in the default mock suite).

## Implementation notes (carried from slice-03 handoff)

- **New files (all greenfield):** `providers/ai/index.ts` (`createAiProvider()` by `AI_PROVIDER`), `providers/ai/cursor-cli.ts`, `providers/ai/ollama.ts`, `pipeline/json-ladder.ts`, `observability/log.ts`, plus ladder fixtures. `AiProvider` already lives in `@gooplex/shared`; `pipeline/prompts.ts` has `PROMPT_VERSION` + token caps but **no** prompt builders yet (those are slices 05/07).
- **Ladder API shape:** `extractJson(string) -> unknown` then `validateWithSchema(zodSchema, unknown)`. Slice 04 tests it with a small fixture schema; rank-specific zod lands in slice 05 and **reuses** this ladder.
- **Cursor stdout envelope:** run the ladder on the inner `.result` string, not raw stdout (see `contracts.md` AI invocation contract).
- **`p-limit(1)`:** remove the `index.ts` stub (`const limit = pLimit(1); void limit;`) and own it in the AI provider layer so callers do `await limit(() => ai.complete(...))`. `LRUCache` stays stubbed until slice 10.
- **`AI_TIMEOUT_MS`:** read the 45s timeout from env, don't hardcode (the hardcoded 15s *search* timeout is a separate, already-noted gap — don't conflate).
- **`traceId`:** no generator exists; mint a UUID per `complete()` call, and accept an optional `traceId` in a logging-context object so the orchestrator can reuse it in later slices.
- **Redaction helper:** build it now even though `memory.md` doesn't exist until slice 08, so slice 08 can't accidentally leak its content.
- **Integration gate:** use `describe.runIf(cursorAgentAvailable)` (mirror `searxng.test.ts`); keep it out of the default mock suite.

## Done when

`AiProvider.complete()` returns a string for both providers; ladder+zod unit tests pass; a real CLI call is logged with `ladderStep`/`zodOk`.

## Out of scope

Reason/rank prompts and prompt builders (slices 05/07); **wiring AI into `/api/search`, the orchestrator, or the UI** — do NOT touch them; prove `complete()` + ladder + logs in isolation. Rank-specific zod (slice 05); LRU cache (slice 10); steering files `rules.md`/`memory.md`/`searchInitialization.md` (slice 08).
