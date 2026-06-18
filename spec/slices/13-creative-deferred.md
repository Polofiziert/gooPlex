# Slice 13 — Creative extensions (POST-MVP backlog)

Status: deferred
Depends on: a green eval (06) + solid MVP (08)
Build step: 5

## Requirement

Optional features that deepen the "fight your filter bubble / show your work" ethos.
Build ONLY after the core is solid and eval shows ranking earns its latency.

## Candidates (each needs its own thin spec before building)

- **Lenses** — selectable `idealResult` presets (Beginner / Expert / Primary-source /
  Contrarian) threaded via `?lens=`. Already present in cache key + API contract;
  needs UI + preset definitions. Define typed `Lens` enum before it touches the rank prompt.
- **Source-diversity indicator** — surface when the top-N results cluster on one
  `sourceType`/domain, nudging the reader to notice a narrow view.

## Acceptance criteria

- [ ] Not started until `06-eval` passes its decision rule and MVP (slices 1-8) is complete.
- [ ] Each extension gets its own `slices/NN-*.md` with acceptance criteria before implementation.

## Out of scope

Anything that turns gooPlex into an answer engine or adds conversion/ad surfaces.
