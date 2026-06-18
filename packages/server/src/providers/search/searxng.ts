import type { RawResult, SearchProvider } from "@gooplex/shared";
import { RESULTS_PER_QUERY } from "../../pipeline/prompts.js";
import { assignSingleQueryRrf } from "./merge.js";
import { classifySourceType } from "./normalize.js";

const DEFAULT_TIMEOUT_MS = 15_000;

interface SearxngResult {
  url: string;
  title: string;
  content: string;
  engine: string;
}

interface SearxngResponse {
  results?: SearxngResult[];
}

export interface SearxngProviderOptions {
  baseUrl?: string;
  timeoutMs?: number;
}

export class SearxngProvider implements SearchProvider {
  readonly baseUrl: string;
  readonly timeoutMs: number;

  constructor(opts: SearxngProviderOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? process.env.SEARXNG_URL ?? "http://localhost:8080").replace(
      /\/+$/,
      "",
    );
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async search(
    query: string,
    opts: { count?: number; signal?: AbortSignal } = {},
  ): Promise<RawResult[]> {
    const count = opts.count ?? RESULTS_PER_QUERY;
    const url = new URL("/search", this.baseUrl);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");

    const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
    const signal = opts.signal
      ? AbortSignal.any([opts.signal, timeoutSignal])
      : timeoutSignal;

    let response: Response;
    try {
      response = await fetch(url, { signal });
    } catch (err) {
      throw new Error(
        `SearXNG request failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (!response.ok) {
      throw new Error(
        `SearXNG returned ${response.status} ${response.statusText}`,
      );
    }

    let body: SearxngResponse;
    try {
      body = (await response.json()) as SearxngResponse;
    } catch {
      throw new Error("SearXNG returned invalid JSON");
    }

    const rows = (body.results ?? []).slice(0, count);
    const mapped = rows.map((row) => ({
      url: row.url,
      title: row.title ?? "",
      snippet: row.content ?? "",
      engine: row.engine ?? "unknown",
      sourceType: classifySourceType(row.url),
    }));

    return assignSingleQueryRrf(mapped);
  }
}
