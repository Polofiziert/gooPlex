# Slice 06 — Eval harness (the go/no-go gate)

Status: not-started
Depends on: 05-rank-step
Build step: 2

## Requirement

Answer the project's central question with data: **does AI ranking beat the free RRF
baseline enough to justify ~16-24s latency?** A/B on a frozen candidate set.

## Contracts touched

`eval/queries.jsonl`, `eval/metrics.ts`, candidate + AI caches, `pnpm eval`.

## Acceptance criteria

- [ ] `eval/queries.jsonl`: 12 queries (3 factual, 3 how-to, 2 ambiguous, 2 recent-events [quarantined], 2 niche), each `{id,category,query,gold:[url...],capturedAt}`; gold labeled from the captured pool.
- [ ] `eval/cache/candidates/<id>.json` (RRF `RawResult[]`, refreshed via `--refresh-candidates`) makes runs network-free.
- [ ] `eval/cache/ai/<sha256(provider+model+system+user)>.json` caches raw result + parse outcome + latency; deterministic seed -> cache actually hits on re-run.
- [ ] `eval/metrics.ts` (pure, unit-tested): `RR=1/rank-of-first-gold` (0 if none), `MRR`, `Recall@3 = fraction with >=1 gold in top-3`.
- [ ] `pnpm eval` reports paired `ΔMRR`, `ΔRecall@3`, win/tie/loss over the **10 scored** queries; `goldInPool=NO` rows reported separately (retrieval miss, not ranking).
- [ ] Rank prompt sees shuffled (not RRF) order so the A/B is not "AI copies RRF".
- [ ] Flags `--refresh-candidates`, `--refresh-ai`, `--query <id>`, `--json`; writes `eval/reports/<ts>.json` + `latest.md`.
- [ ] `eval/label.ts` (optional interactive labeler) prints the captured pool so gold URLs can be pasted in.
- [ ] The report states results are **directional only** (n=10; no significance claims).

## Done when

`pnpm eval` prints the table + aggregate. **Decision rule (hard):** AI wins on **>=6 of the 10 scored queries** (ties count as non-wins) AND aggregate `ΔMRR > 0`; if not, escalate — revisit prompt/model or de-scope ranking before building further.

## Out of scope

Graded nDCG labels, k-sampling for nondeterminism, pairwise human protocol (note as fast-follow).
