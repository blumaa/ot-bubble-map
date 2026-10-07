import { describe, expect, it } from "vitest";
import { nodes } from "./__fixtures__/tree";
import { bucketShown, sizeBuckets } from "./lod";

describe("sizeBuckets", () => {
  it("groups nodes by power-of-two radius, largest bucket first", () => {
    const buckets = sizeBuckets(nodes);
    expect(buckets.map(([b]) => b)).toEqual(buckets.map(([b]) => b).toSorted((a, b) => b - a));
    for (const [b, members] of buckets) for (const n of members) expect(n.r >= 2 ** b && n.r < 2 ** (b + 1)).toBe(true);
    expect(buckets.flatMap(([, members]) => members)).toHaveLength(nodes.length);
  });

  it("keeps every parent before its children, so paint order is unchanged", () => {
    const order = new Map(sizeBuckets(nodes).flatMap(([, members]) => members).map((n, i) => [n.id, i]));
    for (const n of nodes) if (n.parentId !== null) expect(order.get(n.parentId)!).toBeLessThan(order.get(n.id)!);
  });
});

describe("bucketShown", () => {
  it("shows a bucket while its largest circles reach the minimum on-screen radius", () => {
    // Bucket 2 holds radii 4 to <8 layout units.
    expect(bucketShown(2, 0.125, 1)).toBe(true);
    expect(bucketShown(2, 0.1, 1)).toBe(false);
  });
});
