import { describe, expect, it } from "vitest";
import {
  dropReason,
  titleAliases,
  normalizeTitle,
  applyMerges,
  findDuplicateCandidates,
  cleanRecordings,
} from "./clean";
import type { Recording } from "./types";

const rec = (tune: string, tuneSlug: string, url = `https://s/content/${tuneSlug}`): Recording => ({
  url,
  tune,
  tuneSlug,
  artist: null,
  playedBy: null,
  key: null,
  tuning: null,
  year: null,
  mediaSource: null,
  collections: [],
  audio: null,
});

describe("dropReason", () => {
  it("flags unidentified placeholder titles", () => {
    expect(dropReason("2005 Ellis Hall 01")).toBe("placeholder");
    expect(dropReason("2005 Bob Rogers")).toBe("placeholder");
    expect(dropReason("2008 Roscoe Parish 03-27 Waltz")).toBe("placeholder");
  });

  it("flags announcer tracks", () => {
    expect(dropReason("Announcer")).toBe("non-tune");
    expect(dropReason("Announcer - Uncommonly Good Pickin' Tonight")).toBe("non-tune");
  });

  it("keeps real tunes, including ones with numbers", () => {
    expect(dropReason("Ducks On The Millpond")).toBeNull();
    expect(dropReason("1812 March")).toBeNull();
    expect(dropReason("1930 Drought")).toBeNull();
    expect(dropReason("Forked Deer 2")).toBeNull();
  });

  it("flags unidentified tunes", () => {
    expect(dropReason("Unknown")).toBe("unidentified");
    expect(dropReason("Unknown Bill Driver Tune in A #1")).toBe("unidentified");
    expect(dropReason("Untitled Reel In A")).toBe("unidentified");
    expect(dropReason("Unidentified Tune")).toBe("unidentified");
  });
});

describe("titleAliases", () => {
  it("splits aka titles", () => {
    expect(titleAliases("Bonaparte's Reel aka Napoleon's Reel")).toEqual(["Bonaparte's Reel", "Napoleon's Reel"]);
  });

  it("handles parenthesized and dotted aka", () => {
    expect(titleAliases("Sail Away Ladies (a.k.a. Sally Ann)")).toEqual(["Sail Away Ladies", "Sally Ann"]);
    expect(titleAliases("Sugar Hill (AKA Sugar in the Gourd) aka Hogs in the Tater Patch")).toEqual([
      "Sugar Hill",
      "Sugar in the Gourd",
      "Hogs in the Tater Patch",
    ]);
  });

  it("returns the title alone when no aka", () => {
    expect(titleAliases("Duck River")).toEqual(["Duck River"]);
  });
});

describe("normalizeTitle", () => {
  it("ignores case, punctuation, spacing and filler words", () => {
    expect(normalizeTitle("Ducks On The Millpond")).toBe(normalizeTitle("Ducks on the Mill-Pond"));
    expect(normalizeTitle("Ducks On The Millpond")).toBe(normalizeTitle("Duck's On Mill Pond"));
    expect(normalizeTitle("Bonaparte's Retreat")).toBe("bonapartesretreat");
  });

  it("keeps different tunes different", () => {
    expect(normalizeTitle("Duck River")).not.toBe(normalizeTitle("Ducks On The Millpond"));
  });
});

describe("applyMerges", () => {
  it("rewrites merged slugs to the canonical tune", () => {
    const out = applyMerges(
      [rec("Ducks On The Mill Pond", "ducks-mill-pond"), rec("Ducks On The Millpond", "ducks-millpond")],
      { "ducks-mill-pond": "ducks-millpond" },
    );
    expect(out.map((r) => [r.tune, r.tuneSlug])).toEqual([
      ["Ducks On The Millpond", "ducks-millpond"],
      ["Ducks On The Millpond", "ducks-millpond"],
    ]);
  });

  it("throws when a merge target does not exist", () => {
    expect(() => applyMerges([rec("A", "a")], { a: "missing" })).toThrow('merge target "missing"');
  });
});

describe("findDuplicateCandidates", () => {
  it("groups distinct tunes whose titles or aliases normalize the same", () => {
    const out = findDuplicateCandidates([
      rec("Ducks On The Millpond", "ducks-millpond"),
      rec("Ducks On The Millpond", "ducks-millpond", "https://s/content/ducks-millpond-0"),
      rec("Ducks on the Mill Pond", "ducks-mill-pond"),
      rec("Bonaparte's Reel aka Napoleon's Reel", "bonapartes-reel-aka-napoleons-reel"),
      rec("Napoleon's Reel", "napoleons-reel"),
      rec("Duck River", "duck-river"),
    ]);
    expect(out).toEqual([
      {
        key: "ducksmillpond",
        tunes: [
          { slug: "ducks-mill-pond", name: "Ducks on the Mill Pond", recordings: 1 },
          { slug: "ducks-millpond", name: "Ducks On The Millpond", recordings: 2 },
        ],
      },
      {
        key: "napoleonsreel",
        tunes: [
          { slug: "bonapartes-reel-aka-napoleons-reel", name: "Bonaparte's Reel aka Napoleon's Reel", recordings: 1 },
          { slug: "napoleons-reel", name: "Napoleon's Reel", recordings: 1 },
        ],
      },
    ]);
  });
});

describe("cleanRecordings", () => {
  it("drops non-tunes, applies merges, and reports what was dropped", () => {
    const { kept, dropped } = cleanRecordings(
      [
        rec("Duck River", "duck-river"),
        rec("2005 Ellis Hall 01", "2005-ellis-hall-01"),
        rec("Announcer", "announcer"),
        rec("Duck River ", "duck-river-x"),
      ],
      { "duck-river-x": "duck-river" },
    );
    expect(kept.map((r) => r.tuneSlug)).toEqual(["duck-river", "duck-river"]);
    expect(dropped).toEqual([
      { reason: "placeholder", tune: "2005 Ellis Hall 01", url: "https://s/content/2005-ellis-hall-01" },
      { reason: "non-tune", tune: "Announcer", url: "https://s/content/announcer" },
    ]);
  });
});
