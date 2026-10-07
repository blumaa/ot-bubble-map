import { describe, expect, it } from "vitest";
import { EMPTY_PANEL, forgetClosed, openRows, togglePanel } from "./panel";
import { at, byId, nodes } from "./__fixtures__/tree";

const root = nodes[0].id;
const names = (ids: Set<string>) => [...ids].map((id) => byId.get(id)!.name).toSorted();

describe("openRows", () => {
  it("opens the path down to the focus, the focus included", () => {
    expect(names(openRows(byId, at("Animals/duck").id, EMPTY_PANEL))).toEqual(["Animals", "duck", "root"]);
  });

  it("does not open a focused tune, which has no rows below it", () => {
    expect(names(openRows(byId, at("Animals/duck/Duck River").id, EMPTY_PANEL))).toEqual(["Animals", "duck", "root"]);
  });

  it("closes rows the map opened once the focus moves elsewhere", () => {
    expect(names(openRows(byId, at("Places/river").id, EMPTY_PANEL))).toEqual(["Places", "river", "root"]);
  });

  it("keeps rows the user opened, wherever the focus goes", () => {
    const panel = togglePanel(EMPTY_PANEL, at("Animals/goose").id, false);
    expect(names(openRows(byId, at("Places/river").id, panel))).toEqual(["Places", "goose", "river", "root"]);
  });

  it("lets the user close a row on the focus path", () => {
    const panel = togglePanel(EMPTY_PANEL, at("Animals").id, true);
    expect(names(openRows(byId, at("Animals/duck").id, panel))).toEqual(["duck", "root"]);
  });
});

describe("togglePanel", () => {
  it("closing a row the user opened forgets it", () => {
    const opened = togglePanel(EMPTY_PANEL, at("Animals/goose").id, false);
    const closed = togglePanel(opened, at("Animals/goose").id, true);
    expect(names(openRows(byId, root, closed))).toEqual(["root"]);
  });

  it("reopening a row the user closed undoes the close", () => {
    const closed = togglePanel(EMPTY_PANEL, at("Animals").id, true);
    const reopened = togglePanel(closed, at("Animals").id, false);
    expect(names(openRows(byId, at("Animals/duck").id, reopened))).toEqual(["Animals", "duck", "root"]);
  });
});

describe("forgetClosed", () => {
  it("reopens path rows the user closed, keeping rows the user opened", () => {
    const panel = forgetClosed(togglePanel(togglePanel(EMPTY_PANEL, at("Animals").id, true), at("Animals/goose").id, false));
    expect(names(openRows(byId, at("Animals/duck").id, panel))).toEqual(["Animals", "duck", "goose", "root"]);
  });

  it("returns the same panel when nothing was closed, so React skips the update", () => {
    expect(forgetClosed(EMPTY_PANEL)).toBe(EMPTY_PANEL);
  });
});
