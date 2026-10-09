import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Group } from "./keywords";
import type { Placements } from "./placements";

/** The review page edits files in the repo, so it exists only on a developer's machine. 404 everywhere else. */
export function requireDev() {
  if (process.env.NODE_ENV !== "development") notFound();
}

// Literal paths, so the bundler traces only these three files instead of everything under data/.
const FILES = {
  ai: path.join(process.cwd(), "data", "ai-placements.json"),
  curated: path.join(process.cwd(), "data", "curated.json"),
  categories: path.join(process.cwd(), "data", "categories.json"),
};

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

/** Same layout as the committed files (indent 1, trailing newline), so a save diffs only what changed. */
async function writeJson(file: string, value: unknown) {
  await writeFile(file, `${JSON.stringify(value, null, 1)}\n`);
}

export interface ReviewData {
  ai: Placements;
  curated: Placements;
  taxonomy: Group[];
}

/** Read from disk on every call, not imported, so the page always shows the last save. */
export async function readReviewData(): Promise<ReviewData> {
  const [ai, curated, categories] = await Promise.all([
    readJson<Placements>(FILES.ai),
    readJson<Placements>(FILES.curated),
    readJson<{ categories: Group[] }>(FILES.categories),
  ]);
  return { ai, curated, taxonomy: categories.categories };
}

export async function writeReviewData({ curated, taxonomy }: Pick<ReviewData, "curated" | "taxonomy">) {
  await Promise.all([writeJson(FILES.curated, curated), writeJson(FILES.categories, { categories: taxonomy })]);
}
