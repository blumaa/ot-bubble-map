import * as cheerio from "cheerio";
import type { Recording } from "../../src/lib/types";

const ORIGIN = "https://www.slippery-hill.com";

export function parseRecording(html: string, url: string): Recording | null {
  const $ = cheerio.load(html);
  const field = (name: string) => $(`.field--name-field-r-${name} .field__item`);
  const text = (name: string) => field(name).first().text().trim() || null;

  const titleLink = field("tune-title").first().find("a");
  const tune = titleLink.text().trim();
  if (!tune) return null;

  const year = Number.parseInt(text("year") ?? "", 10);
  const audioSrc = $(".field--name-field-r-uploaded-file source").attr("src");

  return {
    url,
    tune,
    tuneSlug: titleLink.attr("href")?.split("/").pop() ?? "",
    // Older pages store the artist as plain text, newer ones as a taxonomy term.
    artist: text("source") ?? text("source-term"),
    playedBy: text("played-by"),
    key: text("key"),
    tuning: text("tuning"),
    year: Number.isNaN(year) ? null : year,
    mediaSource: text("media-source"),
    collections: field("collections-reference")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean),
    audio: audioSrc ? new URL(audioSrc, ORIGIN).href : null,
  };
}
