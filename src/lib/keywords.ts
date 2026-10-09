import { titleAliases } from "./clean";

/**
 * How strongly a keyword says what a tune is about, strongest first. A tune goes to its strongest matching keyword:
 * "Blue Eyed Girl" is about a girl (noun), not the color blue (modifier).
 */
export const KINDS = ["noun", "form", "modifier", "function"] as const;
export type Kind = (typeof KINDS)[number];

export interface Keyword {
  /** Display label, also the default match term. May be multi-word ("sally ann"). */
  word: string;
  /** Explicit match terms. Defaults to word + plural. Empty for keywords only curated tunes fill. */
  match?: string[];
  /** Phrases that veto a match: a title containing one is not about this keyword ("bow wow" for bow). */
  exclude?: string[];
  /** Overrides the kind inherited from its groups. */
  kind?: Kind;
}

/** A group of groups and keywords in data/categories.json. Any depth. Tunes can be filed in a group directly. */
export interface Group {
  name: string;
  /** Match terms that file a tune in the group itself. None by default: a group holds only placed tunes. */
  match?: string[];
  /** Phrases that veto a match, as for a keyword. */
  exclude?: string[];
  /** Shown in the key. */
  emoji?: string;
  /** Inherited by everything below; "noun" at the top. */
  kind?: Kind;
  children: TaxonomyNode[];
}

export type TaxonomyNode = Group | Keyword;

/** A group or keyword a tune can be filed in. */
export interface TaxonomyEntry {
  /** Group names, then the keyword word if a keyword, joined by "/": "Animals/Wild Animals/rabbit", "Animals/Birds". */
  path: string;
  node: TaxonomyNode;
  kind: Kind;
}

export function isKeyword(node: TaxonomyNode): node is Keyword {
  return "word" in node;
}

/** The label a node shows: a keyword's word or a group's name. */
export function nodeLabel(node: TaxonomyNode): string {
  return isKeyword(node) ? node.word : node.name;
}

/**
 * Every group and keyword in the taxonomy with its path and effective kind, in document order except that a group
 * comes after its children: on a tie, the specific keyword wins over its general group.
 */
export function taxonomyEntries(taxonomy: Group[]): TaxonomyEntry[] {
  const entries: TaxonomyEntry[] = [];
  const walk = (node: TaxonomyNode, prefix: string, inherited: Kind) => {
    const kind = node.kind ?? inherited;
    const path = prefix + nodeLabel(node);
    if (!isKeyword(node)) for (const child of node.children) walk(child, `${path}/`, kind);
    entries.push({ path, node, kind });
  };
  for (const group of taxonomy) walk(group, "", "noun");
  return entries;
}

export function tokenize(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/'s\b/g, "")
    .split(/[^a-z']+/)
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter(Boolean);
}

export function matchTerms(node: TaxonomyNode): string[] {
  return node.match ?? (isKeyword(node) ? [node.word, `${node.word}s`] : []);
}

/** Each aka name of a title as space-padded words. Compute once per title; matching is then a substring check. */
export function titleWords(title: string): string[] {
  return titleAliases(title).map((alias) => ` ${tokenize(alias).join(" ")} `);
}

/** True if any aka name (from `titleWords`) contains a match term as whole words and no excluded phrase. */
export function wordsMatch(words: string[], node: TaxonomyNode): boolean {
  const terms = matchTerms(node);
  const excluded = node.exclude ?? [];
  const has = (padded: string, phrase: string) => padded.includes(` ${phrase} `);
  return words.some((padded) => terms.some((term) => has(padded, term)) && !excluded.some((phrase) => has(padded, phrase)));
}

export function titleMatches(title: string, node: TaxonomyNode): boolean {
  return wordsMatch(titleWords(title), node);
}
