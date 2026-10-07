import { describe, expect, it } from "vitest";
import { filterMatches, formOptions, keyOptions } from "./filter";
import { at, nodes } from "./__fixtures__/tree";

describe("keyOptions", () => {
  it("lists every key with its distinct tune count, most tunes first, then by name", () => {
    expect(keyOptions(nodes)).toEqual([
      { value: "A", tunes: 2 },
      { value: "D", tunes: 1 },
      { value: "G", tunes: 1 },
    ]);
  });
});

describe("formOptions", () => {
  it("lists every tune form with its distinct tune count, most tunes first", () => {
    expect(formOptions(nodes)).toEqual([
      { value: "reel", tunes: 2 },
      { value: "waltz", tunes: 1 },
    ]);
  });
});

describe("filterMatches", () => {
  it("is null when nothing is chosen", () => {
    expect(filterMatches(nodes, { key: null, form: null })).toBeNull();
  });

  it("counts matching distinct tunes under every group and marks matching tunes", () => {
    const matches = filterMatches(nodes, { key: "A", form: null })!;
    expect(matches.get(nodes[0].id)).toBe(2);
    expect(matches.get(at("Animals").id)).toBe(2);
    expect(matches.get(at("Animals/duck").id)).toBe(1);
  });

  it("counts a matching tune's recordings in the key", () => {
    expect(filterMatches(nodes, { key: "A", form: null })!.get(at("Places/river/Duck River").id)).toBe(2);
    expect(filterMatches(nodes, { key: "D", form: null })!.get(at("Animals/duck/Duck River").id)).toBe(1);
  });

  it("leaves out groups and tunes with no match", () => {
    const matches = filterMatches(nodes, { key: "G", form: null })!;
    expect(matches.has(at("Places").id)).toBe(false);
    expect(matches.has(at("Animals/goose").id)).toBe(false);
    expect(matches.has(at("Animals/duck/Duck River").id)).toBe(false);
    expect(matches.get(at("Animals/duck").id)).toBe(1);
  });

  it("filters by form alone, counting all of a tune's recordings", () => {
    const matches = filterMatches(nodes, { key: null, form: "waltz" })!;
    expect(matches.get(at("Animals/goose/Goose Hangs High").id)).toBe(1);
    expect(matches.get(nodes[0].id)).toBe(1);
    expect(matches.has(at("Animals/duck").id)).toBe(false);
  });

  it("needs both key and form to match when both are chosen", () => {
    const matches = filterMatches(nodes, { key: "D", form: "reel" })!;
    expect(matches.get(at("Animals/duck/Duck River").id)).toBe(1);
    expect(matches.has(at("Animals/goose/Goose Hangs High").id)).toBe(false);
    expect(filterMatches(nodes, { key: "G", form: "reel" })!.size).toBe(0);
  });
});
