# Slice 10 — Resilience (cache, rate limit, fallbacks)

Status: not-started
Depends on: 08-config-files
Build step: 4 (hardening)

## Requirement

Bound cost/latency for a single-user local tool and guarantee graceful degradation.

## Contracts touched

LRU cache key, rate limiting, `format=json` fallback, partial-failure contract.

## Acceptance criteria

- [ ] In-memory `lru-cache` keyed `(q, memory, lens, PROMPT_VERSION)`, TTL `CACHE_TTL_MS`; a hit re-emits the cached `done` (skips understanding/searching/ranking).
- [ ] Backend rate limiting (`@fastify/rate-limit`) bounds local CLI/quota use.
- [ ] Regression-assert (first built in slice 03): non-stream `GET /api/search?format=json` still returns final `{results, trace, finalOrderSource}` for no-JS/error.
- [ ] All partial-failure paths from `contracts.md` are exercised by tests (search empty, search throws, reason fail, rank fail, cache hit).
- [ ] Cursor quota/auth exhaustion surfaces a clear error + RRF fallback (not a crash).

## Done when

Tests cover every failure branch ending in a single `done`/`error`; a repeated query is served from cache near-instantly.

## Out of scope

Multi-user scaling, Redis (single-user only).
