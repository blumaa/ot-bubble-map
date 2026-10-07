import { describe, expect, it } from "vitest";
import { parseLocs, isContentUrl, uniqueContentUrls } from "./sitemap";

const index = `<?xml version="1.0"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
 <sitemap><loc>https://www.slippery-hill.com/sitemap.xml?page=1</loc></sitemap>
 <sitemap><loc>https://www.slippery-hill.com/sitemap.xml?page=2</loc></sitemap>
</sitemapindex>`;

const urlset = `<?xml version="1.0"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
 <url><loc>https://www.slippery-hill.com/</loc></url>
 <url><loc>https://www.slippery-hill.com/content/ducks-millpond</loc></url>
 <url><loc>https://www.slippery-hill.com/content/jenny-nettles</loc></url>
</urlset>`;

describe("parseLocs", () => {
  it("reads loc entries from a sitemap index", () => {
    expect(parseLocs(index)).toEqual([
      "https://www.slippery-hill.com/sitemap.xml?page=1",
      "https://www.slippery-hill.com/sitemap.xml?page=2",
    ]);
  });

  it("reads loc entries from a urlset", () => {
    expect(parseLocs(urlset)).toHaveLength(3);
  });

  it("decodes XML entities", () => {
    expect(parseLocs("<loc>https://x.com/a?b=1&amp;c=2</loc>")).toEqual([
      "https://x.com/a?b=1&c=2",
    ]);
  });
});

describe("isContentUrl", () => {
  it("accepts /content/ pages", () => {
    expect(isContentUrl("https://www.slippery-hill.com/content/ducks-millpond")).toBe(true);
  });

  it("rejects other pages", () => {
    expect(isContentUrl("https://www.slippery-hill.com/")).toBe(false);
    expect(isContentUrl("https://www.slippery-hill.com/regional-page-list/x")).toBe(false);
  });
});

describe("uniqueContentUrls", () => {
  it("keeps content pages once, ignoring http/https and path case", () => {
    expect(
      uniqueContentUrls([
        "https://www.slippery-hill.com/",
        "https://www.slippery-hill.com/content/golden-slippers",
        "http://www.slippery-hill.com/content/golden-slippers",
        "http://www.slippery-hill.com/content/girl-I-left-behind-me-0",
        "https://www.slippery-hill.com/content/girl-i-left-behind-me-0",
      ]),
    ).toEqual([
      "https://www.slippery-hill.com/content/golden-slippers",
      "https://www.slippery-hill.com/content/girl-I-left-behind-me-0",
    ]);
  });
});
