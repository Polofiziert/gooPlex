import type { RankedResult, RawResult, SearchProvider } from "@gooplex/shared";

export const FINAL_ORDER_SOURCE_RRF = "rrf-fallback" as const;

/** Sort by rrfScore desc and assign 1-based display rank (never copy rrfScore into rank). */
export function toRankedResults(raw: RawResult[]): RankedResult[] {
  const sorted = [...raw].sort(
    (a, b) => b.rrfScore - a.rrfScore || a.url.localeCompare(b.url),
  );

  return sorted.map((row, index) => ({
    ...row,
    score: 0,
    rank: index + 1,
    reason: "",
  }));
}

export interface SearchOrchestratorCallbacks {
  onSearching: (results: RawResult[]) => void;
  onError: (stage: "searching", message: string) => void;
  onDone: (results: RankedResult[]) => void;
}

/** Slice-03 orchestrator: single SearXNG query, no AI stages. */
export async function runSearchOrchestrator(
  provider: SearchProvider,
  query: string,
  callbacks: SearchOrchestratorCallbacks,
  opts: { signal?: AbortSignal } = {},
): Promise<void> {
  try {
    const raw = await provider.search(query, { signal: opts.signal });
    callbacks.onSearching(raw);
    callbacks.onDone(toRankedResults(raw));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    callbacks.onError("searching", message);
    callbacks.onDone([]);
  }
}
