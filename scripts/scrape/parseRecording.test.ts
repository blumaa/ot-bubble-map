import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseRecording } from "./parseRecording";

const fixture = readFileSync(join(__dirname, "__fixtures__/ducks-millpond.html"), "utf8");
const url = "https://www.slippery-hill.com/content/ducks-millpond";

describe("parseRecording", () => {
  it("extracts all recording fields", () => {
    expect(parseRecording(fixture, url)).toEqual({
      url,
      tune: "Ducks On The Millpond",
      tuneSlug: "ducks-millpond",
      artist: "Emmett Lundy",
      playedBy: "Emmett Lundy with Kelly Lundy, guitar; Geedy Lundy, banjo",
      key: "D",
      tuning: "GDAE",
      year: 1941,
      mediaSource: "Library of Congress, Archive of Folk Culture",
      collections: [
        "Milliner-Koken Collection of American Fiddle Tunes",
        "Old Time Fiddling From The State Of Virginia",
        "Emmett Lundy",
        "Gettysburg Collection",
      ],
      audio: "https://www.slippery-hill.com/system/files/recordings/ducksonthemillpond_emmettlundy.mp3",
    });
  });

  it("reads the artist from the taxonomy-term field some pages use", () => {
    const html = readFileSync(join(__dirname, "__fixtures__/lonesome-road-blues-8.html"), "utf8");
    expect(parseRecording(html, "https://www.slippery-hill.com/content/lonesome-road-blues-8")).toMatchObject({
      tune: "Lonesome Road Blues",
      artist: "Kessinger Brothers",
      year: 1930,
    });
  });

  it("returns null for pages without a tune title", () => {
    expect(parseRecording("<html><body><main>About</main></body></html>", url)).toBeNull();
  });

  it("leaves missing optional fields null", () => {
    const html = `<main><div class="field--name-field-r-tune-title">
      <div class="field__item"><a href="/taxonomy/tune-title/duck-river">Duck River</a></div></div></main>`;
    expect(parseRecording(html, url)).toMatchObject({
      tune: "Duck River",
      tuneSlug: "duck-river",
      artist: null,
      key: null,
      year: null,
      collections: [],
      audio: null,
    });
  });
});
