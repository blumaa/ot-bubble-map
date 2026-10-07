import { ancestors, type Circle, type LaidOutNode, type View } from "./layout";

/** d3-zoom transform: screen = layout * k + (x, y). */
export interface ViewTransform {
  k: number;
  x: number;
  y: number;
}

/**
 * Node to focus after a click on circle `hitId` while `focusId` is focused.
 * The hit circle is the deepest one under the pointer, so we step only one level
 * below the deepest node shared by the hit path and the focus path.
 */
export function clickTarget(byId: Map<string, LaidOutNode>, hitId: string, focusId: string): string {
  const hitPath = ancestors(byId, hitId);
  const focusPath = ancestors(byId, focusId);

  let shared = 0;
  while (shared + 1 < hitPath.length && shared + 1 < focusPath.length && hitPath[shared + 1].id === focusPath[shared + 1].id) shared++;

  const hit = hitPath[hitPath.length - 1];
  if (hit.id === focusId) return hit.parentId ?? hit.id;
  if (shared === hitPath.length - 1) return hit.id;
  return hitPath[shared + 1].id;
}

/** Deepest node under the view center whose on-screen diameter covers most of the view. */
export function viewFocus(nodes: LaidOutNode[], t: ViewTransform, view: View): string {
  const cx = (view.width / 2 - t.x) / t.k;
  const cy = (view.height / 2 - t.y) / t.k;
  const short = Math.min(view.width, view.height);
  let best = nodes[0];
  for (const n of nodes) {
    if (n.depth <= best.depth) continue;
    if ((n.x - cx) ** 2 + (n.y - cy) ** 2 > n.r ** 2) continue;
    if (2 * n.r * t.k >= short * 0.8) best = n;
  }
  return best.id;
}

const KIND_ORDER = { root: 0, group: 1, keyword: 2, tune: 3 } as const;

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Nodes whose name contains every query word; groups first, then names starting with the query. Tunes once each. */
export function searchNodes(nodes: LaidOutNode[], query: string, limit: number): LaidOutNode[] {
  const q = normalize(query);
  if (!q) return [];
  const words = q.split(" ");
  const seen = new Set<string>();
  const hits: LaidOutNode[] = [];
  for (const n of nodes) {
    if (n.kind === "root") continue;
    const name = normalize(n.name);
    if (!words.every((w) => name.includes(w))) continue;
    if (n.slug) {
      if (seen.has(n.slug)) continue;
      seen.add(n.slug);
    }
    hits.push(n);
  }
  const rank = (n: LaidOutNode) => KIND_ORDER[n.kind] * 2 + (normalize(n.name).startsWith(q) ? 0 : 1);
  return hits.toSorted((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name)).slice(0, limit);
}

const GAP = 8;

/** Top-left for a popover of `size` next to on-screen circle `c`: above if it fits, else below; kept inside the view. */
export function popoverPlacement(c: Circle, size: { width: number; height: number }, view: View): { left: number; top: number } {
  const left = Math.min(Math.max(GAP, c.x - size.width / 2), view.width - size.width - GAP);
  const above = c.y - c.r - GAP - size.height;
  const below = c.y + c.r + GAP;
  const top = above >= GAP ? above : Math.min(below, view.height - size.height - GAP);
  return { left, top };
}
