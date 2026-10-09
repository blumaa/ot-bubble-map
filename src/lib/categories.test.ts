import { describe, expect, it } from "vitest";
import aiPlacements from "../../data/ai-placements.json";
import categoriesData from "../../data/categories.json";
import recordings from "../../data/recordings.json";
import { matchTerms, nodeLabel, taxonomyEntries, type Group } from "./keywords";
import { placements } from "./placements";
import { buildHierarchy, groupTunes, type BubbleNode } from "./tunes";
import type { Recording } from "./types";

const taxonomy = categoriesData.categories as Group[];
/** Subgroups only a person fills (rule 7). */
const SENSITIVE = ["People/Nations & Peoples/", "People/Slurs/"];
const tunes = groupTunes(recordings as Recording[]);
const tree = buildHierarchy(tunes, taxonomy, placements);

/** "Group/…/keyword" bubble path each tune ends up under, after collapsing. */
function bubblePaths(): Map<string, string> {
  const paths = new Map<string, string>();
  const walk = (node: BubbleNode, prefix: string) => {
    for (const child of node.children ?? []) {
      if (child.kind === "tune") paths.set(child.name, prefix.slice(0, -1));
      else walk(child, `${prefix}${child.name}/`);
    }
  };
  walk(tree, "");
  return paths;
}

describe("categories.json", () => {
  const paths = bubblePaths();

  it.each([
    ["Big Eyed Rabbit", "Animals/Wild Animals/rabbit"],
    ["Kentucky Waltz", "Places/States/kentucky"],
    ["Blue Eyed Girl", "People/Folks/girl"],
    ["Old Joe Clark", "People/First Names/joe"],
    ["Sally Goodin", "People/First Names/sal"],
    ["Soldier's Joy", "People/Soldiers"],
    ["Turkey In The Straw", "Animals/Birds/turkey"],
    ["Black Mountain Rag", "Places/Mountains & Hollows/mountain"],
    ["Grey Eagle", "Animals/Birds/eagle"],
    ["Blue Railroad Train", "Travel/Trains & Railroads/train"],
    ["Red June Apple", "Food & Drink/Food/apple"],
    ["Back In Jail Again", "Life & Death/Crime & Jail/jail"],
    ["Old Gray Mare", "Animals/Horses & Mules/mare"],
    ["Rose Of Sharon", "Nature/Plants/rose"],
    ["Sandy River Belle", "Places/Rivers & Waters/river"],
  ])("files %s under %s", (title, path) => {
    expect(paths.get(title)).toBe(path);
  });

  // Mistakes reported by a listener. Each fix stays fixed.
  it.each([
    ["Bow legged Irishman", "People/Nations & Peoples/irish"],
    ["Cherokee Shuffle", "People/Nations & Peoples/cherokee"],
    ["Dago March", "People/Slurs/dago"],
    ["Darkie's Delight", "People/Slurs/darkey"],
    ["Bow Wow Blues", "Animals/Dogs & Cats/dog"],
    ["Rock Of Ages", "Faith/Church & Worship/hymn"],
    ["On The Rock Where Moses Stood", "Faith/Bible/moses"],
    ["Pearly Gates", "Faith/Heaven & Hell/heaven"],
    ["Open Up Dem Pearly Gates For Me", "Faith/Heaven & Hell/heaven"],
    ["Cinda", "People/First Names/cindy"],
    ["Melinda", "People/First Names/melinda"],
    ["Rachel", "People/First Names/rachel"],
    ["Martha Campbell", "People/First Names/martha"],
    ["Reuben", "People/First Names/reuben"],
    ["Arkansas Traveler", "Places/States/arkansas"],
    ["Flatwoods", "Places/Regions/flatwoods"],
    ["Pacific Slope", "Places/Regions/pacific slope"],
    ["Everglades", "Places/Regions/everglades"],
    ["Jolly Blacksmith", "People/Occupations/blacksmith"],
    ["Village Blacksmith, The", "People/Occupations/blacksmith"],
    // Left for a reviewer to place.
    ["Flunky Butt", "Unsorted"],
    ["Chinchbug", "Unsorted"],
    ["Snappin' Bug", "Unsorted"],
    ["Thumping Bug", "Unsorted"],
  ])("files %s under %s (from feedback)", (title, path) => {
    expect(paths.get(title)).toBe(path);
  });

  it("files every state in one flat list", () => {
    for (const title of ["Arkansas Traveler", "Virginia Reel", "Missouri Waltz", "West Virginia Hills"]) {
      expect(paths.get(title)?.split("/").slice(0, 2).join("/"), title).toBe("Places/States");
    }
  });

  it("places every tune", () => {
    expect(paths.size).toBe(new Set(tunes.map((t) => t.name)).size);
  });

  it("has no grammar groups or catch-all keywords", () => {
    expect(taxonomy.map((g) => g.name)).not.toContain("Words");
    expect(taxonomyEntries(taxonomy).filter((e) => nodeLabel(e.node) === "other")).toEqual([]);
  });

  it.each(SENSITIVE)("never auto-files %s: a person places them", (prefix) => {
    const entries = taxonomyEntries(taxonomy).filter((e) => e.path.startsWith(prefix));
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.filter((e) => matchTerms(e.node).length > 0)).toEqual([]);
  });

  it.each(SENSITIVE)("never lets the AI place %s", (prefix) => {
    const placed = Object.entries(aiPlacements as Record<string, string>).filter(([, path]) => path.startsWith(prefix));
    expect(placed).toEqual([]);
  });

  it("places only tunes that exist", () => {
    const slugs = new Set(tunes.map((t) => t.slug));
    expect(Object.keys(placements).filter((slug) => !slugs.has(slug))).toEqual([]);
  });

  it("gives every group and keyword a unique path", () => {
    const all = taxonomyEntries(taxonomy).map((e) => e.path);
    expect(all.filter((p, i) => all.indexOf(p) !== i)).toEqual([]);
  });

  it("matches each term from one group or keyword only", () => {
    const owners = new Map<string, string[]>();
    for (const e of taxonomyEntries(taxonomy)) for (const term of matchTerms(e.node)) owners.set(term, [...(owners.get(term) ?? []), e.path]);
    expect([...owners].filter(([, p]) => p.length > 1)).toEqual([]);
  });

});
