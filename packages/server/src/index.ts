import "./env.js";
import { fileURLToPath } from "node:url";
import type { SearchProvider, SseEvent } from "@gooplex/shared";
import Fastify from "fastify";
import { LRUCache } from "lru-cache";
import pLimit from "p-limit";
import { z } from "zod";
import { createSearchProvider } from "./providers/search/index.js";
import { registerSearchRoute } from "./routes/search.js";

const portSchema = z.coerce.number().int().positive().default(3001);

/** Ensures shared contract types are wired at compile time. */
const _sseContractCheck: SseEvent["event"] = "done";

void _sseContractCheck;

const limit = pLimit(1);
const cache = new LRUCache<string, string>({ max: 100, ttl: 60_000 });

void limit;
void cache;

export interface BuildServerOptions {
  searchProvider?: SearchProvider;
}

export async function buildServer(opts: BuildServerOptions = {}) {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ status: "ok" }));

  registerSearchRoute(app, opts.searchProvider ?? createSearchProvider());

  return app;
}

async function main() {
  const port = portSchema.parse(process.env.PORT);
  const app = await buildServer();
  await app.listen({ port, host: "0.0.0.0" });
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
