import { describe, expect, it } from "vitest";
import { ancestors, childrenIndex, packLayout, packRecordings, toScreen, zoomTo } from "./layout";
import { at, nodes, byId } from "./__fixtures__/tree";

describe("packLayout", () => {
  it("flattens every node, parents first, with unique short ids and parent links", () => {
    expect(nodes).toHaveLength(10);
    expect(new Set(nodes.map((n) => n.id)).size).toBe(10);
    expect(nodes[0]).toMatchObject({ parentId: null, depth: 0, kind: "root" });
    expect(at("Animals/duck")).toMatchObject({ kind: "keyword", parentId: at("Animals").id, depth: 2 });
    expect(nodes.every((n) => n.id.length <= 2)).toBe(true);
  });

  it("centers root in the square", () => {
    expect(nodes[0]).toMatchObject({ x: 500, y: 500, r: 500 });
  });

  it("rounds coordinates to two decimals", () => {
    for (const n of nodes) for (const v of [n.x, n.y, n.r]) expect(Math.round(v * 100) / 100).toBe(v);
  });

  it("tags nodes with their top-level category index", () => {
    expect(at("Places/river/Duck River").category).toBe(1);
    expect(at("Animals/duck").category).toBe(0);
    expect(nodes[0].category).toBe(-1);
  });

  it("numbers categories in taxonomy order, not by size, so colors stay put when the data changes", () => {
    const small = { kind: "group" as const, name: "Small", children: [{ kind: "tune" as const, name: "a", slug: "a", value: 1 }] };
    const big = { kind: "group" as const, name: "Big", children: [{ kind: "tune" as const, name: "b", slug: "b", value: 9 }] };
    const laid = packLayout({ kind: "root", name: "r", children: [small, big] }, 100);
    expect(laid.find((n) => n.name === "Small")!.category).toBe(0);
    expect(laid.find((n) => n.name === "Big")!.category).toBe(1);
  });

  it("carries tune forms, leaving them off tunes without any", () => {
    expect(at("Animals/duck/Duck River").forms).toEqual(["reel"]);
    expect(at("Animals/duck/Ducks On The Millpond")).not.toHaveProperty("forms");
  });

  it("carries tune slug and recording count", () => {
    expect(at("Animals/duck/Duck River")).toMatchObject({ kind: "tune", slug: "duck-river", value: 2 });
  });

  it("carries tune keys, leaving them off tunes without any", () => {
    expect(at("Animals/duck/Duck River").keys).toEqual({ A: 2, D: 1 });
    expect(packLayout({ kind: "root", name: "r", children: [{ kind: "tune", name: "t", slug: "t", value: 1, keys: {} }] }, 10)[1]).not.toHaveProperty("keys");
  });

  it("resolves a tune's alsoIn paths to keyword node ids, dropping paths with no bubble", () => {
    expect(at("Animals/goose/Goose Hangs High").alsoIn).toEqual([at("Animals/duck").id]);
    expect(at("Animals/duck/Duck River")).not.toHaveProperty("alsoIn");
  });

  it("leaves keyword paths out of the layout", () => {
    expect(at("Animals/duck")).not.toHaveProperty("path");
  });

  it("counts distinct tunes under each group", () => {
    expect(nodes[0].tunes).toBe(3);
    expect(at("Animals").tunes).toBe(3);
    expect(at("Places").tunes).toBe(1);
  });

  it("totals the recordings of distinct tunes under each group", () => {
    expect(nodes[0].recordings).toBe(4);
    expect(at("Animals").recordings).toBe(4);
    expect(at("Places").recordings).toBe(2);
  });
});

describe("navigation helpers", () => {
  it("lists ancestors root-first, including the node", () => {
    expect(ancestors(byId, at("Animals/duck").id).map((n) => n.name)).toEqual(["root", "Animals", "duck"]);
  });

  it("indexes children by parent id in layout order", () => {
    const index = childrenIndex(nodes);
    expect(index.get(at("Animals").id)!.map((n) => n.name)).toEqual(["duck", "goose"]);
    expect(index.get(at("Animals/duck/Duck River").id)).toBeUndefined();
  });
});

describe("packRecordings", () => {
  const tune = { x: 100, y: 200, r: 30 };

  it("packs one circle per recording inside the tune without overlap", () => {
    const circles = packRecordings(tune, 6);
    expect(circles).toHaveLength(6);
    for (const c of circles) expect(Math.hypot(c.x - tune.x, c.y - tune.y) + c.r).toBeLessThanOrEqual(tune.r + 1e-9);
    for (const a of circles)
      for (const b of circles) if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.r + b.r - 1e-9);
  });

  it("centers a single recording in the tune", () => {
    const [c] = packRecordings(tune, 1);
    expect(c.x).toBeCloseTo(100);
    expect(c.y).toBeCloseTo(200);
    expect(c.r).toBeLessThan(30);
  });

  it("leaves a rim band free for the tune's own label when given an inset", () => {
    for (const c of packRecordings(tune, 6, 0.2)) expect(Math.hypot(c.x - tune.x, c.y - tune.y) + c.r).toBeLessThanOrEqual(24 + 1e-9);
  });
});

describe("toScreen", () => {
  it("applies the zoom transform", () => {
    expect(toScreen({ x: 10, y: 20, r: 5 }, { k: 2, x: 100, y: 50 })).toEqual({ x: 120, y: 90, r: 10 });
  });
});

describe("zoomTo", () => {
  it("is identity for the root", () => {
    expect(zoomTo({ x: 500, y: 500, r: 500 }, { width: 1000, height: 1000 })).toEqual({ k: 1, tx: 0, ty: 0 });
  });

  it("scales a node to fill the view and centers it", () => {
    const { k, tx, ty } = zoomTo({ x: 250, y: 300, r: 100 }, { width: 1000, height: 1000 });
    expect(k).toBe(5);
    expect(250 * k + tx).toBe(500);
    expect(300 * k + ty).toBe(500);
  });

  it("fits a non-square view by its short side and centers in it", () => {
    const { k, tx, ty } = zoomTo({ x: 250, y: 300, r: 100 }, { width: 1600, height: 800 });
    expect(k).toBe(4);
    expect(250 * k + tx).toBe(800);
    expect(300 * k + ty).toBe(400);
  });

  it("leaves a margin when fill < 1", () => {
    expect(zoomTo({ x: 500, y: 500, r: 500 }, { width: 1000, height: 1000 }, 0.9).k).toBeCloseTo(0.9);
  });
});
