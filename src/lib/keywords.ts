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
  /** Overrides the kind inherited from its groups. */
  kind?: Kind;
}

/** A group of groups and keywords in data/categories.json. Any depth. */
export interface Group {
  name: string;
  /** Shown in the key. */
  emoji?: string;
  /** Inherited by everything below; "noun" at the top. */
  kind?: Kind;
  children: TaxonomyNode[];
}

export type TaxonomyNode = Group | Keyword;

export interface KeywordEntry {
  /** Group names and the keyword word joined by "/", e.g. "Animals/Wild Animals/rabbit". */
  path: string;
  keyword: Keyword;
  kind: Kind;
}

export function isKeyword(node: TaxonomyNode): node is Keyword {
  return "word" in node;
}

/** Every keyword in the taxonomy, in document order, with its path and effective kind. */
export function keywordEntries(taxonomy: Group[]): KeywordEntry[] {
  const entries: KeywordEntry[] = [];
  const walk = (node: TaxonomyNode, prefix: string, inherited: Kind) => {
    const kind = node.kind ?? inherited;
    if (isKeyword(node)) entries.push({ path: prefix + node.word, keyword: node, kind });
    else for (const child of node.children) walk(child, `${prefix}${node.name}/`, kind);
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

export function matchTerms({ word, match }: Keyword): string[] {
  return match ?? [word, `${word}s`];
}

/** Each aka name of a title as space-padded words. Compute once per title; matching is then a substring check. */
export function titleWords(title: string): string[] {
  return titleAliases(title).map((alias) => ` ${tokenize(alias).join(" ")} `);
}

/** True if any aka name (from `titleWords`) contains a match term as whole words. */
export function wordsMatch(words: string[], keyword: Keyword): boolean {
  const terms = matchTerms(keyword);
  return words.some((padded) => terms.some((term) => padded.includes(` ${term} `)));
}

export function titleMatches(title: string, keyword: Keyword): boolean {
  return wordsMatch(titleWords(title), keyword);
}
