import { describe, expect, it } from "vitest";
import type { Group } from "./keywords";
import { buildHierarchy, groupTunes, recordingDetails, recordingLabel, tuneUrl, type BubbleNode } from "./tunes";
import type { Recording } from "./types";

const rec = (tune: string, tuneSlug: string, url: string, artist = "A"): Recording => ({
  url,
  tune,
  tuneSlug,
  artist,
  playedBy: null,
  key: null,
  tuning: null,
  year: null,
  mediaSource: null,
  collections: [],
  audio: null,
});

const recordings = [
  rec("Duck River", "duck-river", "https://s/content/duck-river", "John Hatcher"),
  rec("Duck River", "duck-river", "https://s/content/duck-river-0", "Fiddlin' Arthur Smith"),
  rec("Ducks On The Millpond", "ducks-millpond", "https://s/content/ducks-millpond"),
  rec("Sally Goodin", "sally-goodin", "https://s/content/sally-goodin"),
  rec("'Neath The Palms", "neath-palms", "https://s/content/neath-palms"),
  rec("12 Year", "12-year", "https://s/content/12-year"),
  rec("Billy In The Lowground", "billy", "https://s/content/billy"),
];

describe("groupTunes", () => {
  it("groups recordings by tune slug, sorted by name", () => {
    const tunes = groupTunes(recordings);
    expect(tunes.map((t) => [t.name, t.recordings.length])).toEqual([
      ["'Neath The Palms", 1],
      ["12 Year", 1],
      ["Billy In The Lowground", 1],
      ["Duck River", 2],
      ["Ducks On The Millpond", 1],
      ["Sally Goodin", 1],
    ]);
  });
});

describe("buildHierarchy", () => {
  const taxonomy: Group[] = [
    {
      name: "Animals",
      emoji: "🐾",
      children: [
        { name: "Birds", children: [{ word: "duck" }, { word: "goose", match: ["goose", "geese"] }] },
        { name: "Dogs", children: [{ word: "dog" }] },
      ],
    },
    { name: "People", children: [{ word: "sally" }, { word: "billy" }] },
    { name: "Places", children: [{ word: "texas" }] },
    {
      name: "Words",
      kind: "modifier",
      children: [
        { name: "Time", children: [{ word: "year" }, { word: "day" }] },
        { name: "Phrases", kind: "function", children: [{ word: "the" }] },
      ],
    },
  ];
  const tunes = groupTunes([...recordings, rec("Wild Goose Chase", "wild-goose", "https://s/content/wild-goose")]);
  const root = buildHierarchy(tunes, taxonomy);
  const tree = (n: BubbleNode): unknown => (n.slug ? n.name : [n.name, n.kind, n.children!.map(tree)]);

  it("nests groups > keywords > tunes in document order, dropping empty keywords and groups", () => {
    expect(root).toMatchObject({ name: "Old-Time Tunes", kind: "root" });
    expect(tree(root.children![0])).toEqual([
      "Animals",
      "group",
      [["Birds", "group", [["duck", "keyword", ["Duck River", "Ducks On The Millpond"]], ["goose", "keyword", ["Wild Goose Chase"]]]]],
    ]);
    expect(root.children!.map((c) => c.name)).toEqual(["Animals", "People", "Words"]);
  });

  it("replaces a group below the top level that has one child with that child", () => {
    expect(tree(root.children![2])).toEqual([
      "Words",
      "group",
      [
        ["year", "keyword", ["12 Year"]],
        ["the", "keyword", ["'Neath The Palms"]],
      ],
    ]);
  });

  it("leaves emoji off the map", () => {
    expect(root.children![0]).not.toHaveProperty("emoji");
  });

  it("makes tunes leaves with their slug, value = recording count, and keys", () => {
    const duckRiver = root.children![0].children![0].children![0].children![0];
    expect(duckRiver).toEqual({ kind: "tune", name: "Duck River", slug: "duck-river", value: 2, keys: {} });
  });

  it("counts each tune's recordings per key, a multi-key recording counting toward each", () => {
    const keyed = [
      { ...rec("Duck River", "duck-river", "https://s/1"), key: "G & D" },
      { ...rec("Duck River", "duck-river", "https://s/2"), key: "D" },
      rec("Duck River", "duck-river", "https://s/3"),
    ];
    const tune = buildHierarchy(groupTunes(keyed), [{ name: "Animals", children: [{ word: "duck" }] }]).children![0].children![0].children![0];
    expect(tune.keys).toEqual({ D: 2, G: 1 });
  });

  it("places every tune on the map exactly once", () => {
    const placed: string[] = [];
    const walk = (n: BubbleNode) => (n.slug ? placed.push(n.slug) : n.children?.forEach(walk));
    walk(root);
    expect(placed.toSorted()).toEqual(tunes.map((t) => t.slug).toSorted());
  });

  it("files a tune under its strongest kind of matching keyword, then the first in document order", () => {
    const filed = buildHierarchy(
      groupTunes([rec("Big Eyed Rabbit", "big-eyed-rabbit", "https://s/1"), rec("The Duck And Goose", "duck-goose", "https://s/2")]),
      [
        { name: "Words", kind: "modifier", children: [{ word: "big" }, { word: "the", kind: "function" }] },
        { name: "Animals", children: [{ word: "goose" }, { word: "rabbit" }, { word: "duck" }] },
      ],
    );
    expect(tree(filed)).toEqual([
      "Old-Time Tunes",
      "root",
      [["Animals", "group", [["goose", "keyword", ["The Duck And Goose"]], ["rabbit", "keyword", ["Big Eyed Rabbit"]]]]],
    ]);
  });

  it("lists up to three other matching keywords as alsoIn, skipping the filed one and function words", () => {
    const filed = buildHierarchy(
      groupTunes([rec("The Duck And Goose Dog Rabbit Day", "lots", "https://s/1"), rec("Lone Duck", "lone", "https://s/2")]),
      [
        { name: "Words", kind: "modifier", children: [{ word: "day" }, { word: "the", kind: "function" }] },
        { name: "Animals", children: [{ word: "goose" }, { word: "rabbit" }, { word: "duck" }, { word: "dog" }] },
      ],
    );
    const leaves: BubbleNode[] = [];
    const walk = (n: BubbleNode) => (n.slug ? leaves.push(n) : n.children?.forEach(walk));
    walk(filed);
    expect(leaves.find((t) => t.slug === "lots")!.alsoIn).toEqual(["Animals/rabbit", "Animals/duck", "Animals/dog"]);
    expect(leaves.find((t) => t.slug === "lone")).not.toHaveProperty("alsoIn");
  });

  it("lists the form keywords a title matches as forms, filed one included, in taxonomy order", () => {
    const filed = buildHierarchy(
      groupTunes([rec("Duck Reel", "duck-reel", "https://s/1"), rec("Waltz Reel", "waltz-reel", "https://s/2"), rec("Lone Duck", "lone", "https://s/3")]),
      [
        { name: "Animals", children: [{ word: "duck" }] },
        { name: "Music", kind: "form", children: [{ word: "waltz" }, { word: "reel" }] },
      ],
    );
    const leaves: BubbleNode[] = [];
    const walk = (n: BubbleNode) => (n.slug ? leaves.push(n) : n.children?.forEach(walk));
    walk(filed);
    expect(leaves.find((t) => t.slug === "duck-reel")!.forms).toEqual(["reel"]);
    expect(leaves.find((t) => t.slug === "waltz-reel")!.forms).toEqual(["waltz", "reel"]);
    expect(leaves.find((t) => t.slug === "lone")).not.toHaveProperty("forms");
  });

  it("tags keywords with their taxonomy path, so alsoIn can find them", () => {
    expect(root.children![0].children![0].children![0]).toMatchObject({ kind: "keyword", name: "duck", path: "Animals/Birds/duck" });
  });

  it("refuses to leave a tune off the map, naming the tunes no keyword matches", () => {
    expect(() => buildHierarchy(groupTunes([rec("Smoky Mokes", "smoky-mokes", "https://s/1")]), taxonomy)).toThrow(/smoky-mokes/);
  });
});

