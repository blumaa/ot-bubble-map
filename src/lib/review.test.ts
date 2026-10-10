import { describe, expect, it } from "vitest";
import type { Group } from "./keywords";
import { applyDecisions, reviewQueue } from "./review";
import { UNSORTED_PATH, type BubbleNode } from "./tunes";

const tune = (slug: string, name: string, filedIn: string): BubbleNode => ({ kind: "tune", name, slug, value: 1, filedIn });
const keyword = (path: string, tunes: [string, string][]): BubbleNode => ({
  kind: "keyword",
  name: path.split("/").pop()!,
  path,
  children: tunes.map(([slug, name]) => tune(slug, name, path)),
});

const root: BubbleNode = {
  kind: "root",
  name: "root",
  children: [
    {
      kind: "group",
      name: "Animals",
      children: [
        keyword("Animals/Birds/duck", [["duck-river", "Duck River"], ["ducks-millpond", "Ducks On The Millpond"]]),
        keyword("Animals/Birds/owl", [["hoot", "Hoot Owl"], ["night-bird", "Night Bird"]]),
        // A keyword's only tune, lifted out of its keyword bubble.
        tune("wild-goose", "Wild Goose", "Animals/Birds/goose"),
        { kind: "group", name: "Birds", path: "Animals/Birds", children: [tune("bird-song", "Bird Song", "Animals/Birds")] },
      ],
    },
    {
      kind: "group",
      name: "Unsorted",
      path: UNSORTED_PATH,
      children: [tune("flunky", "Flunky Butt", UNSORTED_PATH), tune("sorted-already", "Sorted Already", UNSORTED_PATH)],
    },
  ],
};

describe("reviewQueue", () => {
  it("lists unreviewed AI placements and Unsorted tunes by group or keyword path, Unsorted first", () => {
    const ai = { "wild-goose": "Animals/Birds/goose", "ducks-millpond": "Animals/Birds/duck", "night-bird": "Animals/Birds/owl", "hoot": "Animals/Birds/owl", "bird-song": "Animals/Birds" };
    const curated = { hoot: "Animals/Birds/owl", "sorted-already": UNSORTED_PATH };
    expect(reviewQueue(root, ai, curated)).toEqual([
      { path: UNSORTED_PATH, tunes: [{ slug: "flunky", title: "Flunky Butt" }] },
      { path: "Animals/Birds", tunes: [{ slug: "bird-song", title: "Bird Song" }] },
      { path: "Animals/Birds/duck", tunes: [{ slug: "ducks-millpond", title: "Ducks On The Millpond" }] },
      { path: "Animals/Birds/goose", tunes: [{ slug: "wild-goose", title: "Wild Goose" }] },
      { path: "Animals/Birds/owl", tunes: [{ slug: "night-bird", title: "Night Bird" }] },
    ]);
  });
});

const taxonomy: Group[] = [
  { name: "Animals", children: [{ name: "Birds", children: [{ word: "duck" }] }] },
  { name: "Unsorted", children: [] },
];

describe("applyDecisions", () => {
  it("records each decision in curated, sorted by slug", () => {
    const result = applyDecisions({ b: "Animals/Birds/duck" }, taxonomy, [
      { slug: "c", path: UNSORTED_PATH },
      { slug: "a", path: "Animals/Birds/duck" },
    ]);
    expect(Object.keys(result.curated)).toEqual(["a", "b", "c"]);
    expect(result.curated.c).toBe(UNSORTED_PATH);
    expect(result.taxonomy).toEqual(taxonomy);
  });

  it("adds a new keyword under an existing group as placement only, without touching the input", () => {
    const result = applyDecisions({}, taxonomy, [{ slug: "a", path: "Animals/Birds/heron" }, { slug: "b", path: "Animals/Birds/heron" }]);
    expect(result.taxonomy[0].children[0]).toEqual({ name: "Birds", children: [{ word: "duck" }, { word: "heron", match: [] }] });
    expect(taxonomy[0].children[0]).toEqual({ name: "Birds", children: [{ word: "duck" }] });
  });

  it("trims and lowercases a typed keyword word", () => {
    const result = applyDecisions({}, taxonomy, [{ slug: "a", path: " Animals/Birds/ Heron " }]);
    expect(result.curated.a).toBe("Animals/Birds/heron");
  });

  it("files a tune in a group when the path names one, spelled as the taxonomy spells it", () => {
    const result = applyDecisions({}, taxonomy, [{ slug: "a", path: " animals / birds " }, { slug: "b", path: "Unsorted" }]);
    expect(result.curated).toEqual({ a: "Animals/Birds", b: "Unsorted" });
    expect(result.taxonomy).toEqual(taxonomy);
  });

  it("throws when a path names no group, so a typo never invents a category", () => {
    expect(() => applyDecisions({}, taxonomy, [{ slug: "a", path: "Animals/Bords/heron" }])).toThrow('No group "Animals/Bords"');
    expect(() => applyDecisions({}, taxonomy, [{ slug: "a", path: "Animals/Birds/" }])).toThrow("Empty part");
  });
});
