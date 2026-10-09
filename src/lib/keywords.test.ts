import { describe, expect, it } from "vitest";
import { taxonomyEntries, matchTerms, titleMatches, titleWords, tokenize, type Group } from "./keywords";

describe("tokenize", () => {
  it("lowercases, strips punctuation and possessives", () => {
    expect(tokenize("Sally Ann's Chicken-Pie, Blues!")).toEqual(["sally", "ann", "chicken", "pie", "blues"]);
  });

  it("keeps apostrophe contractions as one word", () => {
    expect(tokenize("Don't Let Your Deal Go Down")).toEqual(["don't", "let", "your", "deal", "go", "down"]);
  });

  it("normalizes curly apostrophes", () => {
    expect(tokenize("Jenny’s Gone")).toEqual(["jenny", "gone"]);
  });
});

describe("matchTerms", () => {
  it("defaults to the word and its plural", () => {
    expect(matchTerms({ word: "duck" })).toEqual(["duck", "ducks"]);
  });

  it("uses explicit match list when given", () => {
    expect(matchTerms({ word: "goose", match: ["goose", "geese"] })).toEqual(["goose", "geese"]);
  });

  it("matches nothing for a group without a match list: a group matches only by explicit terms", () => {
    expect(matchTerms({ name: "Birds", children: [] })).toEqual([]);
    expect(matchTerms({ name: "Birds", match: ["bird", "birds"], children: [] })).toEqual(["bird", "birds"]);
    expect(titleMatches("Bird Song", { name: "Birds", match: ["bird"], children: [] })).toBe(true);
  });

  it("matches nothing with an empty match list, for keywords only curation fills", () => {
    expect(titleMatches("Other Duck", { word: "other", match: [] })).toBe(false);
  });
});

describe("taxonomyEntries", () => {
  const taxonomy: Group[] = [
    { name: "Animals", children: [{ name: "Birds", children: [{ word: "duck" }] }, { word: "dog" }] },
    {
      name: "Words",
      kind: "modifier",
      children: [{ name: "Colors", children: [{ word: "blue" }] }, { name: "Phrases", kind: "function", children: [{ word: "i" }] }],
    },
    { name: "Feelings", children: [{ word: "love" }, { word: "lonesome", kind: "modifier" }] },
  ];

  it("lists every group and keyword with its path and inherited kind, children before their group, noun by default", () => {
    expect(taxonomyEntries(taxonomy).map((e) => [e.path, e.kind])).toEqual([
      ["Animals/Birds/duck", "noun"],
      ["Animals/Birds", "noun"],
      ["Animals/dog", "noun"],
      ["Animals", "noun"],
      ["Words/Colors/blue", "modifier"],
      ["Words/Colors", "modifier"],
      ["Words/Phrases/i", "function"],
      ["Words/Phrases", "function"],
      ["Words", "modifier"],
      ["Feelings/love", "noun"],
      ["Feelings/lonesome", "modifier"],
      ["Feelings", "noun"],
    ]);
  });

  it("keeps the taxonomy node itself", () => {
    expect(taxonomyEntries(taxonomy)[0].node).toEqual({ word: "duck" });
    expect(taxonomyEntries(taxonomy)[1].node).toBe(taxonomy[0].children[0]);
  });
});

describe("titleMatches", () => {
  const duck = { word: "duck" };

  it("matches whole words only", () => {
    expect(titleMatches("Ducks On The Millpond", duck)).toBe(true);
    expect(titleMatches("Duck River", duck)).toBe(true);
    expect(titleMatches("Farewell Ducktown", duck)).toBe(false);
  });

  it("matches multi-word keywords as a phrase", () => {
    const sal = { word: "sally ann" };
    expect(titleMatches("Sally Ann Johnson", sal)).toBe(true);
    expect(titleMatches("Sally Goodin", sal)).toBe(false);
  });

  it("matches any aka name but never a phrase spanning two names", () => {
    expect(titleMatches("Bonaparte's Reel aka Napoleon's Reel", { word: "napoleon" })).toBe(true);
    expect(titleMatches("Bonaparte's Reel aka Napoleon's Reel", { word: "reel napoleon" })).toBe(false);
    expect(titleMatches("Bonaparte's Reel aka Napoleon's Reel", { word: "aka" })).toBe(false);
  });

  it("skips a title containing an excluded phrase, so one sense of a word does not catch another", () => {
    const bow = { word: "bow", exclude: ["bow wow", "bow legged"] };
    expect(titleMatches("Fiddle And Bow", bow)).toBe(true);
    expect(titleMatches("Bow Wow Blues", bow)).toBe(false);
    expect(titleMatches("Bow-legged Irishman", bow)).toBe(false);
  });

  it("checks exclusions per aka name", () => {
    const gate = { word: "gate", exclude: ["pearly gates"] };
    expect(titleMatches("Pearly Gates aka Garden Gate", gate)).toBe(true);
    expect(titleMatches("Pearly Gates", gate)).toBe(false);
  });
});

describe("titleWords", () => {
  it("is each aka name as space-padded words, ready for phrase lookup", () => {
    expect(titleWords("Bonaparte's Reel aka Napoleon's Reel")).toEqual([" bonaparte reel ", " napoleon reel "]);
  });
});
