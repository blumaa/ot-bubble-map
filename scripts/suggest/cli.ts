/**
 * Writes data/keyword-suggestions.json: frequent title words not yet in data/categories.json.
 * Curate by moving words into categories.json, then re-run to see what's left.
 * Usage: npm run suggest [-- --min N]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { matchTerms, taxonomyEntries, type Group } from "../../src/lib/keywords";
import { groupTunes } from "../../src/lib/tunes";
import type { Recording } from "../../src/lib/types";
import { suggestKeywords } from "./suggestKeywords";

const DATA = join(process.cwd(), "data");
const readJson = <T>(file: string): T => JSON.parse(readFileSync(join(DATA, file), "utf8"));

const minArg = process.argv.indexOf("--min");
const minCount = minArg > -1 ? Number(process.argv[minArg + 1]) : 3;

const recordings = readJson<Recording[]>("recordings.json");
const { categories } = readJson<{ categories: Group[] }>("categories.json");
const known = taxonomyEntries(categories).flatMap((e) => matchTerms(e.node));

const suggestions = suggestKeywords(
  groupTunes(recordings).map((t) => t.name),
  { minCount, known },
);

writeFileSync(join(DATA, "keyword-suggestions.json"), `${JSON.stringify(suggestions, null, 1)}\n`);
console.log(`${suggestions.length} suggestions (min count ${minCount})`);
