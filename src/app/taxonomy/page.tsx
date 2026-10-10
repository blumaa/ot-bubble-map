import type { Metadata } from "next";
import Link from "next/link";
import aiPlacements from "../../../data/ai-placements.json";
import categoriesData from "../../../data/categories.json";
import curated from "../../../data/curated.json";
import recordings from "../../../data/recordings.json";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import type { Group } from "@/lib/keywords";
import { placements, type Placements } from "@/lib/placements";
import { SITE_NAME } from "@/lib/site";
import { groupSummaries, placementCounts, tunePaths, type GroupSummary } from "@/lib/taxonomy-summary";
import { buildHierarchy, groupTunes } from "@/lib/tunes";
import type { Recording } from "@/lib/types";

export const metadata: Metadata = {
  title: "How tunes are sorted",
  description: "The categories behind the map and how each old-time tune title is placed in one.",
};

const EXAMPLES_PER_GROUP = 6;

const number = (n: number) => n.toLocaleString("en-US");
const percent = (n: number, total: number) => `${Math.round((n / total) * 100)}%`;

const PRINCIPLES: [string, string][] = [
  ["A category is what the title is about.", "Its subject: a person, place, animal, feeling or event. Not just a word in it."],
  ["No grammar categories.", "Colors, numbers, pronouns and adjectives never decide a category alone. “Blue Eyed Girl” is about a girl."],
  ["No “other” buckets.", "A list that misses a name gets the name added. A title with no clear subject goes to Unsorted, where it can be seen and reviewed."],
  ["One subject per category.", "Food and Drink are two categories, not one. A name that says one thing twice stays, like Cities & Towns. A lone keyword sits in its parent instead of a group of one."],
  ["Forms are a filter, not a subject.", "Reel, waltz and breakdown are in the form filter. A tune sits under Music or Dance only if the title is about music or dancing."],
  ["Sensitive names are placed by a person.", "Nationalities, ethnic groups and slurs never file automatically. Slurs are kept in their own group so the map names them honestly."],
  ["Every fixed mistake becomes a test.", "When a tune is found in the wrong place, the title and its right category are added to the test suite, so the fix can't quietly come undone."],
];

const MATCHING_EXAMPLES: [string, string][] = [
  ["Phrases, not single words", "“Sally Ann” matches as a name; a keyword lists every spelling it accepts, so Cindy and Cinda sit together."],
  ["Exclusions", "bow skips “Bow Wow” and “Bow-legged”; gate skips “Pearly Gates”, which belongs to Heaven."],
  ["Subjects beat descriptions", "A noun outranks a describing word: “Lonesome Road” is filed under the road, with a link from lonesome."],
  ["Specific beats general", "A keyword beats its own group on a tie: “My Old Cabin Home” goes to cabin, not Home."],
];

function GroupRow({ group }: { group: GroupSummary }) {
  return (
    <li className="flex flex-col gap-0.5 py-2">
      <span className="flex items-baseline justify-between gap-3">
        <span className="font-medium">{group.name}</span>
        <span className="shrink-0 text-sm tabular-nums text-muted">{number(group.tunes)} tunes</span>
      </span>
      {group.examples.length > 0 && <span className="text-sm text-muted">{group.examples.join(", ")}</span>}
    </li>
  );
}

function TopGroup({ group }: { group: GroupSummary }) {
  const subgroups = group.children.filter((c) => c.tunes > 0);
  return (
    <li className="rounded-2xl border border-line bg-paper shadow-sm">
      <details>
        <summary className="flex cursor-pointer items-baseline gap-3 px-4 py-3">
          <span className="font-display text-lg font-semibold">
            {group.emoji && <span aria-hidden="true">{group.emoji} </span>}
            {group.name}
          </span>
          <span className="ml-auto shrink-0 text-sm tabular-nums text-muted">
            {number(group.tunes)} tunes · {number(group.keywords)} keywords
          </span>
        </summary>
        <div className="border-t border-line px-4 pb-3">
          {subgroups.length > 0 ? (
            <ul className="divide-y divide-line">
              {subgroups.map((sub) => (
                <GroupRow key={sub.name} group={sub} />
              ))}
            </ul>
          ) : (
            <p className="pt-3 text-sm text-muted">Tunes with no clear subject yet, waiting for a person to place them.</p>
          )}
        </div>
      </details>
    </li>
  );
}

