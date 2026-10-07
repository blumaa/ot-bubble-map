import { describe, expect, it } from "vitest";
import { clickTarget, popoverPlacement, searchNodes, viewFocus } from "./navigation";
import { at, byId, nodes } from "./__fixtures__/tree";

const root = nodes[0].id;
const duckRiver = () => at("Animals/duck/Duck River").id;

describe("clickTarget", () => {
  it("from the root, a tune deep inside a category focuses the category, not the tune's keyword", () => {
    expect(clickTarget(byId, duckRiver(), root)).toBe(at("Animals").id);
  });

  it("from a category, focuses the keyword under the click", () => {
    expect(clickTarget(byId, duckRiver(), at("Animals").id)).toBe(at("Animals/duck").id);
  });

  it("from a keyword, focuses the clicked tune to show its recordings", () => {
    expect(clickTarget(byId, duckRiver(), at("Animals/duck").id)).toBe(duckRiver());
  });

  it("clicking the focused bubble's own background zooms out one level", () => {
    expect(clickTarget(byId, duckRiver(), duckRiver())).toBe(at("Animals/duck").id);
    expect(clickTarget(byId, at("Animals").id, at("Animals").id)).toBe(root);
  });

  it("clicking the root background at the root stays at the root", () => {
    expect(clickTarget(byId, root, root)).toBe(root);
  });

  it("clicking a parent's background around the focus focuses that parent", () => {
    expect(clickTarget(byId, at("Animals").id, at("Animals/duck").id)).toBe(at("Animals").id);
  });

  it("clicking into a sibling branch focuses the sibling one level below the shared ancestor", () => {
    expect(clickTarget(byId, at("Animals/goose/Goose Hangs High").id, at("Animals/duck").id)).toBe(at("Animals/goose").id);
    expect(clickTarget(byId, at("Places/river/Duck River").id, at("Animals/duck").id)).toBe(at("Places").id);
  });
});

describe("viewFocus", () => {
  const VIEW = { width: 1600, height: 800 };
  const fitted = (id: string) => {
    const n = byId.get(id)!;
    const k = 800 / (2 * n.r);
    return { k, x: 800 - n.x * k, y: 400 - n.y * k };
  };

  it("is the root when the whole map is in view", () => {
    expect(viewFocus(nodes, { k: 0.8, x: 400, y: 0 }, VIEW)).toBe(root);
  });

  it("is the deepest node filling the view at its center", () => {
    expect(viewFocus(nodes, fitted(at("Animals/duck").id), VIEW)).toBe(at("Animals/duck").id);
  });

  it("focuses a tune once it fills the view", () => {
    expect(viewFocus(nodes, fitted(duckRiver()), VIEW)).toBe(duckRiver());
  });
});

describe("searchNodes", () => {
  const names = (q: string, limit = 10) => searchNodes(nodes, q, limit).map((n) => `${n.kind}:${n.name}`);

  it("finds nothing for a blank query", () => {
    expect(names("  ")).toEqual([]);
  });

  it("matches every word, ignoring case and punctuation, groups before tunes", () => {
    expect(names("DUCK")).toEqual(["keyword:duck", "tune:Duck River", "tune:Ducks On The Millpond"]);
    expect(names("river duck")).toEqual(["tune:Duck River"]);
  });

  it("lists a tune filed under several keywords once", () => {
    expect(names("duck river")).toEqual(["tune:Duck River"]);
  });

  it("caps the result count", () => {
    expect(names("duck", 2)).toHaveLength(2);
  });

  it("never returns the root", () => {
    expect(names("root")).toEqual([]);
  });
});

describe("popoverPlacement", () => {
  const view = { width: 1000, height: 800 };
  const size = { width: 300, height: 200 };

  it("centers above the circle when there is room", () => {
    expect(popoverPlacement({ x: 500, y: 500, r: 40 }, size, view)).toEqual({ left: 350, top: 252 });
  });

  it("flips below when there is no room above", () => {
    expect(popoverPlacement({ x: 500, y: 100, r: 40 }, size, view)).toEqual({ left: 350, top: 148 });
  });

  it("stays inside the view horizontally", () => {
    expect(popoverPlacement({ x: 20, y: 500, r: 10 }, size, view).left).toBe(8);
    expect(popoverPlacement({ x: 990, y: 500, r: 10 }, size, view).left).toBe(692);
  });
});
