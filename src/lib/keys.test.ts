import { describe, expect, it } from "vitest";
import { splitKeys } from "./keys";

describe("splitKeys", () => {
  it("splits multi-key recordings into single keys, keeping modes", () => {
    expect(splitKeys("G & E Minor")).toEqual(["G", "E Minor"]);
    expect(splitKeys("A Modal")).toEqual(["A Modal"]);
  });

  it("returns no keys when none is listed", () => {
    expect(splitKeys(null)).toEqual([]);
  });
});
