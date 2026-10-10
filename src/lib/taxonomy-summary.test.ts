import { describe, expect, it } from "vitest";
import type { Group } from "./keywords";
import { groupSummaries, placementCounts, tunePaths } from "./taxonomy-summary";
import { UNSORTED_PATH, type BubbleNode } from "./tunes";

const tune = (slug: string, filedIn: string): BubbleNode => ({ kind: "tune", name: slug, slug, value: 1, filedIn });

const root: BubbleNode = {
  kind: "root",
  name: "root",
  children: [
    {
      kind: "group",
      name: "Animals",
      path: "Animals",
      children: [
        {
          kind: "group",
          name: "Birds",
          path: "Animals/Birds",
          children: [
            { kind: "keyword", name: "owl", path: "Animals/Birds/owl", children: [tune("hoot", "Animals/Birds/owl"), tune("owl-song", "Animals/Birds/owl")] },
            // A keyword's only tune is lifted into the group above, so its bubble is not where it is filed.
            tune("duck-river", "Animals/Birds/duck"),
            tune("bird-song", "Animals/Birds"),
          ],
        },
        // Lifted twice: out of its keyword, then out of the group left holding only it.
        tune("old-dog", "Animals/Dogs/dog"),
      ],
    },
    { kind: "group", name: "Unsorted", path: UNSORTED_PATH, children: [tune("flunky", UNSORTED_PATH), tune("kept", UNSORTED_PATH)] },
  ],
};

const taxonomy: Group[] = [
  {
    name: "Animals",
    emoji: "🐾",
    children: [
      { name: "Birds", match: ["bird"], children: [{ word: "duck" }, { word: "owl" }, { word: "heron", match: [] }] },
      { name: "Dogs", children: [{ word: "dog" }] },
    ],
  },
  { name: "Unsorted", children: [] },
];

describe("tunePaths", () => {
  it("maps each tune to the path of the group or keyword it is filed in", () => {
    expect(Object.fromEntries(tunePaths(root))).toEqual({
      hoot: "Animals/Birds/owl",
      "owl-song": "Animals/Birds/owl",
      "duck-river": "Animals/Birds/duck",
      "bird-song": "Animals/Birds",
      "old-dog": "Animals/Dogs/dog",
      flunky: UNSORTED_PATH,
      kept: UNSORTED_PATH,
    });
  });
});

describe("placementCounts", () => {
  it("counts who placed each tune: a person over AI over the title matcher, and what is still unsorted", () => {
    const ai = { hoot: "Animals/Birds/owl", "old-dog": "Animals/Dogs/dog" };
    const curated = { "old-dog": "Animals/Dogs/dog", kept: UNSORTED_PATH };
    expect(placementCounts(tunePaths(root), ai, curated)).toEqual({ total: 7, person: 2, ai: 1, matcher: 3, unsorted: 1 });
  });
});

describe("groupSummaries", () => {
  it("summarizes each group with its tune count, keyword count and busiest keywords, subgroups nested", () => {
    expect(groupSummaries(taxonomy, tunePaths(root), 1)).toEqual([
      {
        name: "Animals",
        emoji: "🐾",
        tunes: 5,
        keywords: 4,
        examples: ["owl"],
        children: [
          { name: "Birds", tunes: 4, keywords: 3, examples: ["owl"], children: [] },
          { name: "Dogs", tunes: 1, keywords: 1, examples: ["dog"], children: [] },
        ],
      },
      { name: "Unsorted", tunes: 2, keywords: 0, examples: [], children: [] },
    ]);
  });

  it("breaks ties between keywords in taxonomy order and leaves out keywords with no tunes", () => {
    const [animals] = groupSummaries(taxonomy, new Map([["a", "Animals/Birds/owl"], ["b", "Animals/Birds/duck"]]), 5);
    expect(animals.children[0].examples).toEqual(["duck", "owl"]);
  });
});
