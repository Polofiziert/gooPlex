import type { RawResult } from "@gooplex/shared";
import { normalizeUrl } from "./normalize.js";

const RRF_K = 60;

/** RRF contribution for a 1-based rank within a single query list. */
export function rrfScoreForRank(rank: number): number {
  return 1 / (RRF_K + rank);
}

export interface MergeInput {
  url: string;
  title: string;
  snippet: string;
  engine: string;
  sourceType: RawResult["sourceType"];
}

interface Accumulator {
  score: number;
  bestRank: number;
  item: MergeInput;
}

/**
 * Dedupe by normalized URL and merge multi-query lists via RRF (Σ 1/(60+rank)).
 * Returns results sorted by descending rrfRank (the fusion score).
 */
export function mergeResults(queryLists: MergeInput[][]): RawResult[] {
  const byKey = new Map<string, Accumulator>();

  for (const list of queryLists) {
    list.forEach((item, index) => {
      const rank = index + 1;
      const key = normalizeUrl(item.url);
      const contribution = rrfScoreForRank(rank);
      const existing = byKey.get(key);

      if (!existing) {
        byKey.set(key, { score: contribution, bestRank: rank, item });
        return;
      }

      existing.score += contribution;
      if (rank < existing.bestRank) {
        existing.bestRank = rank;
        existing.item = item;
      }
    });
  }

  const merged: RawResult[] = [...byKey.values()].map(
    ({ score, item }) => ({
      url: item.url,
      title: item.title,
      snippet: item.snippet,
      engine: item.engine,
      sourceType: item.sourceType,
      rrfRank: score,
    }),
  );

  merged.sort((a, b) => b.rrfRank - a.rrfRank || a.url.localeCompare(b.url));
  return merged;
}

/** Assign positional RRF scores for a single-query result list. */
export function assignSingleQueryRrf(
  items: Omit<RawResult, "rrfRank">[],
): RawResult[] {
  return items.map((item, index) => ({
    ...item,
    rrfRank: rrfScoreForRank(index + 1),
  }));
}

export { RRF_K };
