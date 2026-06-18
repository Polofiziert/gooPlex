import { describe, expect, it } from "vitest";
import "../../env.js";
import { RESULTS_PER_QUERY } from "../../pipeline/prompts.js";
import { SearxngProvider } from "./searxng.js";

async function searxngAvailable(baseUrl: string): Promise<boolean> {
  try {
    const url = new URL("/search", baseUrl);
    url.searchParams.set("q", "test");
    url.searchParams.set("format", "json");
    const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return false;
    const body = (await res.json()) as { results?: unknown[] };
    return Array.isArray(body.results) && body.results.length > 0;
  } catch {
    return false;
  }
}

const baseUrl = process.env.SEARXNG_URL ?? "http://localhost:8080";
const live = await searxngAvailable(baseUrl);

describe.runIf(live)("SearxngProvider live", () => {
  it('search("test") returns normalized RawResult[]', async () => {
    const provider = new SearxngProvider({ baseUrl });
    const results = await provider.search("test");

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(RESULTS_PER_QUERY);

    for (const row of results) {
      expect(row.url).toMatch(/^https?:\/\//);
      expect(typeof row.title).toBe("string");
      expect(typeof row.snippet).toBe("string");
      expect(typeof row.engine).toBe("string");
      expect(["docs", "academic", "forum", "news", "other"]).toContain(
        row.sourceType,
      );
      expect(row.rrfRank).toBeGreaterThan(0);
    }
  });
});

describe("SearxngProvider errors", () => {
  it("rejects when SearXNG is unreachable", async () => {
    const provider = new SearxngProvider({
      baseUrl: "http://127.0.0.1:1",
      timeoutMs: 500,
    });

    await expect(provider.search("test")).rejects.toThrow(/SearXNG/);
  });

  it("honors AbortSignal", async () => {
    const provider = new SearxngProvider({
      baseUrl: "http://127.0.0.1:1",
      timeoutMs: 30_000,
    });
    const controller = new AbortController();
    controller.abort();

    await expect(
      provider.search("test", { signal: controller.signal }),
    ).rejects.toThrow();
  });
});
