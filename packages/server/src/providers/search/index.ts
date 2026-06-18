import type { SearchProvider } from "@gooplex/shared";
import { SearxngProvider } from "./searxng.js";

export { SearxngProvider } from "./searxng.js";
export { mergeResults, assignSingleQueryRrf, rrfScoreForRank } from "./merge.js";
export { normalizeUrl, classifySourceType } from "./normalize.js";

export function createSearchProvider(): SearchProvider {
  const provider = process.env.SEARCH_PROVIDER ?? "searxng";

  switch (provider) {
    case "searxng":
      return new SearxngProvider();
    default:
      throw new Error(`Unsupported SEARCH_PROVIDER: ${provider}`);
  }
}
