# Slice 05 — Rank step

Status: not-started
Depends on: 04-ai-provider
Build step: 2

## Requirement

Score the merged candidate set with the AI on snippets only, then re-order the
already-streamed RRF results in place. This is the core value-add.

## Contracts touched

Rank prompt + `RankSchema` in `pipeline/prompts.ts`; `ranking` + `done` SSE events; token-budget constants.

## Acceptance criteria

- [ ] Rank prompt built per `contracts.md`: candidates serialized `[id] (sourceType) title\n  snippet`, truncated to `TITLE_MAX_CHARS`/`SNIPPET_MAX_CHARS`, wrapped in the UNTRUSTED-DATA fence; "JSON array only" closer.
- [ ] The prompt injects `searchIntent` + `idealResult` as the ONLY steering (decision 5); here they are a fixed stub, replaced by slice 07.
- [ ] Candidate set sorted deterministically (RRF, then URL) then **shuffled with RNG seeded from the normalized query**; the same seed maps scores back (no desync).
- [ ] Overflow beyond `RANK_CANDIDATE_CAP` keeps top-K by RRF; dropped results stay in the UI prelim list with no score.
- [ ] Output validated by `RankSchema`; post-validate drops `id>=n`/duplicates, missing id -> `{score:0, reason:""}` (join never throws).
- [ ] Backend emits `ranking` (rationale) then `done` with enriched `RankedResult[]`; UI re-orders in place (RRF prelim shown first).
- [ ] Rank failure/quota follows the partial-failure contract (`error{stage:"ranking"}` then RRF-order `done`, `finalOrderSource:"rrf-fallback"`).
- [ ] Prompt builder is a pure function with a snapshot test asserting `PROMPT_VERSION`.

## Done when

A live query shows AI-reordered results with per-result "why ranked #N"; injecting an instruction-laden snippet does not change output structure (ids/scores only).

## Out of scope

The reason step (intent/ideal/expansion) — stub a fixed `searchIntent`/`idealResult` here; the eval slice depends on isolating the rank prompt.
