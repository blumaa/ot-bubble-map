import { describe, expect, it } from "vitest";
import { suggestKeywords } from "./suggestKeywords";

const names = [
  "Duck River",
  "Ducks On The Millpond",
  "Jenny Nettles",
  "Slidin' Jenny",
  "Jenny Lind Polka",
  "Sally Goodin",
  "Old Joe Clark",
];

describe("suggestKeywords", () => {
  it("counts word frequency across tune names, merging plurals", () => {
    const out = suggestKeywords(names, { minCount: 2, known: [] });
    expect(out).toEqual([
      { word: "jenny", count: 3, examples: ["Jenny Nettles", "Slidin' Jenny", "Jenny Lind Polka"] },
      { word: "duck", count: 2, examples: ["Duck River", "Ducks On The Millpond"] },
    ]);
  });

  it("skips stopwords and already-curated words", () => {
    const out = suggestKeywords(names, { minCount: 1, known: ["jenny", "duck"] });
    const words = out.map((s) => s.word);
    expect(words).not.toContain("on");
    expect(words).not.toContain("the");
    expect(words).not.toContain("old");
    expect(words).not.toContain("jenny");
    expect(words).toContain("sally");
  });

  it("never suggests aka", () => {
    const out = suggestKeywords(["A aka B", "C aka D"], { minCount: 1, known: [] });
    expect(out.map((s) => s.word)).not.toContain("aka");
  });
});
