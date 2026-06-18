import { describe, expect, it } from "vitest";
import { parseSseBuffer } from "./api.js";

describe("parseSseBuffer", () => {
  it("parses a complete SSE frame", () => {
    const frame =
      'event: searching\ndata: {"results":[{"url":"https://a.example","title":"A","snippet":"s","engine":"g","sourceType":"other","rrfScore":0.01}]}\n\n';

    const { events, remainder } = parseSseBuffer(frame);
    expect(remainder).toBe("");
    expect(events).toHaveLength(1);
    expect(events[0]?.event).toBe("searching");
    if (events[0]?.event === "searching") {
      expect(events[0].data.results[0]?.url).toBe("https://a.example");
    }
  });

  it("buffers partial frames across chunk boundaries", () => {
    const full =
      'event: done\ndata: {"results":[],"trace":{},"finalOrderSource":"rrf-fallback"}\n\n';
    const splitAt = 12;

    const first = parseSseBuffer(full.slice(0, splitAt));
    expect(first.events).toHaveLength(0);
    expect(first.remainder).toBe(full.slice(0, splitAt));

    const second = parseSseBuffer(first.remainder + full.slice(splitAt));
    expect(second.remainder).toBe("");
    expect(second.events).toHaveLength(1);
    expect(second.events[0]?.event).toBe("done");
  });

  it("parses multiple frames in one buffer", () => {
    const buffer =
      'event: error\ndata: {"stage":"searching","message":"down"}\n\n' +
      'event: done\ndata: {"results":[],"trace":{},"finalOrderSource":"rrf-fallback"}\n\n';

    const { events } = parseSseBuffer(buffer);
    expect(events.map((e) => e.event)).toEqual(["error", "done"]);
  });
});
