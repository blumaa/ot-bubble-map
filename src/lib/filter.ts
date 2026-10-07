import type { LaidOutNode } from "./layout";

/** What the key panel narrows the map to; null means any. */
export interface Filter {
  key: string | null;
  form: string | null;
}

export const NO_FILTER: Filter = { key: null, form: null };

export interface FacetOption {
  value: string;
  tunes: number;
}

/** Every value of a tune facet with its distinct tune count, most tunes first, then by name. */
function facetOptions(nodes: LaidOutNode[], valuesOf: (tune: LaidOutNode) => string[]): FacetOption[] {
  const slugsByValue = new Map<string, Set<string>>();
  for (const n of nodes) {
    if (!n.slug) continue;
    for (const value of valuesOf(n)) slugsByValue.set(value, (slugsByValue.get(value) ?? new Set()).add(n.slug));
  }
  return [...slugsByValue]
    .map(([value, slugs]) => ({ value, tunes: slugs.size }))
    .toSorted((a, b) => b.tunes - a.tunes || a.value.localeCompare(b.value));
}

export const keyOptions = (nodes: LaidOutNode[]) => facetOptions(nodes, (t) => Object.keys(t.keys ?? {}));

export const formOptions = (nodes: LaidOutNode[]) => facetOptions(nodes, (t) => t.forms ?? []);

/** Recordings of `tune` that pass the filter: those in the key if one is chosen, else all; 0 if its form is wrong. */
function tuneCount(tune: LaidOutNode, { key, form }: Filter): number {
  if (form && !tune.forms?.includes(form)) return 0;
  return key ? (tune.keys?.[key] ?? 0) : (tune.value ?? 0);
}

/**
 * Node id -> count under the filter: distinct tunes under a group, recordings of a tune. Nodes with no match are
 * absent. Null when nothing is chosen.
 */
export function filterMatches(nodes: LaidOutNode[], filter: Filter): Map<string, number> | null {
  if (!filter.key && !filter.form) return null;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const slugs = new Map<string, Set<string>>();
  const counts = new Map<string, number>();
  for (const tune of nodes) {
    if (!tune.slug) continue;
    const recordings = tuneCount(tune, filter);
    if (!recordings) continue;
    counts.set(tune.id, recordings);
    for (let n = tune.parentId ? byId.get(tune.parentId) : undefined; n; n = n.parentId ? byId.get(n.parentId) : undefined) {
      slugs.set(n.id, (slugs.get(n.id) ?? new Set()).add(tune.slug));
    }
  }
  for (const [id, s] of slugs) counts.set(id, s.size);
  return counts;
}
