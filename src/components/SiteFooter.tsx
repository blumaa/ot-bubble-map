import { EDUCATIONAL_NOTICE } from "@/lib/site";

/** Small floating notice over the map, linking to the legal page in a new tab. */
export function SiteFooter() {
  return (
    <footer className="glass fixed bottom-3 right-3 max-w-[calc(100%-1.5rem)] rounded-full px-3 py-1 text-xs text-muted">
      {EDUCATIONAL_NOTICE}{" "}
      <a href="/legal" target="_blank" rel="noopener" className="link">
        Copyright &amp; contact ↗
      </a>
    </footer>
  );
}
