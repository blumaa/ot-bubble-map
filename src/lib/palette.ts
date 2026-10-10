import type { LaidOutNode } from "./layout";

// One row per hue: [top group, subgroup, keyword, tune, recording] fills. Literal strings so Tailwind sees them. Hues are
// brand tokens from globals.css; every hue shares one lightness ladder, flipped in dark mode.
const OCHRE = ["fill-ochre-50", "fill-ochre-100", "fill-ochre-200", "fill-ochre-300", "fill-ochre-400"];
const BLUSH = ["fill-blush-50", "fill-blush-100", "fill-blush-200", "fill-blush-300", "fill-blush-400"];
const RIVER = ["fill-river-50", "fill-river-100", "fill-river-200", "fill-river-300", "fill-river-400"];
const ORCHID = ["fill-orchid-50", "fill-orchid-100", "fill-orchid-200", "fill-orchid-300", "fill-orchid-400"];
const PLUM = ["fill-plum-50", "fill-plum-100", "fill-plum-200", "fill-plum-300", "fill-plum-400"];
const FERN = ["fill-fern-50", "fill-fern-100", "fill-fern-200", "fill-fern-300", "fill-fern-400"];
const PEACH = ["fill-peach-50", "fill-peach-100", "fill-peach-200", "fill-peach-300", "fill-peach-400"];
const LAKE = ["fill-lake-50", "fill-lake-100", "fill-lake-200", "fill-lake-300", "fill-lake-400"];
const MOSS = ["fill-moss-50", "fill-moss-100", "fill-moss-200", "fill-moss-300", "fill-moss-400"];
const DENIM = ["fill-denim-50", "fill-denim-100", "fill-denim-200", "fill-denim-300", "fill-denim-400"];
const PINE = ["fill-pine-50", "fill-pine-100", "fill-pine-200", "fill-pine-300", "fill-pine-400"];
const STRAW = ["fill-straw-50", "fill-straw-100", "fill-straw-200", "fill-straw-300", "fill-straw-400"];

// Hue per top-level group, in taxonomy order. Related groups share a hue: twelve hues is about as many as pastels can
// keep apart.
const PALETTE = [
  OCHRE, // Animals
  BLUSH, // People
  RIVER, // Places
  ORCHID, // Feelings
  ORCHID, // Dreams
  ORCHID, // Memories
  PLUM, // Faith
  FERN, // Nature
  PEACH, // Food
  PEACH, // Drink
  LAKE, // Travel
  MOSS, // Home
  MOSS, // Things
  MOSS, // Body
  MOSS, // Work
  MOSS, // Money
  DENIM, // Music
  DENIM, // Dance
  PINE, // Life
  PINE, // Death
  PINE, // Crime
  PINE, // War
  STRAW, // Unsorted
];

type Shaded = Pick<LaidOutNode, "kind" | "depth" | "category">;

const hue = (node: Shaded) => PALETTE[node.category];

/** Fill for a bubble: hue from its top-level group, shade from its role, so any nesting depth reads the same. */
export function fillClass(node: Shaded): string {
  if (node.kind === "root") return "fill-paper";
  if (node.kind === "group") return hue(node)[node.depth === 1 ? 0 : 1];
  return hue(node)[node.kind === "keyword" ? 2 : 3];
}

/** Fill for a recording bubble inside `tune`. */
export function recordingFill(tune: Shaded): string {
  return hue(tune)[4];
}
