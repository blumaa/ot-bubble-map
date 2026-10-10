# Categories: rules and proposed taxonomy

Agreed. Phase 1 done: matcher exclusions, Unsorted, new taxonomy, AI first pass. AI placed 1,707 of 3,250 unmatched tunes and added 1,122 keywords (`match: []`, placement only). Nations, peoples and slurs were left Unsorted for a person (rule 7).

## Why change

- 10,278 tunes. 1,224 (12%) placed by a person. Rest placed by single-word title matching, never checked.
- Single words have many senses: "bow" (fiddle, bow-legged, bow wow), "rock" (rhythm, Rock of Ages), "gate" (home, Pearly Gates).
- Taxonomy was shaped to catch matcher output, not to describe subjects:
  - "Words" (1,490 tunes, 15%) groups by grammar: pronouns, colors, numbers. Not a subject.
  - "other" keywords (691 tunes) hold whatever a list missed: Cinda vs Cindy, Melinda, Rachel.
- Build throws if a tune matches nothing, so every tune gets forced into some bucket.

## Rules

1. **A category is what the title is about.** Its subject: a person, place, animal, feeling, event. Not a word in it.
2. **Every category has a one-line definition and an inclusion test** (written under the category in the taxonomy below). If a tune fails the test, it does not go there.
3. **No grammar categories.** Pronouns, colors, numbers, adjectives never decide a category alone. "Blue Eyed Girl" is about a girl.
4. **No "other" buckets.** A list that misses a name gets the name added. Anything without a clear subject goes to **Unsorted**, which is honest and reviewable.
5. **One fixed source for factual lists.** States, regions, nations follow a stated definition, not memory.
6. **The matcher suggests; a person decides.** Every tune is `suggested` or `reviewed`. Only reviewed placements are trusted.
7. **Sensitive terms are always placed by a person.** Ethnic groups, nationalities, slurs, and dialect never auto-file.
8. **Matching is by phrase with exclusions.** A keyword lists what it matches and what it must not: `bow` excludes "bow wow", "bow-legged"; `gate` excludes "pearly gates".
9. **Forms are a filter, not a subject.** Reel, waltz, breakdown stay in the form filter. A tune files under Music or Dance only if the title is about music or dancing ("Dance All Night", "Old Fiddler").
10. **One subject per category.** A name joining two subjects with "&" splits into sibling categories. A name that says one thing twice stays (Cities & Towns, Trains & Railroads). A half with only one keyword sits directly in the parent, with no group of one.
11. **Every fixed mistake becomes a test.** Title plus expected (or forbidden) category, in a golden file. Fixes can't regress.

## Proposed taxonomy

Changes from today in **bold**. Each line: definition / inclusion test.

### Animals
Title is about an animal.
- Birds (barnyard and wild)
- Horses; mule sits directly in Animals
- Livestock
- Dogs; cat sits directly in Animals
- Wild Animals
- **Bugs** / a real insect is the subject.
- Fish; frog, snake, crawdad and mermaid sit directly in Animals

### People
Title is about a person or kind of person.
- **First Names** / a given name. One flat list, no men/women/other split, so spelling variants (Cindy, Cinda) sit together.
- Surnames
- **Historical & Famous People** / a real, named person (Napoleon, Robert E. Lee, Jenny Lind).
- Folks / a kind of person with no role (girl, man, stranger).
- **Occupations** / someone known by their work. Adds blacksmith, carpenter, peddler, etc.
- **Soldiers** / military ranks and roles. Rulers (king, queen) move to **Rulers**.
- **Nations** / a nationality or language (Irishman, Dutchman, French). Always placed by a person (rule 7).
- **Peoples** / an ethnic group or tribe (Cherokee, Indian, Gypsy). Always placed by a person (rule 7).
- **Slurs** / a title that names people by a slur (dago, darkey, squaw). Kept apart from Nations and Peoples so the map names the term honestly. Always placed by a person (rule 7).
- Rounders / gamblers, drunkards, bullies.
- Drifters / hobos, tramps, ramblers.
- Family
- Sweethearts

