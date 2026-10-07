import { packLayout, type LaidOutNode } from "../layout";
import type { BubbleNode } from "../tunes";

const tune = (name: string, slug: string, value: number, keys: Record<string, number> = {}, alsoIn?: string[], forms?: string[]): BubbleNode => ({
  kind: "tune",
  name,
  slug,
  value,
  keys,
  ...(alsoIn ? { alsoIn } : {}),
  ...(forms ? { forms } : {}),
});

/**
 * Small map: two groups, Duck River appears under two keywords. Keys: A has 2 tunes, D and G 1 each; Duck River has
 * 2 recordings in A, 1 in D. Goose Hangs High is also under duck and under a keyword that has no bubble.
 * Forms: Duck River is a reel, Goose Hangs High a reel and a waltz.
 */
export const tree: BubbleNode = {
  kind: "root",
  name: "root",
  children: [
    {
      kind: "group",
      name: "Animals",
      children: [
        { kind: "keyword", name: "duck", path: "Animals/duck", children: [tune("Duck River", "duck-river", 2, { A: 2, D: 1 }, undefined, ["reel"]), tune("Ducks On The Millpond", "ducks", 1, { G: 1 })] },
        { kind: "keyword", name: "goose", path: "Animals/goose", children: [tune("Goose Hangs High", "goose", 1, { A: 1 }, ["Animals/duck", "Words/high"], ["reel", "waltz"])] },
      ],
    },
    {
      kind: "group",
      name: "Places",
      children: [{ kind: "keyword", name: "river", path: "Places/river", children: [tune("Duck River", "duck-river", 2, { A: 2, D: 1 }, undefined, ["reel"])] }],
    },
  ],
};

export const nodes = packLayout(tree, 1000);
export const byId = new Map(nodes.map((n) => [n.id, n]));

/** Node at a name path below the root, e.g. "Animals/duck/Duck River". */
export function at(path: string): LaidOutNode {
  let node = nodes[0];
  for (const name of path.split("/")) node = nodes.find((n) => n.parentId === node.id && n.name === name)!;
  return node;
}
