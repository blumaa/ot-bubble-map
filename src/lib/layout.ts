import { hierarchy, pack } from "d3-hierarchy";
import type { BubbleNode, NodeKind } from "./tunes";

export interface LaidOutNode {
  /** Index in the flattened layout, as a string: short, so the page payload stays small. */
  id: string;
  parentId: string | null;
  kind: NodeKind;
  name: string;
  depth: number;
  x: number;
  y: number;
  r: number;
  /** Index of the top-level group this node belongs to, in taxonomy order; -1 for root. */
  category: number;
  /** Groups only: distinct tunes underneath. */
  tunes?: number;
  /** Groups only: recordings of those distinct tunes. */
  recordings?: number;
  /** Tunes only. */
  slug?: string;
  /** Tunes only: recording count. */
  value?: number;
  /** Tunes only, when any are known: key -> recordings played in it. */
  keys?: Record<string, number>;
  /** Tunes only, when any: form words its title matches. */
  forms?: string[];
  /** Tunes only, when any: ids of other keyword bubbles the title also fits. */
  alsoIn?: string[];
}

export interface Zoom {
  k: number;
  tx: number;
  ty: number;
}

export interface Circle {
  x: number;
  y: number;
  r: number;
}

const PADDING = 3;

/** Side of the square the layout is packed into. */
export const LAYOUT_SIZE = 1000;

const round = (v: number) => Math.round(v * 100) / 100;

/** Distinct tunes among `leaves` (a tune can sit under two keywords) and their recordings. */
function groupTotals(leaves: BubbleNode[]): { tunes: number; recordings: number } {
  const bySlug = new Map(leaves.map((l) => [l.slug, l.value ?? 0]));
  return { tunes: bySlug.size, recordings: [...bySlug.values()].reduce((a, b) => a + b, 0) };
}

/** Circle-packs the tree into a size×size square and flattens it, parents before children. */
export function packLayout(tree: BubbleNode, size: number): LaidOutNode[] {
  const root = pack<BubbleNode>().size([size, size]).padding(PADDING)(
    hierarchy(tree)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)),
  );
  // Taxonomy order, not pack order (sorted by size), so a group's color doesn't move when tune counts change.
  const topLevel = tree.children ?? [];
  const all = root.descendants();
  const ids = new Map(all.map((n, i) => [n, String(i)]));
  const keywordIds = new Map(all.filter((n) => n.data.path).map((n) => [n.data.path!, ids.get(n)!]));

  return all.map((n) => {
    const top = n.ancestors().find((a) => a.depth === 1);
    const { kind, name, slug, keys, forms } = n.data;
    const alsoIn = (n.data.alsoIn ?? []).flatMap((p) => keywordIds.get(p) ?? []);
    return {
      id: ids.get(n)!,
      parentId: n.parent ? ids.get(n.parent)! : null,
      kind,
      name,
      depth: n.depth,
      x: round(n.x),
      y: round(n.y),
      r: round(n.r),
      category: top ? topLevel.indexOf(top.data) : -1,
      ...(slug ? { slug, value: n.data.value } : groupTotals(n.leaves().map((l) => l.data))),
      ...(keys && Object.keys(keys).length > 0 ? { keys } : {}),
      ...(alsoIn.length > 0 ? { alsoIn } : {}),
      ...(forms ? { forms } : {}),
    };
  });
}

export function ancestors(byId: Map<string, LaidOutNode>, id: string): LaidOutNode[] {
  const chain: LaidOutNode[] = [];
  for (let n = byId.get(id); n; n = n.parentId ? byId.get(n.parentId) : undefined) chain.unshift(n);
  return chain;
}

/** Parent id -> children, in layout order. Leaves have no entry. */
export function childrenIndex(nodes: LaidOutNode[]): Map<string, LaidOutNode[]> {
  const index = new Map<string, LaidOutNode[]>();
  for (const n of nodes) {
    if (n.parentId === null) continue;
    const siblings = index.get(n.parentId);
    if (siblings) siblings.push(n);
    else index.set(n.parentId, [n]);
  }
  return index;
}

/** `count` equal circles packed inside `parent`. */
export function packRecordings(parent: Circle, count: number): Circle[] {
  const size = 2 * parent.r;
  const packed = pack<{ value?: number }>().size([size, size]).padding(parent.r * 0.04)(
    hierarchy<{ value?: number; children?: { value: number }[] }>({
      children: Array.from({ length: count }, () => ({ value: 1 })),
    }).sum((d) => d.value ?? 0),
  );
  return (packed.children ?? []).map((c) => ({ x: parent.x - parent.r + c.x, y: parent.y - parent.r + c.y, r: c.r }));
}

/** Layout circle to screen pixels under a d3-zoom transform. */
export function toScreen(c: Circle, t: { k: number; x: number; y: number }): Circle {
  return { x: c.x * t.k + t.x, y: c.y * t.k + t.y, r: c.r * t.k };
}

export interface View {
  width: number;
  height: number;
}

/** Transform that centers circle `focus` in the view, its diameter `fill` × the view's short side. */
export function zoomTo(focus: Pick<LaidOutNode, "x" | "y" | "r">, view: View, fill = 1): Zoom {
  const k = (fill * Math.min(view.width, view.height)) / (2 * focus.r);
  return { k, tx: view.width / 2 - focus.x * k, ty: view.height / 2 - focus.y * k };
}
