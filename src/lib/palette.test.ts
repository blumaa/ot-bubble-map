import { describe, expect, it } from "vitest";
import categoriesData from "../../data/categories.json";
import type { Group } from "./keywords";
import { fillClass, recordingFill } from "./palette";

const node = (kind: "root" | "group" | "keyword" | "tune", depth: number, category: number) => ({ kind, depth, category });

describe("fillClass", () => {
  it("shades by role, not depth, so deep groups stay lighter than keywords", () => {
    expect(fillClass(node("root", 0, -1))).toBe("fill-paper");
    expect(fillClass(node("group", 1, 0))).toBe("fill-ochre-50");
    expect(fillClass(node("group", 2, 0))).toBe("fill-ochre-100");
    expect(fillClass(node("group", 3, 0))).toBe("fill-ochre-100");
    expect(fillClass(node("keyword", 4, 0))).toBe("fill-ochre-200");
    expect(fillClass(node("tune", 5, 0))).toBe("fill-ochre-300");
    expect(recordingFill(node("tune", 5, 0))).toBe("fill-ochre-400");
  });

  const top = (categoriesData.categories as Group[]).map((g) => g.name);
  const hueOf = (name: string) => fillClass(node("group", 1, top.indexOf(name)));

  it("has a hue row for every top group, so none wraps around", () => {
    expect(top.map(hueOf)).not.toContain(undefined);
  });

  it("keeps Unsorted in straw, apart from every filed group", () => {
    expect(hueOf("Unsorted")).toBe("fill-straw-50");
    expect(top.filter((name) => name !== "Unsorted" && hueOf(name) === "fill-straw-50")).toEqual([]);
  });

  it("shares a hue between categories split from one old pair", () => {
    expect(new Set(["Food", "Drink"].map(hueOf)).size).toBe(1);
    expect(new Set(["Home", "Things", "Body", "Work", "Money"].map(hueOf)).size).toBe(1);
    expect(new Set(["Music", "Dance"].map(hueOf)).size).toBe(1);
    expect(new Set(["Life", "Death", "Crime", "War"].map(hueOf)).size).toBe(1);
    expect(new Set(["Feelings", "Dreams", "Memories"].map(hueOf)).size).toBe(1);
  });

  it("gives unrelated categories their own hue", () => {
    const families = ["Animals", "People", "Places", "Feelings", "Faith", "Nature", "Food", "Travel", "Home", "Music", "Life", "Unsorted"];
    expect(new Set(families.map(hueOf)).size).toBe(families.length);
  });
});
