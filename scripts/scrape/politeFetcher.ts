import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const RETRYABLE = new Set([429, 503]);
const BACKOFF_BASE_MS = 30_000;

export interface PoliteFetcherOptions {
  cacheDir: string;
  delayMs: number;
  maxRetries: number;
  fetchFn?: (url: string, init?: RequestInit) => Promise<Response>;
  sleep?: (ms: number) => Promise<void>;
  userAgent?: string;
}

export function cachePath(cacheDir: string, url: string): string {
  const { pathname, search } = new URL(url);
  const query = search ? `_${search.slice(1).replace(/[^\w=-]/g, "_")}` : "";
  return join(cacheDir, `${pathname}${query}.html`);
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Sequential fetcher: disk cache, fixed delay between network hits, backoff on 429/503. */
export function createPoliteFetcher({
  cacheDir,
  delayMs,
  maxRetries,
  fetchFn = fetch,
  sleep = defaultSleep,
  userAgent = "old-time-bubble-map tune-map research crawler (1 req/s)",
}: PoliteFetcherOptions) {
  let hasFetched = false;

  async function fetchWithRetry(url: string): Promise<string> {
    for (let attempt = 0; ; attempt++) {
      const res = await fetchFn(url, { headers: { "User-Agent": userAgent } });
      if (res.ok) return res.text();
      if (!RETRYABLE.has(res.status) || attempt >= maxRetries) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      await sleep(BACKOFF_BASE_MS * 2 ** attempt);
    }
  }

  return {
    async get(url: string): Promise<string> {
      const file = cachePath(cacheDir, url);
      if (existsSync(file)) return readFileSync(file, "utf8");

      if (hasFetched) await sleep(delayMs);
      hasFetched = true;

      const body = await fetchWithRetry(url);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, body);
      return body;
    },
  };
}
