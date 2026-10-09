import { isKeyword, type Group } from "./keywords";
import type { Placements } from "./placements";
import { UNSORTED_PATH, type BubbleNode } from "./tunes";

/** Slug -> path of the group or keyword the map files the tune in. */
export function tunePaths(root: BubbleNode): Map<string, string> {
  const paths = new Map<string, string>();
  const walk = (node: BubbleNode) => {
    for (const child of node.children ?? []) {
      if (child.kind === "tune") paths.set(child.slug!, node.path!);
      else walk(child);
    }
  };
  walk(root);
  return paths;
}

export interface PlacementCounts {
  total: number;
  /** Placed or confirmed by a person, Unsorted included. */
  person: number;
  /** Placed by AI and not yet checked by a person. */
  ai: number;
  /** Filed by matching words in the title. */
  matcher: number;
  /** Nothing matched and nobody has placed it yet. */
  unsorted: number;
}

/** Who decided where each tune sits. A person's choice beats AI, which beats the title matcher. */
export function placementCounts(paths: Map<string, string>, ai: Placements, curated: Placements): PlacementCounts {
  const counts: PlacementCounts = { total: 0, person: 0, ai: 0, matcher: 0, unsorted: 0 };
  for (const [slug, path] of paths) {
    counts.total++;
    if (slug in curated) counts.person++;
    else if (slug in ai) counts.ai++;
    else if (path === UNSORTED_PATH) counts.unsorted++;
    else counts.matcher++;
  }
  return counts;
}

export interface GroupSummary {
  name: string;
  emoji?: string;
  /** Tunes filed in the group or anywhere below it. */
  tunes: number;
  /** Keywords in the group or anywhere below it. */
  keywords: number;
  /** Words of the keywords holding the most tunes, busiest first. */
  examples: string[];
  children: GroupSummary[];
}

/** Each group in the taxonomy with its counts and up to `exampleCount` busiest keywords, subgroups nested. */
export function groupSummaries(taxonomy: Group[], paths: Map<string, string>, exampleCount: number): GroupSummary[] {
  const perPath = new Map<string, number>();
  for (const path of paths.values()) perPath.set(path, (perPath.get(path) ?? 0) + 1);

  // Returns the summary and every keyword below the group with its tune count, for the parent's examples.
  const summarize = (group: Group, prefix: string): [GroupSummary, [string, number][]] => {
    const path = prefix + group.name;
    let tunes = perPath.get(path) ?? 0;
    let keywords = 0;
    const found: [string, number][] = [];
    const children: GroupSummary[] = [];
    for (const child of group.children) {
      if (isKeyword(child)) {
        const n = perPath.get(`${path}/${child.word}`) ?? 0;
        keywords++;
        tunes += n;
        if (n > 0) found.push([child.word, n]);
        continue;
      }
      const [sub, below] = summarize(child, `${path}/`);
      tunes += sub.tunes;
      keywords += sub.keywords;
      found.push(...below);
      children.push(sub);
    }
    // toSorted is stable, so equal counts keep taxonomy order.
    const examples = found.toSorted((a, b) => b[1] - a[1]).slice(0, exampleCount).map(([word]) => word);
    return [{ name: group.name, ...(group.emoji ? { emoji: group.emoji } : {}), tunes, keywords, examples, children }, found];
  };

  return taxonomy.map((g) => summarize(g, "")[0]);
}
