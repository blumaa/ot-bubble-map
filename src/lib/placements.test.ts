import { describe, expect, it } from "vitest";
import { mergePlacements } from "./placements";

describe("mergePlacements", () => {
  it("lets a curated placement override an AI one", () => {
    expect(mergePlacements({ a: "AI/a", b: "AI/b" }, { b: "Human/b" })).toEqual({ a: "AI/a", b: "Human/b" });
  });
});
