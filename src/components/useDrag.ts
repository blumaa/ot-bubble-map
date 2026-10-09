import { useRef, useState, type PointerEvent, type RefObject } from "react";
import { moveWithin, type Box, type Point } from "@/lib/drag";

/** Pressing these inside the handle uses them instead of starting a drag. */
const INTERACTIVE = "a, button, input, select, textarea, label";

/**
 * Lets a floating panel be dragged by a handle, with mouse or touch, kept inside the window.
 * `panel` is the panel's ref; put `style` on the panel and spread `handle` on the part the user grabs.
 */
export function useDrag(panel: RefObject<HTMLElement | null>) {
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const drag = useRef<{ pointer: number; start: Point; box: Box; offset: Point } | null>(null);

  const end = (e: PointerEvent) => {
    if (drag.current?.pointer === e.pointerId) drag.current = null;
  };

  const handle = {
    onPointerDown(e: PointerEvent<HTMLElement>) {
      if (e.button !== 0 || (e.target as Element).closest(INTERACTIVE)) return;
      const { left, top, width, height } = panel.current!.getBoundingClientRect();
      drag.current = { pointer: e.pointerId, start: { x: e.clientX, y: e.clientY }, box: { left, top, width, height }, offset };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove(e: PointerEvent) {
      const d = drag.current;
      if (d?.pointer !== e.pointerId) return;
      const delta = { x: e.clientX - d.start.x, y: e.clientY - d.start.y };
      setOffset(moveWithin(d.box, d.offset, delta, { width: window.innerWidth, height: window.innerHeight }));
    },
    onPointerUp: end,
    onPointerCancel: end,
  };

  return { style: { translate: `${offset.x}px ${offset.y}px` }, handle };
}
