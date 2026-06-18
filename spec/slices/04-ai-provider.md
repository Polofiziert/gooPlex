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

## Done when

`AiProvider.complete()` returns a string for both providers; ladder+zod unit tests pass; a real CLI call is logged with `ladderStep`/`zodOk`.

## Out of scope

Reason/rank prompts (next slices); UI.
