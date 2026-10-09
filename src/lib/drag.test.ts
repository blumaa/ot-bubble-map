import { describe, expect, it } from "vitest";
import { DRAG_MARGIN, moveWithin } from "./drag";

const view = { width: 400, height: 800 };
// A 200×100 panel at (50, 60) that the user has already dragged 10px right.
const box = { left: 50, top: 60, width: 200, height: 100 };
const offset = { x: 10, y: 0 };

describe("moveWithin", () => {
  it("adds the pointer's movement to the offset the drag started from", () => {
    expect(moveWithin(box, offset, { x: 30, y: -20 }, view)).toEqual({ x: 40, y: -20 });
  });

  it("stops the panel at the margin on the left and top", () => {
    expect(moveWithin(box, offset, { x: -500, y: -500 }, view)).toEqual({ x: 10 + DRAG_MARGIN - 50, y: DRAG_MARGIN - 60 });
  });

  it("stops the panel at the margin on the right and bottom", () => {
    const moved = moveWithin(box, offset, { x: 500, y: 2000 }, view);
    expect(box.left + moved.x - offset.x + box.width).toBe(view.width - DRAG_MARGIN);
    expect(box.top + moved.y - offset.y + box.height).toBe(view.height - DRAG_MARGIN);
  });

  it("pins a panel bigger than the view to the top left margin", () => {
    const tall = { ...box, height: 1000 };
    expect(moveWithin(tall, { x: 0, y: 0 }, { x: 0, y: 300 }, view).y).toBe(DRAG_MARGIN - 60);
  });
});
