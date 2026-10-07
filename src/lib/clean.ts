import type { Recording } from "./types";

export type DropReason = "placeholder" | "unidentified" | "non-tune";

export interface Dropped {
  reason: DropReason;
  tune: string;
  url: string;
}

/** Duplicate slug -> canonical slug. User-curated in data/tune-merges.json. */
export type Merges = Record<string, string>;

export interface DuplicateCandidate {
  key: string;
  tunes: { slug: string; name: string; recordings: number }[];
}

// Field-recording track ids, e.g. "2005 Ellis Hall 01". All are 20xx, so "1812 March" and "1930 Drought" survive.
const PLACEHOLDER = /^20\d{2} [A-Z]/;
const UNIDENTIFIED = /^(unknown|unidentified|untitled)\b/i;
const NON_TUNE = /^announcer\b/i;
const AKA = /\s*\(?\s*\b(?:a\.k\.a\.?|aka)(?![a-z])\s*/i;
const FILLER = new Set(["the", "on", "a", "an"]);

export function dropReason(title: string): DropReason | null {
  if (PLACEHOLDER.test(title)) return "placeholder";
  if (UNIDENTIFIED.test(title)) return "unidentified";
  if (NON_TUNE.test(title)) return "non-tune";
  return null;
}

/** Every name a title carries: "X aka Y" and "X (a.k.a. Y)" -> ["X", "Y"]. */
export function titleAliases(title: string): string[] {
  return title
    .split(new RegExp(AKA.source, "gi"))
    .map((part) => part.replace(/^[\s()]+|[\s()]+$/g, ""))
    .filter(Boolean);
}

/** Comparison key that ignores case, punctuation, spacing and filler words. */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/['’‘`]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !FILLER.has(w))
    .join("");
}

export function applyMerges(recordings: Recording[], merges: Merges): Recording[] {
  const nameBySlug = new Map<string, string>();
  for (const r of recordings) if (!(r.tuneSlug in merges) && !nameBySlug.has(r.tuneSlug)) nameBySlug.set(r.tuneSlug, r.tune);

  for (const target of Object.values(merges)) {
    if (!nameBySlug.has(target)) throw new Error(`merge target "${target}" is not a tune slug in the data`);
  }

  return recordings.map((r) => {
    const target = merges[r.tuneSlug];
    return target ? { ...r, tuneSlug: target, tune: nameBySlug.get(target)! } : r;
  });
}

/** Distinct tunes whose title or any alias normalizes to the same key. For the user to review. */
export function findDuplicateCandidates(recordings: Recording[]): DuplicateCandidate[] {
  const tunes = new Map<string, { slug: string; name: string; recordings: number }>();
  for (const r of recordings) {
    const t = tunes.get(r.tuneSlug) ?? { slug: r.tuneSlug, name: r.tune, recordings: 0 };
    t.recordings++;
    tunes.set(r.tuneSlug, t);
  }

  const slugsByKey = new Map<string, Set<string>>();
  for (const t of tunes.values()) {
    for (const alias of titleAliases(t.name)) {
      const key = normalizeTitle(alias);
      slugsByKey.set(key, (slugsByKey.get(key) ?? new Set()).add(t.slug));
    }
  }

  const seen = new Set<string>();
  const byCodeUnit = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
  const out: DuplicateCandidate[] = [];
  for (const key of [...slugsByKey.keys()].toSorted(byCodeUnit)) {
    const slugs = [...slugsByKey.get(key)!].toSorted(byCodeUnit);
    const id = slugs.join(" ");
    if (slugs.length < 2 || seen.has(id)) continue;
    seen.add(id);
    out.push({ key, tunes: slugs.map((s) => tunes.get(s)!) });
  }
  return out;
}

export function cleanRecordings(recordings: Recording[], merges: Merges): { kept: Recording[]; dropped: Dropped[] } {
  const kept: Recording[] = [];
  const dropped: Dropped[] = [];
  for (const r of recordings) {
    const reason = dropReason(r.tune);
    if (reason) dropped.push({ reason, tune: r.tune, url: r.url });
    else kept.push(r);
  }
  return { kept: applyMerges(kept, merges), dropped };
}
