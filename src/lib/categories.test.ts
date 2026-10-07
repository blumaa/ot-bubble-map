import { describe, expect, it } from "vitest";
import categoriesData from "../../data/categories.json";
import curated from "../../data/curated.json";
import recordings from "../../data/recordings.json";
import { keywordEntries, matchTerms, titleWords, wordsMatch, type Group } from "./keywords";
import { buildHierarchy, groupTunes, type BubbleNode } from "./tunes";
import type { Recording } from "./types";

const taxonomy = categoriesData.categories as Group[];
const curatedPaths = curated as Record<string, string>;
const tunes = groupTunes(recordings as Recording[]);
const tree = buildHierarchy(tunes, taxonomy, curatedPaths);

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
    ["Kentucky Waltz", "Places/Southern States/kentucky"],
    ["Blue Eyed Girl", "People/Characters/Folks/girl"],
    ["Old Joe Clark", "People/Names/Men/joe"],
    ["Sally Goodin", "People/Names/Women/sal"],
    ["Soldier's Joy", "People/Characters/Soldiers & Rulers/soldier"],
    ["Arkansas Traveler", "Places/Southern States/arkansas"],
    ["Turkey In The Straw", "Animals/Barnyard Birds/turkey"],
    ["Black Mountain Rag", "Places/Hills & Hollows/mountain"],
    ["Grey Eagle", "Animals/Wild Birds/eagle"],
    ["Blue Railroad Train", "Travel/Rails/train"],
    ["Fruit Jar Blues", "Music & Dance/Dance Tunes/blues"],
    ["Red June Apple", "Food & Drink/Food/apple"],
    ["Back In Jail Again", "Life & Death/jail"],
    ["Old Gray Mare", "Animals/Horses & Mules/mare"],
    ["Rose Of Sharon", "Nature/Plants/rose"],
    ["Sandy River Belle", "Places/Rivers & Waters/river"],
  ])("files %s under %s", (title, path) => {
    expect(paths.get(title)).toBe(path);
  });

  it("places every tune", () => {
    expect(paths.size).toBe(new Set(tunes.map((t) => t.name)).size);
  });

  it("leaves under 15% of tunes to Words", () => {
    const words = [...paths.values()].filter((p) => p.startsWith("Words/")).length;
    expect(words / tunes.length).toBeLessThan(0.15);
  });

  it("curates only tunes that exist", () => {
    const slugs = new Set(tunes.map((t) => t.slug));
    expect(Object.keys(curatedPaths).filter((slug) => !slugs.has(slug))).toEqual([]);
  });

  it("gives every keyword a unique path", () => {
    const all = keywordEntries(taxonomy).map((e) => e.path);
    expect(all.filter((p, i) => all.indexOf(p) !== i)).toEqual([]);
  });

  it("matches each term from one keyword only", () => {
    const owners = new Map<string, string[]>();
    for (const e of keywordEntries(taxonomy)) for (const term of matchTerms(e.keyword)) owners.set(term, [...(owners.get(term) ?? []), e.path]);
    expect([...owners].filter(([, p]) => p.length > 1)).toEqual([]);
  });

  it("keeps blue apart from blues", () => {
    const blue = keywordEntries(taxonomy).find((e) => e.keyword.word === "blue")!.keyword;
    expect(wordsMatch(titleWords("Fruit Jar Blues"), blue)).toBe(false);
  });
});
