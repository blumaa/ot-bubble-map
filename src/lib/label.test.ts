import { describe, expect, it } from "vitest";
import { at, byId, nodes } from "./__fixtures__/tree";
import { filterMatches } from "./filter";
import { contextPath, countLabel, rimArc, wrapLabel } from "./label";

describe("wrapLabel", () => {
  it("keeps short text on one line", () => {
    expect(wrapLabel("Duck River", 20, 3)).toEqual(["Duck River"]);
  });

  it("wraps on word boundaries", () => {
    expect(wrapLabel("Ducks On The Millpond", 10, 3)).toEqual(["Ducks On", "The", "Millpond"]);
  });

  it("ellipsizes the last line when lines run out", () => {
    expect(wrapLabel("Ducks On The Millpond", 10, 2)).toEqual(["Ducks On", "The…"]);
  });

  it("cuts a word longer than a line", () => {
    expect(wrapLabel("Supercalifragilistic", 8, 3)).toEqual(["Superca…"]);
  });

  it("returns nothing when not even one character fits", () => {
    expect(wrapLabel("Duck", 0, 3)).toEqual([]);
  });
});

describe("countLabel", () => {
  it("counts distinct tunes under a group, and their recordings", () => {
    expect(countLabel(nodes[0])).toBe("3 tunes · 4 recordings");
    expect(countLabel(at("Places"))).toBe("1 tune · 2 recordings");
  });

  it("counts recordings of a tune", () => {
    expect(countLabel(at("Animals/duck/Duck River"))).toBe("2 recordings");
    expect(countLabel(at("Animals/goose/Goose Hangs High"))).toBe("1 recording");
  });

  it("counts only what is in the chosen music key", () => {
    const matches = filterMatches(nodes, { key: "D", form: null });
    expect(countLabel(nodes[0], matches)).toBe("1 tune");
    expect(countLabel(at("Animals/duck/Duck River"), matches)).toBe("1 recording");
    expect(countLabel(at("Animals/goose"), matches)).toBe("0 tunes");
  });
});

describe("contextPath", () => {
  it("names the groups between the root and the node", () => {
    expect(contextPath(byId, at("Animals/duck/Duck River").id)).toBe("Animals › duck");
  });

  it("is empty for a category", () => {
    expect(contextPath(byId, at("Places").id)).toBe("");
  });
});

describe("rimArc", () => {
  const circle = { x: 100, y: 200, r: 50 };

  it("runs left to right over the top, so text along it reads upright", () => {
    expect(rimArc(circle, 40, "top")).toBe("M 60 200 A 40 40 0 0 1 140 200");
  });

  it("runs left to right under the bottom, so text along it reads upright", () => {
    expect(rimArc(circle, 40, "bottom")).toBe("M 60 200 A 40 40 0 0 0 140 200");
  });
});
