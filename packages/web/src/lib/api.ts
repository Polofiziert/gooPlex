import type { RawResult, RankedResult, ReasoningTrace, SseEvent } from "@gooplex/shared";

export interface SearchStreamOptions {
  signal?: AbortSignal;
  memory?: boolean;
  lens?: string;
}

export interface SearchDonePayload {
  results: RankedResult[];
  trace: ReasoningTrace;
  finalOrderSource: "ai" | "rrf-fallback";
}

/** Parse one or more complete SSE frames from a buffer; returns parsed events and leftover text. */
export function parseSseBuffer(buffer: string): {
  events: SseEvent[];
  remainder: string;
} {
  const events: SseEvent[] = [];
  let rest = buffer;

  while (true) {
    const idx = rest.indexOf("\n\n");
    if (idx === -1) break;

    const frame = rest.slice(0, idx);
    rest = rest.slice(idx + 2);

    const parsed = parseSseFrame(frame);
    if (parsed) events.push(parsed);
  }

  return { events, remainder: rest };
}

function parseSseFrame(frame: string): SseEvent | null {
  const lines = frame.split("\n");
  const eventLine = lines.find((line) => line.startsWith("event: "));
  const dataLine = lines.find((line) => line.startsWith("data: "));
  if (!eventLine || !dataLine) return null;

  const event = eventLine.slice("event: ".length).trim();
  const data = JSON.parse(dataLine.slice("data: ".length)) as SseEvent["data"];

  return { event, data } as SseEvent;
}

async function* readSseEvents(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<SseEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const { events, remainder } = parseSseBuffer(buffer);
      buffer = remainder;

      for (const event of events) {
        yield event;
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      const { events } = parseSseBuffer(`${buffer}\n\n`);
      for (const event of events) {
        yield event;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function createSearchStream(
  query: string,
  opts: SearchStreamOptions = {},
): Promise<AsyncIterable<SseEvent>> {
  const params = new URLSearchParams({ q: query });
  if (opts.memory !== undefined) {
    params.set("memory", opts.memory ? "1" : "0");
  }
  if (opts.lens) {
    params.set("lens", opts.lens);
  }

  const response = await fetch(`/api/search?${params.toString()}`, {
    signal: opts.signal,
  });

  if (!response.ok) {
    throw new Error(`Search request failed: ${response.status}`);
  }

  if (!response.body) {
    throw new Error("Search response has no body");
  }

  return readSseEvents(response.body);
}

export type SearchStage = "idle" | "searching" | "done" | "error";

export interface SearchState {
  stage: SearchStage;
  partialResults: RawResult[];
  results: RankedResult[];
  trace: ReasoningTrace;
  finalOrderSource: "ai" | "rrf-fallback" | null;
  errorMessage: string | null;
}

export const initialSearchState = (): SearchState => ({
  stage: "idle",
  partialResults: [],
  results: [],
  trace: {},
  finalOrderSource: null,
  errorMessage: null,
});

/** Apply one SSE event to search state (partialResults replaced wholesale on searching). */
export function applySearchEvent(
  state: SearchState,
  event: SseEvent,
): SearchState {
  switch (event.event) {
    case "searching":
      return {
        ...state,
        stage: "searching",
        partialResults: event.data.results,
      };
    case "error":
      return {
        ...state,
        errorMessage: event.data.message,
      };
    case "done":
      return {
        ...state,
        stage: "done",
        results: event.data.results,
        trace: event.data.trace,
        finalOrderSource: event.data.finalOrderSource,
        partialResults: [],
      };
    default:
      return state;
  }
}