describe("buildHierarchy curated placements", () => {
  const tunes = groupTunes([rec("Sally Goodin", "sally-goodin", "https://s/1"), rec("Chadwick", "chadwick", "https://s/2")]);
  const taxonomy: Group[] = [{ name: "People", children: [{ word: "sally" }, { name: "Surnames", children: [{ word: "smith" }, { word: "other", match: [] }] }] }];

  it("files curated tunes under their keyword path, overriding keyword matches", () => {
    const root = buildHierarchy(tunes, taxonomy, { chadwick: "People/Surnames/other", "sally-goodin": "People/Surnames/other" });
    expect(root.children![0].children!.map((k) => [k.name, k.children!.map((t) => t.name)])).toEqual([["other", ["Chadwick", "Sally Goodin"]]]);
  });

  it("rejects a curated path that names no keyword", () => {
    expect(() => buildHierarchy(tunes, taxonomy, { chadwick: "People/surnames" })).toThrow(/People\/surnames/);
  });
});

describe("tuneUrl", () => {
  it("links the Slippery-Hill page listing every recording of the tune", () => {
    expect(tuneUrl("duck-river")).toBe("https://www.slippery-hill.com/taxonomy/tune-title/duck-river");
  });
});

describe("recordingLabel", () => {
  const base = recordings[0];
  it("prefers the artist, then who played it, then the source", () => {
    expect(recordingLabel({ ...base, artist: "John Hatcher" })).toBe("John Hatcher");
    expect(recordingLabel({ ...base, artist: null, playedBy: "The Band" })).toBe("The Band");
    expect(recordingLabel({ ...base, artist: null, mediaSource: "Columbia 78" })).toBe("Columbia 78");
    expect(recordingLabel({ ...base, artist: null })).toBe("Unknown");
  });

  it("adds the year when known", () => {
    expect(recordingLabel({ ...base, artist: "John Hatcher", year: 1928 })).toBe("John Hatcher (1928)");
  });
});

describe("recordingDetails", () => {
  const base = recordings[0];
  it("lists only the known facts, in display order", () => {
    expect(recordingDetails({ ...base, playedBy: "Fiddle", key: "A", tuning: "AEAE", year: 1937, collections: ["LOC", "Field"] })).toEqual([
      ["Played by", "Fiddle"],
      ["Key", "A"],
      ["Tuning", "AEAE"],
      ["Year", "1937"],
      ["Collections", "LOC, Field"],
    ]);
  });

  it("is empty when nothing is known", () => {
    expect(recordingDetails({ ...base, collections: [] })).toEqual([]);
  });
});
