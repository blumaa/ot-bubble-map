import type { LaidOutNode } from "./layout";

/** Nodes grouped by floor(log2(radius)), largest bucket first, layout order kept inside each bucket. */
export function sizeBuckets(nodes: LaidOutNode[]): [number, LaidOutNode[]][] {
  const buckets = new Map<number, LaidOutNode[]>();
  for (const n of nodes) {
    const b = Math.floor(Math.log2(n.r));
    const members = buckets.get(b);
    if (members) members.push(n);
    else buckets.set(b, [n]);
  }
  // A child is never larger than its parent, and layout order is parents first, so parents still paint first.
  return [...buckets].toSorted(([a], [b]) => b - a);
}

/** Whether bucket `b` is worth drawing at zoom `k`: its largest circles reach `minPx` on screen. */
export function bucketShown(b: number, k: number, minPx: number): boolean {
  return 2 ** (b + 1) * k >= minPx;
}
