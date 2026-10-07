import { ancestors, type LaidOutNode } from "./layout";

/**
 * Rows the user toggled in the key panel. Everything else follows the map: the path down to the focus is open, and
 * rows the map opened close again when the focus moves elsewhere.
 */
export interface Panel {
  /** Opened by the user; stay open wherever the focus goes. */
  opened: ReadonlySet<string>;
  /** Closed by the user while on the focus path; forgotten when the focus changes. */
  closed: ReadonlySet<string>;
}

export const EMPTY_PANEL: Panel = { opened: new Set(), closed: new Set() };

/** Ids of the rows whose children show. */
export function openRows(byId: Map<string, LaidOutNode>, focusId: string, panel: Panel): Set<string> {
  const open = new Set(panel.opened);
  for (const n of ancestors(byId, focusId)) if (n.kind !== "tune") open.add(n.id);
  for (const id of panel.closed) open.delete(id);
  return open;
}

/** The user clicked a row's expand button; `isOpen` is whether the row was open before the click. */
export function togglePanel(panel: Panel, id: string, isOpen: boolean): Panel {
  const opened = new Set(panel.opened);
  const closed = new Set(panel.closed);
  if (isOpen) {
    opened.delete(id);
    closed.add(id);
  } else {
    closed.delete(id);
    opened.add(id);
  }
  return { opened, closed };
}

/** The focus moved: rows the user closed on the old path open again if the new path runs through them. */
export function forgetClosed(panel: Panel): Panel {
  return panel.closed.size === 0 ? panel : { opened: panel.opened, closed: new Set() };
}
