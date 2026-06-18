# Slice 07 — Reason step

Status: not-started
Depends on: 05-rank-step (06-eval informs whether to proceed)
Build step: 3

## Requirement

Add the upstream "understand + expand" AI call that produces `searchIntent`,
`idealResult`, and alternative queries, replacing the stubbed values from slice 05.

## Contracts touched

Reason prompt + `ReasonSchema` in `pipeline/prompts.ts`; `understanding` + `expanding` SSE; steering-file injection.

## Acceptance criteria

- [ ] `config/loader.ts` + **minimal placeholder** `config/{searchInitialization,rules,memory}.md` are created here so the reason call has something to inject (full content + precedence/contract enforcement land in slice 08). This removes the 07<->08 inversion.
- [ ] Reason prompt built per `contracts.md`: system = `searchInitialization.md` + `rules.md` (+ `memory.md` if `memory=1`), joined with `---`; user message asks for intent, ideal result, and up to `altQueryCap` alternative queries.
- [ ] Output validated by `ReasonSchema`; `alternativeQueries` sliced to `altQueryCap(MAX_QUERIES)`.
- [ ] Alternative queries fanned out to `SearchProvider` in parallel (cap `MAX_QUERIES`), merged into the candidate set before rank.
- [ ] Backend emits `understanding` (sI, iR) then `expanding` (queries) before `searching`.
- [ ] Reason failure follows the partial-failure contract (`error{stage:"reasoning"}`, skip rank, RRF `done`).
- [ ] Pure prompt builder + snapshot test; reason output flows into the rank prompt (no stub remains).

## Done when

A live query streams understanding -> expanding -> searching -> ranking -> done, and the rank step uses the real generated `idealResult`.

## Out of scope

The reasoning panel UI (next slice); `rules.md`/`memory.md` file content (slice 08).