export default function TaxonomyPage() {
  const taxonomy = categoriesData.categories as Group[];
  const paths = tunePaths(buildHierarchy(groupTunes(recordings as Recording[]), taxonomy, placements));
  const counts = placementCounts(paths, aiPlacements as Placements, curated as Placements);
  const groups = groupSummaries(taxonomy, paths, EXAMPLES_PER_GROUP);

  const sources: [string, number, string][] = [
    ["Title matching", counts.matcher, "Words in the title matched a keyword."],
    ["AI suggestion", counts.ai, "An AI model (Claude) placed a title the matcher couldn't. Waiting for a person to check."],
    ["Placed by a person", counts.person, "Chosen or confirmed by hand. Always wins."],
    ["Unsorted", counts.unsorted, "No clear subject yet."],
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link href="/" className="link text-sm">
        ← Back to the map
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold">How tunes are sorted</h1>
      <p className="mt-3 text-lg text-muted">
        {SITE_NAME} groups {number(counts.total)} old-time tunes by what their titles are about: animals, people,
        places, feelings and more. This page explains the categories and how each tune lands in one.
      </p>

      <section className="mt-10">
        <h2 className="mb-3 font-display text-2xl font-semibold">Why titles?</h2>
        <p className="mb-3">
          Old-time tunes are usually catalogued by key, tuning, form, region or the fiddler who played them. Those are in
          the map’s filters. But the titles tell their own story: mules and possums, sweethearts and soldiers, rivers,
          trains and whiskey. We looked for an existing scheme that sorts tune titles by subject and didn’t find one.
          The nearest relatives sort song lyrics: G. Malcolm Laws’ ballad indexes (war, sailors, outlaws, lovers…) and
          Stith Thompson’s Motif-Index of Folk-Literature. So this taxonomy is our own, built from the titles up.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-display text-2xl font-semibold">Principles</h2>
        <ol className="flex list-decimal flex-col gap-2 pl-6">
          {PRINCIPLES.map(([rule, why]) => (
            <li key={rule}>
              <span className="font-semibold">{rule}</span> {why}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-display text-2xl font-semibold">How a tune is placed</h2>
        <p className="mb-4">
          Categories are groups (Animals › Birds) holding keywords (owl, rooster, whippoorwill). Every tune sits in exactly
          one place, a keyword or a group, and links to up to three others its title also fits. Three sources decide
          where, and the first that has an answer wins:
        </p>
        <ol className="mb-6 flex list-decimal flex-col gap-2 pl-6">
          <li>
            <span className="font-semibold">A person.</span> Anyone reviewing a tune can place it by hand, and that choice
            beats everything else.
          </li>
          <li>
            <span className="font-semibold">An AI suggestion.</span> For titles the matcher couldn’t place, an AI model
            proposed a category under the same principles. Its suggestions are kept apart from a person’s choices and
            are checked one by one. It never places nationalities, ethnic groups or slurs.
          </li>
          <li>
            <span className="font-semibold">The title matcher.</span> Each keyword lists the words and phrases it matches
            and the ones it must not. A title matching several goes to the strongest: subjects first, then describing
            words.
          </li>
        </ol>
        <dl className="mb-6 grid gap-3 sm:grid-cols-2">
          {MATCHING_EXAMPLES.map(([term, example]) => (
            <div key={term} className="rounded-2xl border border-line bg-paper p-4">
              <dt className="font-semibold">{term}</dt>
              <dd className="mt-1 text-sm text-muted">{example}</dd>
            </div>
          ))}
        </dl>
        <p className="mb-3">Where the {number(counts.total)} tunes stand today:</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {sources.map(([label, n, what]) => (
            <li key={label} className="rounded-2xl border border-line bg-paper p-4">
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{label}</span>
                <span className="tabular-nums">
                  {number(n)} <span className="text-sm text-muted">({percent(n, counts.total)})</span>
                </span>
              </span>
              <span className="mt-1 block text-sm text-muted">{what}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="mb-1 font-display text-2xl font-semibold">The categories</h2>
        <p className="mb-4 text-sm text-muted">Open a group to see its parts and their busiest keywords.</p>
        <ul className="flex flex-col gap-2">
          {groups.map((group) => (
            <TopGroup key={group.name} group={group} />
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-display text-2xl font-semibold">Spotted a tune in the wrong place?</h2>
        <p className="mb-4">
          Tell us where it is and where it belongs. Every correction is placed by a person and becomes a test, so the map
          gets a little more right each time.
        </p>
        <FeedbackDialog triggerLabel="Send feedback" triggerClassName="button-primary">
          Send feedback
        </FeedbackDialog>
      </section>
    </main>
  );
}
