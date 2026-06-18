# Slice 08 — Steering files + loader (MVP completes here)

Status: not-started
Depends on: 07-reason-step
Build step: 3

## Requirement

Finalize the steering layer: replace slice 07's placeholder files with full drafted
content, and harden `config/loader.ts` (from slice 07) to enforce the
`rules.md` <-> `idealResult` contract and precedence.

## Contracts touched

`config/{searchInitialization,rules,memory}.md`, `config/loader.ts`, steering precedence in `overview.md`.

## Acceptance criteria

- [ ] `config/searchInitialization.md` (dev system layer): mission, output discipline, ranking principles, governance/precedence, tone. Tight (token cost).
- [ ] `config/rules.md` (user rubric template): preferred/distrusted sources, recency, language, format, hard-nos, a commented "add your own" block.
- [ ] `config/memory.md`: header stating it's used only when memory is ON; example durable prefs; "avoid secrets" note.
- [ ] `config/loader.ts` (from slice 07) finalized: loads all three; `memory.md` injected **only** when the request flag is set; performs a length/sanity budget check.
- [ ] Precedence enforced: `searchInitialization.md` > `rules.md` > generated `idealResult` > web snippets; `memory.md` is additive and `rules.md` wins on conflict; the user cannot override the dev layer's never-answer discipline.
- [ ] `rules.md` <-> `idealResult` contract holds: generated `idealResult.signals` instantiate the rubric, don't contradict it; malformed `idealResult` is non-fatal.
- [ ] Worked-example test ("best wireless headphones 2026") runs against a **recorded/mock** `idealResult` and asserts the rubric demotes the listicle pattern the query attracts (deterministic; no live AI).

## Done when

A deterministic test asserts the rubric -> `idealResult.signals` mapping against a recorded/mock `idealResult` fixture; the memory toggle changes injected context. (The live "editing `rules.md` changes the ranking" demo is a separate manual gate.) **MVP is now complete.**

## Out of scope

UI affordances for editing rules / toggling memory (covered by panel + design slices).
