/** Mirrors `CONTRACT_VERSION` in spec/contracts.md — bump on breaking changes. */
export const CONTRACT_VERSION = 1;

export type SourceType = "docs" | "academic" | "forum" | "news" | "other";

export interface RawResult {
  url: string;
  title: string;
  snippet: string;
  engine: string;
  sourceType: SourceType;
  rrfRank: number;
}

export interface RankedResult extends RawResult {
  score: number;
  rank: number;
  reason: string;
}

export interface SearchIntent {
  summary: string;
  assumptions: string[];
}

export interface IdealResult {
  description: string;
  signals: string[];
}

export interface ReasoningTrace {
  searchIntent?: SearchIntent;
  idealResult?: IdealResult;
  alternativeQueries?: string[];
  rankingRationale?: Array<{ url: string; reason: string }>;
}

export type SseEvent =
  | { event: "understanding"; data: { searchIntent: SearchIntent; idealResult: IdealResult } }
  | { event: "expanding"; data: { queries: string[] } }
  | { event: "searching"; data: { results: RawResult[] } }
  | { event: "ranking"; data: { rationale: { url: string; reason: string }[] } }
  | {
      event: "done";
      data: {
        results: RankedResult[];
        trace: ReasoningTrace;
        finalOrderSource: "ai" | "rrf-fallback";
      };
    }
  | { event: "error"; data: { stage: "reasoning" | "searching" | "ranking"; message: string } };

export interface AiProvider {
  complete(input: {
    system: string;
    prompt: string;
    signal?: AbortSignal;
  }): Promise<string>;
}

export interface SearchProvider {
  search(
    query: string,
    opts?: { count?: number; signal?: AbortSignal },
  ): Promise<RawResult[]>;
}
