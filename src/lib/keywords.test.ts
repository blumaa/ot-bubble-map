import { describe, expect, it } from "vitest";
import { keywordEntries, matchTerms, titleMatches, titleWords, tokenize, type Group } from "./keywords";

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

  it("matches nothing with an empty match list, for keywords only curation fills", () => {
    expect(titleMatches("Other Duck", { word: "other", match: [] })).toBe(false);
  });
});

describe("keywordEntries", () => {
  const taxonomy: Group[] = [
    { name: "Animals", children: [{ name: "Birds", children: [{ word: "duck" }] }, { word: "dog" }] },
    {
      name: "Words",
      kind: "modifier",
      children: [{ name: "Colors", children: [{ word: "blue" }] }, { name: "Phrases", kind: "function", children: [{ word: "i" }] }],
    },
    { name: "Feelings", children: [{ word: "love" }, { word: "lonesome", kind: "modifier" }] },
  ];

  it("lists every keyword in document order with its path and inherited kind, noun by default", () => {
    expect(keywordEntries(taxonomy).map((e) => [e.path, e.kind])).toEqual([
      ["Animals/Birds/duck", "noun"],
      ["Animals/dog", "noun"],
      ["Words/Colors/blue", "modifier"],
      ["Words/Phrases/i", "function"],
      ["Feelings/love", "noun"],
      ["Feelings/lonesome", "modifier"],
    ]);
  });

  it("keeps the keyword itself", () => {
    expect(keywordEntries(taxonomy)[0].keyword).toEqual({ word: "duck" });
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
});

describe("titleWords", () => {
  it("is each aka name as space-padded words, ready for phrase lookup", () => {
    expect(titleWords("Bonaparte's Reel aka Napoleon's Reel")).toEqual([" bonaparte reel ", " napoleon reel "]);
  });
});
