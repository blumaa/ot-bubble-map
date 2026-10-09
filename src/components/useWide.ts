import { useSyncExternalStore } from "react";

/** Same width as Tailwind's `md` breakpoint, so script and styles switch layouts together. */
const WIDE = "(min-width: 48rem)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Whether the window is wide enough for the desktop layout. The server renders the phone layout first. */
export function useWide(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
}
