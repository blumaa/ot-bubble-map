import { ancestors, type Circle, type LaidOutNode } from "./layout";

/** Greedy word wrap into at most `maxLines` lines of `maxChars`; overflow ends in an ellipsis. */
export function wrapLabel(text: string, maxChars: number, maxLines: number): string[] {
  if (maxChars < 1) return [];
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }
  const truncated = lines.length === maxLines;
  if (!truncated) lines.push(line);
  const last = lines.length - 1;
  if (truncated || lines[last].length > maxChars) {
    lines[last] = `${lines[last].slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
  }
  return lines;
}

export const plural = (n: number, word: string) => `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

/** Distinct tunes under a group, recordings of a tune; only those passing the filter when `matches` is given. */
export function nodeCount(node: LaidOutNode, matches: Map<string, number> | null = null): number {
  if (matches) return matches.get(node.id) ?? 0;
  return (node.slug ? node.value : node.tunes) ?? 0;
}

/** "N tunes · M recordings" under a group ("N tunes" while filtering), "N recordings" of a tune. */
export function countLabel(node: LaidOutNode, matches: Map<string, number> | null = null): string {
  if (node.slug) return plural(nodeCount(node, matches), "recording");
  const tunes = plural(nodeCount(node, matches), "tune");
  return matches || node.recordings === undefined ? tunes : `${tunes} · ${plural(node.recordings, "recording")}`;
}

/** Groups between the root and a node, e.g. "Animals › duck". */
export function contextPath(byId: Map<string, LaidOutNode>, id: string): string {
  return ancestors(byId, id).slice(1, -1).map((n) => n.name).join(" › ");
}

/** Half-circle path of radius `r` around `circle`'s center, left to right over the top or under the bottom, for textPath. */
export function rimArc(circle: Circle, r: number, side: "top" | "bottom"): string {
  const sweep = side === "top" ? 1 : 0;
  return `M ${circle.x - r} ${circle.y} A ${r} ${r} 0 0 ${sweep} ${circle.x + r} ${circle.y}`;
}
