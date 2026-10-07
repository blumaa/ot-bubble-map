import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createPoliteFetcher, cachePath } from "./politeFetcher";

const ok = (body: string) => new Response(body, { status: 200 });

function setup(responses: Response[]) {
  const cacheDir = mkdtempSync(join(tmpdir(), "ot-cache-"));
  const fetchFn = vi.fn(async () => responses.shift()!);
  const sleep = vi.fn(async () => {});
  const fetcher = createPoliteFetcher({ cacheDir, fetchFn, sleep, delayMs: 1000, maxRetries: 2 });
  return { cacheDir, fetchFn, sleep, fetcher };
}

describe("cachePath", () => {
  it("maps URL path to file under cache dir", () => {
    expect(cachePath("/c", "https://www.slippery-hill.com/content/duck-river")).toBe(
      "/c/content/duck-river.html",
    );
  });

  it("keeps query strings distinct", () => {
    expect(cachePath("/c", "https://x.com/sitemap.xml?page=2")).toBe("/c/sitemap.xml_page=2.html");
  });
});

describe("politeFetcher", () => {
  it("fetches, caches, and waits delay between requests", async () => {
    const { cacheDir, fetchFn, sleep, fetcher } = setup([ok("a"), ok("b")]);
    expect(await fetcher.get("https://x.com/content/a")).toBe("a");
    expect(await fetcher.get("https://x.com/content/b")).toBe("b");
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(1000);
    expect(readFileSync(join(cacheDir, "content/a.html"), "utf8")).toBe("a");
  });

  it("serves cached pages without network or delay", async () => {
    const { cacheDir, fetchFn, sleep, fetcher } = setup([]);
    const file = join(cacheDir, "content/a.html");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, "cached");
    expect(await fetcher.get("https://x.com/content/a")).toBe("cached");
    expect(fetchFn).not.toHaveBeenCalled();
    expect(sleep).not.toHaveBeenCalled();
  });

  it("backs off and retries on 429/503", async () => {
    const { fetchFn, sleep, fetcher } = setup([
      new Response("", { status: 429 }),
      new Response("", { status: 503 }),
      ok("done"),
    ]);
    expect(await fetcher.get("https://x.com/content/a")).toBe("done");
    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledWith(30_000);
    expect(sleep).toHaveBeenCalledWith(60_000);
  });

  it("throws after max retries", async () => {
    const { fetcher } = setup([429, 429, 429].map((s) => new Response("", { status: s })));
    await expect(fetcher.get("https://x.com/content/a")).rejects.toThrow("HTTP 429");
  });

  it("throws immediately on other errors and does not cache", async () => {
    const { cacheDir, fetchFn, fetcher } = setup([new Response("", { status: 404 })]);
    await expect(fetcher.get("https://x.com/content/a")).rejects.toThrow("HTTP 404");
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(() => readFileSync(join(cacheDir, "content/a.html"))).toThrow();
  });
});
