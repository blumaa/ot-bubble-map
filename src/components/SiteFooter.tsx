import { EDUCATIONAL_NOTICE } from "@/lib/site";

/** Bottom row over the map: the taxonomy page link on the left, the legal notice on the right. Both open in a new tab. */
export function SiteFooter() {
  return (
    <footer className="flex items-end justify-between gap-2">
      <a
        href="/taxonomy"
        target="_blank"
        rel="noopener"
        className="glass pointer-events-auto shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-accent transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-accent"
      >
        How tunes are sorted ↗
      </a>
      <p className="glass pointer-events-auto rounded-2xl px-3 py-1 text-right text-xs text-muted">
        {EDUCATIONAL_NOTICE}{" "}
        <a href="/legal" target="_blank" rel="noopener" className="link">
          Copyright &amp; contact ↗
        </a>
      </p>
    </footer>
  );
}
