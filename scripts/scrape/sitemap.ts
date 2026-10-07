const LOC = /<loc>([^<]+)<\/loc>/g;

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

export function parseLocs(xml: string): string[] {
  return [...xml.matchAll(LOC)].map((m) =>
    m[1].trim().replace(/&(amp|lt|gt|quot|apos);/g, (e) => ENTITIES[e]),
  );
}

export function isContentUrl(url: string): boolean {
  return new URL(url).pathname.startsWith("/content/");
}

/**
 * Content URLs, once each, as https. The sitemap lists some pages under both
 * http and https, and a few with different path case; those share one cache
 * file on a case-insensitive disk, so they are the same page to us.
 */
export function uniqueContentUrls(urls: string[]): string[] {
  const byKey = new Map<string, string>();
  for (const url of urls.filter(isContentUrl)) {
    const u = new URL(url);
    u.protocol = "https:";
    const key = u.pathname.toLowerCase();
    if (!byKey.has(key)) byKey.set(key, u.href);
  }
  return [...byKey.values()];
}
