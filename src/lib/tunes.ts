import { splitKeys } from "./keys";
import { isKeyword, KINDS, nodeLabel, taxonomyEntries, titleWords, wordsMatch, type Group, type TaxonomyNode } from "./keywords";
import type { Recording } from "./types";

const TUNE_URL = "https://www.slippery-hill.com/taxonomy/tune-title/";

export interface Tune {
  slug: string;
  name: string;
  recordings: Recording[];
}

export type NodeKind = "root" | "group" | "keyword" | "tune";

export interface BubbleNode {
  kind: NodeKind;
  name: string;
  children?: BubbleNode[];
  /** Tune only: Slippery-Hill tune slug; recordings load on demand by slug. */
  slug?: string;
  /** Tune only: recording count, sizes the bubble. */
  value?: number;
  /** Tune only: key -> recordings played in it. A "G & D" recording counts toward both. */
  keys?: Record<string, number>;
  /** Tune only, when any: taxonomy paths of other keywords its title matches, strongest first. */
  alsoIn?: string[];
  /** Tune only, when any: words of the form keywords its title matches (reel, waltz…), in taxonomy order. */
  forms?: string[];
  /** Group or keyword: taxonomy path, e.g. "Animals/Wild Birds/eagle" or "Animals/Birds". */
  path?: string;
}

const ALSO_IN_MAX = 3;

/** Group for tunes nothing matches and nobody has placed yet. Must exist in the taxonomy when any do. */
export const UNSORTED_PATH = "Unsorted";

export function groupTunes(recordings: Recording[]): Tune[] {
  const bySlug = new Map<string, Tune>();
  for (const r of recordings) {
    const tune = bySlug.get(r.tuneSlug) ?? { slug: r.tuneSlug, name: r.tune, recordings: [] };
    tune.recordings.push(r);
    bySlug.set(r.tuneSlug, tune);
  }
  return [...bySlug.values()].toSorted((a, b) => a.name.localeCompare(b.name));
}

/** Slippery-Hill page listing every recording of a tune. */
export function tuneUrl(slug: string): string {
  return TUNE_URL + slug;
}

/** Who made a recording, for its bubble and popover. */
export function recordingLabel(r: Recording): string {
  const who = r.artist ?? r.playedBy ?? r.mediaSource ?? "Unknown";
  return r.year ? `${who} (${r.year})` : who;
}

/** Known facts about a recording as [label, value] pairs, in display order; unknown facts are left out. */
export function recordingDetails(r: Recording): [string, string][] {
  const details: [string, string | null][] = [
    ["Played by", r.playedBy],
    ["Key", r.key],
    ["Tuning", r.tuning],
    ["Year", r.year ? String(r.year) : null],
    ["Source", r.mediaSource],
    ["Collections", r.collections.length > 0 ? r.collections.join(", ") : null],
  ];
  return details.filter((d): d is [string, string] => d[1] !== null);
}

interface Links {
  alsoIn: string[];
  forms: string[];
}

function tuneLeaf(tune: Tune, { alsoIn, forms }: Links): BubbleNode {
  const keys: Record<string, number> = {};
  for (const key of tune.recordings.flatMap((r) => splitKeys(r.key)).toSorted()) keys[key] = (keys[key] ?? 0) + 1;
  return {
    kind: "tune",
    name: tune.name,
    slug: tune.slug,
    value: tune.recordings.length,
    keys,
    ...(alsoIn.length > 0 ? { alsoIn } : {}),
    ...(forms.length > 0 ? { forms } : {}),
  };
}

/**
 * Groups > keywords > tunes, each tune filed exactly once: under its curated path if it has one, else its strongest
 * matching group or keyword (see `KINDS`), a keyword before its own group and the first in document order on a tie.
 * Form keywords never file a tune: a form is a filter, not a subject. A group's own tunes sit beside its other
 * children. Empty keywords and groups are dropped; a group below the top level with no tunes of its own and a single
 * child is replaced by that child.
 * Each tune also lists up to three other non-function groups or keywords its title matches (`alsoIn`), for
 * cross-links, and the words of every form keyword it matches (`forms`), for the form filter.
 * A tune nothing matches goes to `UNSORTED_PATH`. Throws if a curated path names no group or keyword, or if a tune
 * needs Unsorted and the taxonomy lacks it, so no tune silently falls off the map.
 */
export function buildHierarchy(tunes: Tune[], taxonomy: Group[], curated: Record<string, string> = {}): BubbleNode {
  const entries = taxonomyEntries(taxonomy);
  const ranked = entries.toSorted((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind));
  const filed = new Map<string, Tune[]>(entries.map((e) => [e.path, []]));
  const links = new Map<string, Links>();

  const unmatched: string[] = [];
  for (const tune of tunes) {
    const words = titleWords(tune.name);
    const matched = ranked.filter((e) => wordsMatch(words, e.node));
    const path = curated[tune.slug] ?? matched.find((e) => e.kind !== "form")?.path ?? UNSORTED_PATH;
    if (path === UNSORTED_PATH && !filed.has(path)) unmatched.push(tune.slug);
    else if (!filed.has(path)) throw new Error(`Curated path "${path}" for tune "${tune.slug}" names no group or keyword`);
    else filed.get(path)!.push(tune);
    const others = matched.filter((e) => e.path !== path && e.kind !== "function").map((e) => e.path);
    const forms = matched.filter((e) => e.kind === "form").map((e) => nodeLabel(e.node));
    links.set(tune.slug, { alsoIn: others.slice(0, ALSO_IN_MAX), forms });
  }
  if (unmatched.length > 0) throw new Error(`Nothing matches these tunes and the taxonomy has no "${UNSORTED_PATH}": ${unmatched.join(", ")}`);

  const build = (node: TaxonomyNode, prefix: string, top: boolean): BubbleNode | null => {
    const path = prefix + nodeLabel(node);
    const leaves = filed.get(path)!.map((t) => tuneLeaf(t, links.get(t.slug)!));
    if (isKeyword(node)) return leaves.length > 0 ? { kind: "keyword", name: node.word, path, children: leaves } : null;
    const built = node.children.map((c) => build(c, `${path}/`, false)).filter((c) => c !== null);
    const children = [...built, ...leaves];
    if (children.length === 0) return null;
    if (built.length === 1 && leaves.length === 0 && !top) return built[0];
    return { kind: "group", name: node.name, path, children };
  };

  return { kind: "root", name: "Old-Time Tunes", children: taxonomy.map((g) => build(g, "", true)).filter((g) => g !== null) };
}
