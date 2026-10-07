/**
 * Downloads every /content/ page listed in slippery-hill's sitemap into data/raw/.
 * Sequential, 1 req/s, resumable (cached pages are skipped).
 * Usage: npm run crawl [-- --limit N]
 */
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createPoliteFetcher } from "./politeFetcher";
import { parseLocs, uniqueContentUrls } from "./sitemap";

const SITEMAP = "https://www.slippery-hill.com/sitemap.xml";
const DATA_DIR = join(process.cwd(), "data");
const CACHE_DIR = join(DATA_DIR, "raw");
const FAILURES = join(DATA_DIR, "crawl-failures.txt");

async function main() {
  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

  mkdirSync(DATA_DIR, { recursive: true });
  const fetcher = createPoliteFetcher({ cacheDir: CACHE_DIR, delayMs: 1000, maxRetries: 3 });

  const pages = parseLocs(await fetcher.get(SITEMAP));
  const urls: string[] = [];
  for (const page of pages) urls.push(...parseLocs(await fetcher.get(page)));

  const todo = uniqueContentUrls(urls).slice(0, limit);
  console.log(`${todo.length} content pages`);

  let failed = 0;
  for (const [i, url] of todo.entries()) {
    try {
      await fetcher.get(url);
    } catch (err) {
      failed++;
      appendFileSync(FAILURES, `${url}\t${(err as Error).message}\n`);
    }
    if (i % 100 === 0) console.log(`${i}/${todo.length} (failed ${failed})`);
  }
  console.log(`done: ${todo.length - failed} ok, ${failed} failed (see ${FAILURES})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
