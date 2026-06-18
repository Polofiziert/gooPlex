/** Bump on any wording change — invalidates cache + snapshots. */
export const PROMPT_VERSION = "reason@1|rank@1";

/** Per SearXNG query, before merge. */
export const RESULTS_PER_QUERY = 10;

/** Overflow → keep top-K by RRF. */
export const RANK_CANDIDATE_CAP = 24;

export const SNIPPET_MAX_CHARS = 280;
export const TITLE_MAX_CHARS = 120;

/** Alternative queries cap derived from MAX_QUERIES. */
export const altQueryCap = (maxQueries: number): number =>
  Math.max(0, maxQueries - 1);
