import aiPlacements from "../../data/ai-placements.json";
import curated from "../../data/curated.json";

/** Slug -> keyword path chosen by someone other than the matcher. */
export type Placements = Record<string, string>;

/** Combine placement sources. A person's choice (curated) beats an AI suggestion. */
export function mergePlacements(ai: Placements, human: Placements): Placements {
  return { ...ai, ...human };
}

/** Every placement the map uses: curated, then AI. The matcher fills in the rest. */
export const placements = mergePlacements(aiPlacements as Placements, curated as Placements);
