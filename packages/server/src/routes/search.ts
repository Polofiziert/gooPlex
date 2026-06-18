import type { RankedResult, SearchProvider, SseEvent } from "@gooplex/shared";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  FINAL_ORDER_SOURCE_RRF,
  runSearchOrchestrator,
} from "../pipeline/orchestrator.js";

const searchQuerySchema = z.object({
  q: z.string().trim().min(1, "q is required"),
  memory: z
    .enum(["0", "1"])
    .optional()
    .transform((v) => v === "1"),
  lens: z.string().optional(),
  format: z.enum(["json"]).optional(),
});

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
} as const;

function writeSseEvent(
  write: (chunk: string) => void,
  event: SseEvent,
): void {
  write(`event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`);
}

export function registerSearchRoute(
  app: FastifyInstance,
  provider: SearchProvider,
): void {
  app.get("/api/search", async (request, reply) => {
    const parsed = searchQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: parsed.error.flatten().fieldErrors,
      });
    }

    const { q, format } = parsed.data;
    void parsed.data.memory;
    void parsed.data.lens;

    if (format === "json") {
      let results: RankedResult[] = [];

      await runSearchOrchestrator(provider, q, {
        onSearching: () => {},
        onError: () => {},
        onDone: (ranked) => {
          results = ranked;
        },
      });

      return reply.send({
        results,
        trace: {},
        finalOrderSource: FINAL_ORDER_SOURCE_RRF,
      });
    }

    reply.hijack();
    reply.raw.writeHead(200, SSE_HEADERS);

    const write = (chunk: string) => {
      reply.raw.write(chunk);
    };

    await runSearchOrchestrator(provider, q, {
      onSearching: (raw) => {
        writeSseEvent(write, { event: "searching", data: { results: raw } });
      },
      onError: (_stage, message) => {
        writeSseEvent(write, {
          event: "error",
          data: { stage: "searching", message },
        });
      },
      onDone: (results) => {
        writeSseEvent(write, {
          event: "done",
          data: {
            results,
            trace: {},
            finalOrderSource: FINAL_ORDER_SOURCE_RRF,
          },
        });
      },
    });

    reply.raw.end();
  });
}
