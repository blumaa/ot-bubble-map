import { describe, expect, it } from "vitest";
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

  it("gives each of twelve top groups its own hue", () => {
    const hues = Array.from({ length: 12 }, (_, i) => fillClass(node("group", 1, i)));
    expect(new Set(hues).size).toBe(12);
    expect(fillClass(node("group", 1, 12))).toBe(fillClass(node("group", 1, 0)));
  });
});
