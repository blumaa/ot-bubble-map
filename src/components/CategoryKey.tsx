"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import type { FacetOption, Filter } from "@/lib/filter";
import { FeedbackDialog } from "./FeedbackDialog";
import { contextPath, countLabel, nodeCount, plural } from "@/lib/label";
import type { LaidOutNode } from "@/lib/layout";
import { searchNodes } from "@/lib/navigation";
import { SITE_NAME } from "@/lib/site";

const MAX_RESULTS = 50;

interface Tree {
  childrenOf: Map<string, LaidOutNode[]>;
  focusId: string;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onFocus: (id: string) => void;
  /** Tunes passing the filter, with counts per group; null when nothing is chosen. */
  matches: Map<string, number> | null;
}

interface Props extends Tree {
  nodes: LaidOutNode[];
  byId: Map<string, LaidOutNode>;
  keyOptions: FacetOption[];
  formOptions: FacetOption[];
  filter: Filter;
  onFilter: (filter: Filter) => void;
  /** Row to scroll into view; a new object each time the user navigates, even to the same row. */
  reveal: { id: string } | null;
}

const ROW =
  "min-w-0 flex-1 rounded-lg px-2 py-1 text-left transition-colors hover:bg-ink/6 focus-visible:outline-2 focus-visible:outline-accent aria-[current=true]:bg-accent/15 aria-[current=true]:font-semibold motion-reduce:transition-none";
const COUNT = "ml-1.5 text-sm tabular-nums text-muted";

/** Children of a node that survive the filter. */
function visibleChildren(tree: Tree, id: string): LaidOutNode[] {
  const children = tree.childrenOf.get(id) ?? [];
  return tree.matches ? children.filter((c) => tree.matches!.has(c.id)) : children;
}

function Row({ node, tree }: { node: LaidOutNode; tree: Tree }) {
  const { focusId, expanded, onToggle, onFocus, matches } = tree;
  const isTune = node.kind === "tune";
  const isOpen = expanded.has(node.id);
  return (
    <li>
      <div className="flex items-center gap-1">
        {isTune ? (
          <span className="w-6 shrink-0" />
        ) : (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            aria-expanded={isOpen}
            aria-label={`${isOpen ? "Collapse" : "Expand"} ${node.name}`}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs text-muted transition hover:bg-ink/8 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent aria-expanded:rotate-90 motion-reduce:transition-none"
          >
            ▸
          </button>
        )}
        <button type="button" data-row={node.id} onClick={() => onFocus(node.id)} aria-current={node.id === focusId} className={`${ROW} truncate`}>
          {node.name}
          <span className={COUNT}>{nodeCount(node, matches)}</span>
        </button>
      </div>
      {!isTune && isOpen && (
        <ul className="ml-3 border-l border-line pl-1">
          {visibleChildren(tree, node.id).map((k) => (
            <Row key={k.id} node={k} tree={tree} />
          ))}
        </ul>
      )}
    </li>
  );
}

function FacetSelect({ label, all, options, value, onChange }: { label: string; all: string; options: FacetOption[]; value: string | null; onChange: (value: string | null) => void }) {
  const id = useId();
  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} className="field">
        <option value="">{all}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.value} ({plural(o.tunes, "tune")})
          </option>
        ))}
      </select>
    </div>
  );
}

/** Floating key: music key and tune form filters, search, and a group > keyword > tune tree. Choosing a row zooms the map there. */
export function CategoryKey({ nodes, byId, keyOptions, formOptions, filter, onFilter, matches, reveal, ...rest }: Props) {
  const tree: Tree = { ...rest, matches };
  const treeRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(
    () => searchNodes(matches ? nodes.filter((n) => matches.has(n.id)) : nodes, deferredQuery, MAX_RESULTS),
    [nodes, matches, deferredQuery],
  );
  const searchId = useId();
  const root = nodes[0];

  // Runs after the commit that opened the path, so the row exists by now.
  useEffect(() => {
    if (reveal) treeRef.current?.querySelector(`[data-row="${reveal.id}"]`)?.scrollIntoView({ block: "nearest" });
  }, [reveal]);

  return (
    <aside className="glass absolute left-3 top-16 flex max-h-[calc(100%-5rem)] w-80 max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-3xl text-[15px]">
      <header className="flex items-start justify-between gap-2 px-4 pb-3 pt-4">
        <div>
          <h1 className="font-display text-xl font-semibold leading-tight">{SITE_NAME}</h1>
          <p className="mt-0.5 text-sm text-muted">
            {countLabel(root, matches)} from{" "}
            <a href="https://www.slippery-hill.com/" className="link" target="_blank" rel="noopener">
              Slippery-Hill
            </a>
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          <FeedbackDialog triggerLabel="Send feedback" triggerClassName="button-ghost">
            ?
          </FeedbackDialog>
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="button-ghost">
            {open ? "Hide" : "Key"}
          </button>
        </div>
      </header>
      {open && (
        <>
          <div className="flex flex-col gap-3 border-y border-line px-4 py-3">
            <div className="flex gap-2">
              <FacetSelect label="Music key" all="All keys" options={keyOptions} value={filter.key} onChange={(key) => onFilter({ ...filter, key })} />
              <FacetSelect label="Tune form" all="All forms" options={formOptions} value={filter.form} onChange={(form) => onFilter({ ...filter, form })} />
            </div>
            <div>
              <label htmlFor={searchId} className="field-label">
                Search tunes and categories
              </label>
              <input
                id={searchId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Old Coon Dog"
                className="field"
              />
            </div>
          </div>
          {query.trim() ? (
            <div className="overflow-y-auto overscroll-contain px-2 py-2">
              <p role="status" className="px-2 pb-1 text-sm text-muted">
                {results.length === 0
                  ? "No matches"
                  : results.length === MAX_RESULTS
                    ? `First ${MAX_RESULTS} matches`
                    : `${results.length} ${results.length === 1 ? "match" : "matches"}`}
              </p>
              <ul>
                {results.map((n) => {
                  const path = contextPath(byId, n.id);
                  return (
                    <li key={n.id}>
                      <button type="button" onClick={() => tree.onFocus(n.id)} aria-current={n.id === tree.focusId} className={`${ROW} w-full`}>
                        <span className="block truncate">
                          {n.name}
                          <span className={COUNT}>{countLabel(n, matches)}</span>
                        </span>
                        {path && <span className="block truncate text-sm font-normal text-muted">{path}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <ul ref={treeRef} className="overflow-y-auto overscroll-contain px-2 py-2">
              {visibleChildren(tree, root.id).map((c) => (
                <Row key={c.id} node={c} tree={tree} />
              ))}
            </ul>
          )}
          <footer className="border-t border-line px-4 py-2 text-right">
            {/* Signed-out visitors land on the sign-in page; a signed-in admin goes straight to the feedback list. */}
            <Link href="/admin/feedback" prefetch={false} className="text-sm text-muted underline-offset-3 hover:text-ink hover:underline">
              Admin
            </Link>
          </footer>
        </>
      )}
    </aside>
  );
}
