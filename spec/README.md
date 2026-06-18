# gooPlex Spec (Spec-Driven Development)

This `spec/` tree is the **source of truth** for gooPlex. Code, tests, and the eval
harness are derived from it and reconciled back to it. If reality and the spec
disagree, **fix the spec first, then the code.**

## Layout

| File | Role | Changes |
| --- | --- | --- |
| `overview.md` | Vision, philosophy, non-goals, framing, resolved decisions | rarely |
| `contracts.md` | The authoritative interface: data types, SSE protocol, API, invariants, token budget, env, observability | deliberately, with a version bump |
| `conventions.md` | Durable repo facts (ports, build contract, module rules, server patterns, env gap, testing) | when a slice changes one |
| `slices/NN-*.md` | Per-slice requirement + acceptance criteria + done-when | per slice |

The full **design rationale** ("why we decided X") lives in the Cursor plan
`gooplex_search_engine_6dcc41eb.plan.md`. This tree is the distilled, testable spec.

The machine-checkable half of the spec is **code**: `@gooplex/shared` TypeScript
types + the zod schemas in `pipeline/prompts.ts` + the eval thresholds. Prose can
drift; those cannot — prefer them whenever something can be encoded.

## The loop (per slice)

1. **Spec** — write/refine `slices/NN-*.md` (acceptance criteria map 1:1 to tests). Do this in Plan mode.
2. **Critique** — one critical subagent review pass on the slice spec before coding.
3. **Freeze contracts** — update `contracts.md` + `@gooplex/shared` types + zod schemas.
4. **Implement** — Agent mode, satisfy the acceptance criteria.
5. **Verify** — Vitest cases derived from acceptance criteria; for ranking, `pnpm eval` is the acceptance test.
6. **Reconcile** — if implementation proved the spec wrong, update the spec, then mark the slice done.

## Conventions

- A slice is **done** only when every acceptance checkbox is verifiable (a test, a
  command, or the eval gate) — not "it seems to work".
- Keep each slice spec ~20-40 lines. Split if it grows.
- Bump `CONTRACT_VERSION` in `contracts.md` on any breaking interface change; this
  is mirrored by `PROMPT_VERSION` for prompt wording.
- Build order and the MVP cut line are defined in `overview.md`.