### Places
Title is about a place.
- **States** / one flat list of US states. No Southern/Other split.
- **Regions** / a named area that is not a state: Dixie, Cumberland, Shenandoah, Flatwoods, Everglades, Pacific Slope, Cajun country.
- Cities & Towns
- Rivers / rivers, creeks, runs, forks, named rivers.
- Waters / sea, lakes, bays, beaches, islands.
- Mountains / mountains, hills, ridges, gaps, named peaks. Hollow, valley and prairie sit directly in Places.
- Farms
- Buildings
- Abroad / a country or place outside the US.
- Vague words (world, land, country, west, south) no longer match on their own.

### Feelings
Title is about an emotion or state of mind. Love (with courting and weddings), Sorrow, Joy, Wildness.

### Dreams, Memories
Their own top-level categories: neither is a feeling.

### Faith
Title is about religion. Heaven (Pearly Gates goes here), Hell, judgement, Holy Names, Bible, Church & Worship.

### Nature
Sky, Weather, Seasons, Times of Day, Plants. Day, Monday and Sunday sit directly in Nature.

### Food, Drink

### Travel
Trains & Railroads, Roads (streets, bridges and ferries too), Wagons, Cars, Boats, Leaving & Rambling.

### Home, Things, Body, Work, Money
Home / a dwelling or its parts, when the home is the subject. Things / a named object. Body.
Work (work, labor, the mill floor). Money: hard times, rich. Two categories, not one: work is not money.

### Music, Dance
Music: title is about music, not just named for a form.
- Instruments / fiddle, banjo, guitar. **No "bow"** alone.
- Singing
- Talk / talking and skits.
- **Rhythm removed.** "Rock", "swing", "shuffle" match too many other senses.

Dance: dancing as the subject ("Dance All Night").

### Life, Death, Crime, War
Life (life, old age, sickness). Death (death, graves, ghosts). Crime (jail, murder, outlaws, convicts, prison terms like "Twenty One Years"). War.

### Unsorted (new)
No clear subject yet. Shown on the map so nothing hides; shrinks as tunes are reviewed.

### Removed
- **Words**: Colors, Descriptions, Numbers, Time, Phrases, Languages. Languages move to Nations; the rest go to their real subject or Unsorted.
- **Every "other" keyword.** Their tunes get curated to a real keyword or go to Unsorted.

## Impact

- ~1,490 Words tunes and ~691 "other" tunes need new homes. Most land in Unsorted first.
- Unsorted then shrinks through review: an AI first pass with these rules, and a person checks low-confidence results.

## First golden tests (from feedback)

| Title | Must not be in | Should be in |
|---|---|---|
| Bow-legged Irishman | Music | People / Nations |
| Bow Wow Blues | Music | Animals / Dogs |
| Rock of Ages | Music | Faith |
| On the Rock Where Moses Stood | Music | Faith |
| Pearly Gates | Home | Faith / Heaven |
| Cinda / Cindy | different groups | same group (First Names) |
| Arkansas, Virginia, Missouri | "Other States" | States |
| Flunky Butt | Phrases | reviewer decides |
| Blacksmith tunes | anything but Occupations | People / Occupations |

## Decisions

1. States: one flat list.
2. Unsorted: visible on the map.
3. Chinch Bug, Snappin' Bug, Thumping Bug: open. Reviewer places them.
4. Review: site admin.
5. AI first pass: run inside Claude Code (no API cost). Output in `data/ai-placements.json`, kept apart from human `data/curated.json`. Precedence: curated, then AI, then matcher.
6. Tunes can be filed in a group itself ("Animals/Birds"), shown beside the group's keyword bubbles. A group matches titles only through its own `match` list; none by default. Self-named stand-in keywords (bird, folks, love, war, unsorted…) were folded into their groups. On a tie, a keyword beats its own group: "My Old Cabin Home" files under cabin, not Home.

## Later (phase 2)

- Admin review queue and a "Wrong category" feedback kind. Needs a storage decision.
