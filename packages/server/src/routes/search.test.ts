import { describe, expect, it } from "vitest";
import type { RawResult, SearchProvider } from "@gooplex/shared";
import { buildServer } from "../index.js";

const fixtureRaw: RawResult[] = [
  {
    url: "https://beta.example/page",
    title: "Beta",
    snippet: "beta snippet",
    engine: "google",
    sourceType: "other",
    rrfScore: 1 / 61,
  },
  {
    url: "https://alpha.example/docs",
    title: "Alpha",
    snippet: "alpha snippet",
    engine: "bing",
    sourceType: "docs",
    rrfScore: 1 / 60,
  },
];

function createMockProvider(
  impl: SearchProvider["search"] = async () => fixtureRaw,
): SearchProvider {
  return { search: impl };
}

function parseSsePayload(body: string): Array<{ event: string; data: unknown }> {
  return body
    .split("\n\n")
    .map((frame) => frame.trim())
    .filter(Boolean)
    .map((frame) => {
      const lines = frame.split("\n");
      const eventLine = lines.find((l) => l.startsWith("event: "));
      const dataLine = lines.find((l) => l.startsWith("data: "));
      return {
        event: eventLine?.slice("event: ".length) ?? "",
        data: JSON.parse(dataLine?.slice("data: ".length) ?? "{}") as unknown,
      };
    });
}

describe("GET /api/search", () => {
  it("streams searching then done with SSE headers", async () => {
    const app = await buildServer({ searchProvider: createMockProvider() });
    const response = await app.inject({
      method: "GET",
      url: "/api/search?q=test",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("text/event-stream");
    expect(response.headers["cache-control"]).toBe("no-cache");
    expect(response.headers.connection).toBe("keep-alive");
    expect(response.headers["x-accel-buffering"]).toBe("no");

    const events = parseSsePayload(response.body);
    expect(events.map((e) => e.event)).toEqual(["searching", "done"]);

    const searching = events[0]?.data as { results: RawResult[] };
    expect(searching.results).toHaveLength(2);

    const done = events[1]?.data as {
      results: Array<{
        url: string;
        rank: number;
        score: number;
        reason: string;
        rrfScore: number;
      }>;
      finalOrderSource: string;
      trace: Record<string, never>;
    };
    expect(done.finalOrderSource).toBe("rrf-fallback");
    expect(done.trace).toEqual({});
    expect(done.results).toHaveLength(2);
    expect(done.results[0]?.url).toBe("https://alpha.example/docs");
    expect(done.results[0]?.rank).toBe(1);
    expect(done.results[0]?.score).toBe(0);
    expect(done.results[0]?.reason).toBe("");
    expect(done.results[0]?.rrfScore).toBeCloseTo(1 / 60, 10);
    expect(done.results[1]?.rank).toBe(2);

    await app.close();
  });

  it("returns format=json final payload", async () => {
    const app = await buildServer({ searchProvider: createMockProvider() });
    const response = await app.inject({
      method: "GET",
      url: "/api/search?q=test&format=json",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      results: Array<{ rank: number }>;
      finalOrderSource: string;
      trace: Record<string, never>;
    };
    expect(body.finalOrderSource).toBe("rrf-fallback");
    expect(body.trace).toEqual({});
    expect(body.results).toHaveLength(2);
    expect(body.results[0]?.rank).toBe(1);

    await app.close();
  });

  it("emits error then done on search failure (non-terminal error)", async () => {
    const app = await buildServer({
      searchProvider: createMockProvider(async () => {
        throw new Error("SearXNG down");
      }),
    });
    const response = await app.inject({
      method: "GET",
      url: "/api/search?q=test",
    });

    expect(response.statusCode).toBe(200);
    const events = parseSsePayload(response.body);
    expect(events.map((e) => e.event)).toEqual(["error", "done"]);

    const error = events[0]?.data as { stage: string; message: string };
    expect(error.stage).toBe("searching");
    expect(error.message).toContain("SearXNG down");

    const done = events[1]?.data as {
      results: unknown[];
      finalOrderSource: string;
    };
    expect(done.results).toEqual([]);
    expect(done.finalOrderSource).toBe("rrf-fallback");

    await app.close();
  });

  it("accepts memory and lens query params as no-ops", async () => {
    const app = await buildServer({ searchProvider: createMockProvider() });
    const response = await app.inject({
      method: "GET",
      url: "/api/search?q=test&memory=1&lens=docs",
    });

    expect(response.statusCode).toBe(200);
    const events = parseSsePayload(response.body);
    expect(events.map((e) => e.event)).toEqual(["searching", "done"]);

    await app.close();
  });

  it("returns 400 when q is missing", async () => {
    const app = await buildServer({ searchProvider: createMockProvider() });
    const response = await app.inject({
      method: "GET",
      url: "/api/search",
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });
});
