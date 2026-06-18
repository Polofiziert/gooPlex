import { describe, expect, it } from "vitest";
import { toRankedResults } from "./orchestrator.js";

describe("toRankedResults", () => {
  it("sorts by rrfScore desc and assigns 1-based ordinal rank", () => {
    const ranked = toRankedResults([
      {
        url: "https://b.example/",
        title: "B",
        snippet: "b",
        engine: "google",
        sourceType: "other",
        rrfScore: 1 / 62,
      },
      {
        url: "https://a.example/",
        title: "A",
        snippet: "a",
        engine: "google",
        sourceType: "other",
        rrfScore: 1 / 61,
      },
    ]);

    expect(ranked.map((r) => r.url)).toEqual([
      "https://a.example/",
      "https://b.example/",
    ]);
    expect(ranked[0]?.rank).toBe(1);
    expect(ranked[1]?.rank).toBe(2);
    expect(ranked[0]?.score).toBe(0);
    expect(ranked[0]?.reason).toBe("");
  });
});
