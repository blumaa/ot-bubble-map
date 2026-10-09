"use client";

import { useDeferredValue, useState, useTransition } from "react";
import { saveDecisions } from "@/actions/review";
import type { Decision, QueueGroup } from "@/lib/review";
import { tuneUrl, UNSORTED_PATH } from "@/lib/tunes";

const PATHS_LIST = "taxonomy-paths";

interface Props {
  groups: QueueGroup[];
  /** Every group and keyword path, for autocomplete. */
  paths: string[];
}

/** Groups whose path, or tunes whose title, contain the query. */
function filterGroups(groups: QueueGroup[], query: string): QueueGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups.flatMap((g) => {
    if (g.path.toLowerCase().includes(q)) return [g];
    const tunes = g.tunes.filter((t) => t.title.toLowerCase().includes(q));
    return tunes.length > 0 ? [{ ...g, tunes }] : [];
  });
}

export function ReviewBoard({ groups, paths }: Props) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = (decisions: Decision[]) =>
    startTransition(async () => {
      const result = await saveDecisions(decisions);
      setError(result.ok ? null : result.error);
    });

  const shown = filterGroups(groups, deferredQuery);
  const total = groups.reduce((n, g) => n + g.tunes.length, 0);

  return (
    <div aria-busy={pending}>
      <datalist id={PATHS_LIST}>
        {paths.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>

      <div className="sticky top-0 z-10 -mx-4 mb-4 flex flex-wrap items-center gap-3 bg-canvas/90 px-4 py-3 backdrop-blur">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by path or title"
          aria-label="Filter by path or title"
          className="field max-w-sm"
        />
        <span className="text-sm text-muted">
          {total} tunes in {groups.length} categories left{pending ? " · saving…" : ""}
        </span>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-2xl border border-danger/40 px-4 py-3 text-danger">
          {error}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {shown.map((group) => (
          <GroupCard key={group.path} group={group} open={deferredQuery.trim() !== ""} disabled={pending} onSave={save} />
        ))}
      </ul>
    </div>
  );
}

interface CardProps {
  group: QueueGroup;
  open: boolean;
  disabled: boolean;
  onSave: (decisions: Decision[]) => void;
}

function GroupCard({ group, open, disabled, onSave }: CardProps) {
  const unsorted = group.path === UNSORTED_PATH;
  return (
    <li className="rounded-2xl border border-line bg-paper shadow-sm">
      {/* Remount on filter change so filtered groups start open and the full list starts closed. */}
      <details key={String(open)} open={open}>
        <summary className="flex cursor-pointer items-center gap-3 px-4 py-3">
          <span className="font-semibold">{group.path}</span>
          <span className="text-sm text-muted">{group.tunes.length}</span>
          {!unsorted && (
            <button
              type="button"
              disabled={disabled}
              onClick={(e) => {
                e.preventDefault(); // A click inside <summary> would also toggle the group.
                onSave(group.tunes.map((t) => ({ slug: t.slug, path: group.path })));
              }}
              className="button-primary ml-auto text-sm"
            >
              Approve all
            </button>
          )}
        </summary>
        <ul className="flex flex-col divide-y divide-line border-t border-line">
          {group.tunes.map((tune) => (
            <li key={tune.slug}>
              <form
                action={(data) => {
                  const intent = data.get("intent");
                  onSave([{ slug: tune.slug, path: intent === "unsorted" ? UNSORTED_PATH : String(data.get("path")) }]);
                }}
                className="flex flex-wrap items-center gap-2 px-4 py-2"
              >
                <a href={tuneUrl(tune.slug)} target="_blank" rel="noopener" className="link min-w-40 flex-1">
                  {tune.title}
                </a>
                <input
                  name="path"
                  list={PATHS_LIST}
                  defaultValue={unsorted ? "" : group.path}
                  placeholder="Group/Subgroup or Group/keyword"
                  aria-label={`Path for ${tune.title}`}
                  required
                  className="field max-w-xs py-1 text-sm"
                />
                <button type="submit" name="intent" value="save" disabled={disabled} className="button-ghost">
                  {unsorted ? "Place" : "Approve"}
                </button>
                <button type="submit" name="intent" value="unsorted" disabled={disabled} formNoValidate className="button-ghost">
                  {unsorted ? "Keep unsorted" : "Unsorted"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}
