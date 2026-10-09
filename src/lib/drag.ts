import type { View } from "./layout";

export interface Point {
  x: number;
  y: number;
}

/** A panel's screen rectangle, in px. */
export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Gap, in px, a dragged panel keeps from the window's edges. */
export const DRAG_MARGIN = 8;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, Math.max(min, max)));

/**
 * The panel's new offset after the pointer moved `delta` since the drag started. `box` and `offset` are the panel's
 * rectangle and offset when the drag started. The panel stays inside the view; one too big for it pins to the top left.
 */
export function moveWithin(box: Box, offset: Point, delta: Point, view: View): Point {
  const left = clamp(box.left + delta.x, DRAG_MARGIN, view.width - box.width - DRAG_MARGIN);
  const top = clamp(box.top + delta.y, DRAG_MARGIN, view.height - box.height - DRAG_MARGIN);
  return { x: offset.x + left - box.left, y: offset.y + top - box.top };
}
