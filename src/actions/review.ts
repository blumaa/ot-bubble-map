"use server";

import { refresh } from "next/cache";
import { applyDecisions, type Decision } from "@/lib/review";
import { readReviewData, requireDev, writeReviewData } from "@/lib/review-files";

export type SaveResult = { ok: true } | { ok: false; error: string };

/** Writes a person's placements to data/curated.json (and any new keyword to data/categories.json). Development only. */
export async function saveDecisions(decisions: Decision[]): Promise<SaveResult> {
  requireDev();
  const { curated, taxonomy } = await readReviewData();
  let next;
  try {
    next = applyDecisions(curated, taxonomy, decisions);
  } catch (error) {
    // A typo in a path is the reviewer's to fix, so it goes back to the page instead of crashing it.
    return { ok: false, error: (error as Error).message };
  }
  await writeReviewData(next);
  refresh();
  return { ok: true };
}
