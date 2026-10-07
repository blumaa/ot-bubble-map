import { tokenize } from "../../src/lib/keywords";

const STOPWORDS = new Set(
  `a an the of and or in on at to for from by with into over under up down out off
  my me i you your he his she her it its we our they their this that these those
  is am are was were be been ain't don't won't can't i'm i'll i've
  no not all some any one two old new little big get got go going gone come
  what when where who how why will just like so as if but then there here
  tune song waltz reel breakdown hornpipe rag march polka blues schottische jig
  part version aka`.split(/\s+/),
);

export interface Suggestion {
  word: string;
  count: number;
  examples: string[];
}

const MAX_EXAMPLES = 5;

/** Singular form when both singular and plural appear, so "ducks" folds into "duck". */
function canonical(word: string, seen: Set<string>): string {
  return word.endsWith("s") && seen.has(word.slice(0, -1)) ? word.slice(0, -1) : word;
}

export function suggestKeywords(
  names: string[],
  { minCount, known }: { minCount: number; known: string[] },
): Suggestion[] {
  const tokenized = names.map((name) => ({ name, words: new Set(tokenize(name)) }));
  const vocabulary = new Set(tokenized.flatMap((t) => [...t.words]));
  const skip = new Set(known);

  const byWord = new Map<string, Suggestion>();
  for (const { name, words } of tokenized) {
    const counted = new Set([...words].map((w) => canonical(w, vocabulary)));
    for (const word of counted) {
      if (STOPWORDS.has(word) || skip.has(word) || word.length < 3) continue;
      const s = byWord.get(word) ?? { word, count: 0, examples: [] };
      s.count++;
      if (s.examples.length < MAX_EXAMPLES) s.examples.push(name);
      byWord.set(word, s);
    }
  }

  return [...byWord.values()]
    .filter((s) => s.count >= minCount)
    .toSorted((a, b) => b.count - a.count || a.word.localeCompare(b.word));
}
