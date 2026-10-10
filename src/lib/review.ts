import { isKeyword, type Group } from "./keywords";
import type { Placements } from "./placements";
import { UNSORTED_PATH, type BubbleNode } from "./tunes";

export interface QueueTune {
  slug: string;
  title: string;
}

/** Tunes waiting for review under one group or keyword path. */
export interface QueueGroup {
  path: string;
  tunes: QueueTune[];
}

/** A person's choice: file this tune under this group or keyword path. */
export interface Decision {
  slug: string;
  path: string;
}

/**
 * Tunes a person has not reviewed yet: AI placements and Unsorted tunes not in curated, grouped by the group or keyword
 * path each is filed in (a lifted tune shows in a bubble above it). Unsorted first, then by path.
 */
export function reviewQueue(root: BubbleNode, ai: Placements, curated: Placements): QueueGroup[] {
  const byPath = new Map<string, QueueTune[]>();
  const walk = (node: BubbleNode) => {
    for (const child of node.children ?? []) {
      if (child.kind !== "tune") {
        walk(child);
        continue;
      }
      const { slug, name, filedIn } = child as Required<BubbleNode>;
      if (slug in curated || (filedIn !== UNSORTED_PATH && ai[slug] !== filedIn)) continue;
      byPath.set(filedIn, [...(byPath.get(filedIn) ?? []), { slug, title: name }]);
    }
  };
  walk(root);
  return [...byPath]
    .map(([path, tunes]) => ({ path, tunes }))
    .toSorted((a, b) => Number(b.path === UNSORTED_PATH) - Number(a.path === UNSORTED_PATH) || a.path.localeCompare(b.path));
}

/**
 * The canonical form of a typed path: each group part spelled as the taxonomy spells it (matched ignoring case and
 * spaces around "/"). If the path ends in a part that names no group under the last one, that part is a keyword word,
 * lowercased, and is added as a placement-only keyword when missing. Throws if a group part names no group, so a typo
 * never invents a category.
 */
function resolvePath(taxonomy: Group[], typed: string): string {
  const parts = typed.split("/").map((p) => p.trim());
  if (parts.some((p) => !p)) throw new Error(`Empty part in path "${typed}"`);
  const names: string[] = [];
  let children: Group["children"] = taxonomy;
  for (const [i, part] of parts.entries()) {
    const group = children.find((c): c is Group => !isKeyword(c) && c.name.toLowerCase() === part.toLowerCase());
    if (group) {
      names.push(group.name);
      children = group.children;
      continue;
    }
    if (i < parts.length - 1 || names.length === 0) throw new Error(`No group "${[...names, part].join("/")}" in path "${typed}"`);
    const word = part.toLowerCase();
    if (!children.some((c) => isKeyword(c) && c.word === word)) children.push({ word, match: [] });
    names.push(word);
  }
  return names.join("/");
}

/**
 * Curated placements and taxonomy after a person's decisions. A path may name a group or a keyword. One naming a new
 * keyword under an existing group adds that keyword as placement only (`match: []`), so no other title files there by
 * itself. Inputs are not changed.
 */
export function applyDecisions(curated: Placements, taxonomy: Group[], decisions: Decision[]): { curated: Placements; taxonomy: Group[] } {
  const nextTaxonomy = structuredClone(taxonomy);
  const next = { ...curated };
  for (const { slug, path } of decisions) {
    next[slug] = resolvePath(nextTaxonomy, path);
  }
  const sorted = Object.fromEntries(Object.entries(next).toSorted(([a], [b]) => a.localeCompare(b)));
  return { curated: sorted, taxonomy: nextTaxonomy };
}
