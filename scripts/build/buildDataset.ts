/**
 * Parses cached pages in data/raw/content/ into data/recordings.json.
 * Pages without a tune title (about pages, collections) are skipped.
 * Placeholder and announcer tracks are dropped (listed in data/dropped-titles.json),
 * merges from data/tune-merges.json are applied, and likely duplicate tunes are
 * listed in data/duplicate-candidates.json for review.
 * Usage: npm run build:data
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cleanRecordings, findDuplicateCandidates, type Merges } from "../../src/lib/clean";
import { parseRecording } from "../scrape/parseRecording";

const DATA = join(process.cwd(), "data");
const RAW = join(DATA, "raw/content");
const OUT = join(DATA, "recordings.json");

const writeJson = (path: string, value: unknown) => writeFileSync(path, `${JSON.stringify(value, null, 1)}\n`);

const files = readdirSync(RAW).filter((f) => f.endsWith(".html"));
const parsed = files
  .map((f) =>
    parseRecording(
      readFileSync(join(RAW, f), "utf8"),
      `https://www.slippery-hill.com/content/${f.replace(/\.html$/, "")}`,
    ),
  )
  .filter((r) => r !== null)
  .toSorted((a, b) => a.url.localeCompare(b.url));

const merges: Merges = JSON.parse(readFileSync(join(DATA, "tune-merges.json"), "utf8"));
const { kept: recordings, dropped } = cleanRecordings(parsed, merges);
const duplicates = findDuplicateCandidates(recordings);

writeJson(OUT, recordings);
writeJson(join(DATA, "dropped-titles.json"), dropped);
writeJson(join(DATA, "duplicate-candidates.json"), duplicates);
console.log(`${recordings.length} recordings from ${files.length} pages -> ${OUT}`);
console.log(`${dropped.length} dropped (data/dropped-titles.json), ${duplicates.length} duplicate candidates (data/duplicate-candidates.json)`);
