import { describe, expect, it } from "vitest";
import { CONTRACT_VERSION, type SseEvent } from "./index.js";

describe("@gooplex/shared", () => {
  it("exports CONTRACT_VERSION", () => {
    expect(CONTRACT_VERSION).toBe(1);
  });

  it("types SseEvent union members", () => {
    const event: SseEvent = {
      event: "error",
      data: { stage: "searching", message: "test" },
    };
    expect(event.event).toBe("error");
  });
});
