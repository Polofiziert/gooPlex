import { describe, expect, it } from "vitest";
import {
  assignSingleQueryRrf,
  mergeResults,
  rrfScoreForRank,
} from "./merge.js";

describe("mergeResults RRF", () => {
  it("ranks a fixed fixture set deterministically", () => {
    const queryA = [
      {
        url: "https://alpha.example/docs",
        title: "Alpha",
        snippet: "a",
        engine: "google",
        sourceType: "docs" as const,
      },
      {
        url: "https://beta.example/page",
        title: "Beta",
        snippet: "b",
        engine: "google",
        sourceType: "other" as const,
      },
      {
        url: "https://gamma.example/",
        title: "Gamma",
        snippet: "g",
        engine: "bing",
        sourceType: "other" as const,
      },
    ];

    const queryB = [
      {
        url: "https://beta.example/page/",
        title: "Beta dup",
        snippet: "b2",
        engine: "duckduckgo",
        sourceType: "other" as const,
      },
      {
        url: "https://delta.example/article",
        title: "Delta",
        snippet: "d",
        engine: "google",
        sourceType: "news" as const,
      },
      {
        url: "https://alpha.example/docs?utm_source=t",
        title: "Alpha tracked",
        snippet: "a2",
        engine: "bing",
        sourceType: "docs" as const,
      },
    ];

    const merged = mergeResults([queryA, queryB]);

    const betaScore = rrfScoreForRank(2) + rrfScoreForRank(1);
    const alphaScore = rrfScoreForRank(1) + rrfScoreForRank(3);
    const gammaScore = rrfScoreForRank(3);
    const deltaScore = rrfScoreForRank(2);

    expect(merged.map((r) => r.url)).toEqual([
      "https://beta.example/page/",
      "https://alpha.example/docs",
      "https://delta.example/article",
      "https://gamma.example/",
    ]);

    expect(merged[0]?.rrfRank).toBeCloseTo(betaScore, 10);
    expect(merged[1]?.rrfRank).toBeCloseTo(alphaScore, 10);
    expect(merged[2]?.rrfRank).toBeCloseTo(deltaScore, 10);
    expect(merged[3]?.rrfRank).toBeCloseTo(gammaScore, 10);

    // Deduped: beta keeps rank-1 metadata from query B
    expect(merged[0]?.engine).toBe("duckduckgo");
    expect(merged[0]?.title).toBe("Beta dup");
  });

  it("assignSingleQueryRrf uses positional ranks", () => {
    const items = [
      {
        url: "https://one.example/",
        title: "One",
        snippet: "1",
        engine: "google",
        sourceType: "other" as const,
      },
      {
        url: "https://two.example/",
        title: "Two",
        snippet: "2",
        engine: "google",
        sourceType: "other" as const,
      },
    ];

    const ranked = assignSingleQueryRrf(items);
    expect(ranked[0]?.rrfRank).toBeCloseTo(rrfScoreForRank(1), 10);
    expect(ranked[1]?.rrfRank).toBeCloseTo(rrfScoreForRank(2), 10);
  });
});
