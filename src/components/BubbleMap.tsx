"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { select } from "d3-selection";
import "d3-transition";
import { zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import useSWR from "swr";
import { filterMatches, formOptions, keyOptions, NO_FILTER, type Filter } from "@/lib/filter";
import { splitKeys } from "@/lib/keys";
import { contextPath, countLabel, wrapLabel } from "@/lib/label";
import { ancestors, childrenIndex, packRecordings, toScreen, zoomTo, type Circle, type LaidOutNode, type View } from "@/lib/layout";
import { bucketShown, sizeBuckets } from "@/lib/lod";
import { clickTarget, viewFocus, type ViewTransform } from "@/lib/navigation";
import { fillClass, recordingFill } from "@/lib/palette";
import { EMPTY_PANEL, forgetClosed, openRows, togglePanel, type Panel } from "@/lib/panel";
import { recordingLabel } from "@/lib/tunes";
import type { Recording } from "@/lib/types";
import { CategoryKey } from "./CategoryKey";
import { RecordingPopover } from "./RecordingPopover";

/** Focused bubble's diameter as a fraction of the window's short side. */
const FILL = 0.92;
const ZOOM_MS = 750;
const CHAR_WIDTH = 0.55;
/** Smallest on-screen radius, in px, that gets a label. */
const MIN_LABEL_RADIUS = 22;
/** Smallest on-screen radius, in px, worth drawing. Most tunes are far below it when zoomed out. */
const MIN_CIRCLE_RADIUS = 1;

const fetchJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
};

/** Hides size buckets too small to see at zoom `k`. Runs every zoom frame, so it writes only what changed. */
function showBuckets(layer: SVGGElement, k: number) {
  for (const g of layer.querySelectorAll<SVGGElement>("g[data-bucket]")) {
    const hidden = String(!bucketShown(Number(g.dataset.bucket), k, MIN_CIRCLE_RADIUS));
    if (g.dataset.hidden !== hidden) g.dataset.hidden = hidden;
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Text centered in a circle, sized and wrapped to fit, in layout units under zoom `k`. */
function BubbleLabel({ circle, text, k, large }: { circle: Circle; text: string; k: number; large: boolean }) {
  const r = circle.r * k;
  if (r < MIN_LABEL_RADIUS) return null;
  const fontSize = large ? Math.min(26, Math.max(13, r / 4)) : Math.min(18, Math.max(12, r / 5));
  const lines = wrapLabel(text, Math.floor((1.7 * r) / (fontSize * CHAR_WIDTH)), 3);
  return (
    <text
      x={circle.x}
      y={circle.y}
      textAnchor="middle"
      fontSize={fontSize / k}
      className={`fill-ink stroke-paper/80 [paint-order:stroke] ${large ? "font-display font-semibold" : "font-medium"}`}
      style={{ strokeWidth: 4 / k, strokeLinejoin: "round" }}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={circle.x} dy={i === 0 ? `${0.35 - (lines.length - 1) * 0.6}em` : "1.2em"}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export function BubbleMap({ nodes }: { nodes: LaidOutNode[] }) {
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const children = useMemo(() => childrenIndex(nodes), [nodes]);
  const buckets = useMemo(() => sizeBuckets(nodes), [nodes]);
  const rootId = nodes[0].id;

  const svgRef = useRef<SVGSVGElement>(null);
  const layerRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown>>(null);

  const [view, setView] = useState<View | null>(null);
  const [transform, setTransform] = useState<ViewTransform>({ k: 1, x: 0, y: 0 });
  const [focusId, setFocusId] = useState(rootId);
  const [recordingIndex, setRecordingIndex] = useState<number | null>(null);
  const [panel, setPanel] = useState<Panel>(EMPTY_PANEL);
  // Set only by deliberate navigation, so the key panel scrolls to the focus then and not after every drag.
  const [reveal, setReveal] = useState<{ id: string } | null>(null);
  const [filter, setFilter] = useState<Filter>(NO_FILTER);
  const keys = useMemo(() => keyOptions(nodes), [nodes]);
  const forms = useMemo(() => formOptions(nodes), [nodes]);
  const matches = useMemo(() => filterMatches(nodes, filter), [nodes, filter]);

  const focus = byId.get(focusId)!;
  const expanded = useMemo(() => openRows(byId, focusId, panel), [byId, focusId, panel]);
  const { data: recordings, error: recordingsError } = useSWR<Recording[]>(
    focus.slug ? `/api/tunes/${focus.slug}` : null,
    fetchJson,
  );
  const recordingCircles = useMemo(
    () => (focus.slug && recordings ? packRecordings(focus, recordings.length) : []),
    [focus, recordings],
  );

  function changeFocus(id: string) {
    if (id === focusId) return;
    setRecordingIndex(null);
    setFocusId(id);
    setPanel(forgetClosed);
  }

  function focusOn(id: string, animate = true) {
    const svg = svgRef.current;
    const behavior = zoomRef.current;
    if (!svg || !behavior || !view) return;
    changeFocus(id);
    setReveal({ id });
    const z = zoomTo(byId.get(id)!, view, FILL);
    setTransform({ k: z.k, x: z.tx, y: z.ty });
    const target = zoomIdentity.translate(z.tx, z.ty).scale(z.k);
    if (animate && !prefersReducedMotion()) select(svg).transition().duration(ZOOM_MS).call(behavior.transform, target);
    else select(svg).call(behavior.transform, target);
  }

  function toggle(id: string) {
    setPanel((p) => togglePanel(p, id, expanded.has(id)));
  }

  // Track the window-filling svg's size.
  useEffect(() => {
    const svg = svgRef.current!;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setView({ width, height });
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  // The popover is placed for a fixed transform; a user gesture moves the map out from under it.
  const onGestureStart = useEffectEvent(() => setRecordingIndex(null));

  // A gesture (wheel, pinch, drag) ended: recompute what is in focus from where the user is looking.
  const onGestureEnd = useEffectEvent((t: ViewTransform) => {
    setTransform({ k: t.k, x: t.x, y: t.y });
    if (view) changeFocus(viewFocus(nodes, t, view));
  });

  useEffect(() => {
    // Programmatic zooms have no sourceEvent; focusOn already set the focus.
    const behavior = zoom<SVGSVGElement, unknown>()
      .on("start", (e) => {
        if (e.sourceEvent) onGestureStart();
      })
      .on("zoom", (e) => {
        const layer = layerRef.current;
        if (!layer) return;
        layer.setAttribute("transform", e.transform.toString());
        showBuckets(layer, e.transform.k);
      })
      .on("end", (e) => {
        if (e.sourceEvent) onGestureEnd(e.transform);
      });
    zoomRef.current = behavior;
    // Double-click/tap would fight our own click handling.
    select(svgRef.current!).call(behavior).on("dblclick.zoom", null);
  }, []);

  // Zoom limits depend on the window size; refit the focus whenever the window changes.
  const onResize = useEffectEvent(() => {
    const behavior = zoomRef.current;
    if (!behavior || !view) return;
    const short = Math.min(view.width, view.height);
    const minR = nodes.reduce((m, n) => Math.min(m, n.r), Infinity);
    // Deepest zoom: a recording inside the smallest tune can still fill the screen.
    behavior.scaleExtent([(0.5 * short) / (2 * nodes[0].r), (8 * short) / (2 * minR)]);
    focusOn(focusId, false);
  });
  useEffect(() => {
    if (view) onResize();
  }, [view]);

  function onClick(e: React.MouseEvent<SVGSVGElement>) {
    const target = e.target as Element;
    const recording = target.closest<SVGCircleElement>("circle[data-recording]")?.dataset.recording;
    if (recording !== undefined) {
      const index = Number(recording);
      setRecordingIndex((current) => (current === index ? null : index));
      return;
    }
    setRecordingIndex(null);
    const hit = target.closest<SVGCircleElement>("circle[data-id]")?.dataset.id;
    focusOn(clickTarget(byId, hit ?? rootId, focusId));
  }

  // 17k circles in size buckets: rebuilt only when the music key changes, never on focus or zoom; the zoom handler hides
  // buckets too small to see. Circles outside the key fade.
  const circles = useMemo(
    () =>
      buckets.map(([b, members]) => (
        <g key={b} data-bucket={b} className="data-[hidden=true]:hidden">
          {members.map((n) => (
            <circle key={n.id} data-id={n.id} data-dim={matches !== null && !matches.has(n.id)} cx={n.x} cy={n.y} r={n.r} className={fillClass(n)} />
          ))}
        </g>
      )),
    [buckets, matches],
  );

  const trail = ancestors(byId, focusId);
  const k = transform.k;
  const selected = recordingIndex !== null && recordings ? recordings[recordingIndex] : null;
  const selectedCircle = recordingIndex !== null ? recordingCircles[recordingIndex] : undefined;

  return (
    <div className="fixed inset-0 overflow-hidden bg-canvas bg-radial-[at_50%_45%] from-paper to-canvas">
      <svg
        ref={svgRef}
        className="h-full w-full touch-none select-none"
        onClick={onClick}
        role="img"
        aria-label={`Bubble map of old-time tunes, focused on ${focus.name}. Use the tune key to navigate by keyboard.`}
      >
        {/* Circles render only once the size is known, so the server sends no 12k-circle markup. */}
        {view && (
          <g ref={layerRef}>
            <g className="[&_circle]:cursor-pointer [&_circle]:stroke-edge [&_circle]:stroke-[1.25px] [&_circle]:[vector-effect:non-scaling-stroke] [&_circle:hover]:stroke-accent [&_circle:hover]:stroke-2 [&_circle[data-dim=true]]:opacity-20">
              {circles}
              {recordingCircles.map((c, i) => (
                <circle
                  key={i}
                  data-recording={i}
                  data-dim={filter.key !== null && recordings !== undefined && !splitKeys(recordings[i].key).includes(filter.key)}
                  cx={c.x}
                  cy={c.y}
                  r={c.r}
                  className={recordingFill(focus)}
                />
              ))}
            </g>
            {selectedCircle && (
              <circle
                cx={selectedCircle.x}
                cy={selectedCircle.y}
                r={selectedCircle.r}
                className="pointer-events-none fill-none stroke-accent stroke-[3px] [vector-effect:non-scaling-stroke]"
              />
            )}
            <g className="pointer-events-none">
              {focus.slug
                ? recordings
                  ? recordingCircles.map((c, i) => <BubbleLabel key={i} circle={c} text={recordingLabel(recordings[i])} k={k} large={false} />)
                  : <BubbleLabel circle={focus} text={recordingsError ? "Couldn't load recordings" : "Loading recordings…"} k={k} large={false} />
                : (children.get(focusId) ?? []).map((n) => (
                    <BubbleLabel key={n.id} circle={n} text={n.name} k={k} large={n.kind !== "tune"} />
                  ))}
            </g>
          </g>
        )}
      </svg>

      <div className="absolute left-1/2 top-3 flex w-max max-w-[calc(100%-1.5rem)] -translate-x-1/2 flex-col items-center gap-2">
        <nav
          aria-label="Breadcrumb"
          className="glass flex flex-wrap items-center gap-0.5 rounded-full px-2 py-1 text-[15px]"
        >
          {trail.map((n, i) => (
            <span key={n.id} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden className="text-muted/60">›</span>}
              <button
                type="button"
                onClick={() => focusOn(n.id)}
                className="rounded-full px-2.5 py-1 text-muted transition-colors hover:bg-ink/8 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent aria-[current=true]:bg-ink/6 aria-[current=true]:font-semibold aria-[current=true]:text-ink motion-reduce:transition-none"
                aria-current={n.id === focusId}
              >
                {n.name}
                {n.id === focusId && <span className="font-normal text-muted"> · {countLabel(n, matches)}</span>}
              </button>
            </span>
          ))}
        </nav>
        {focus.alsoIn && (
          <nav
            aria-label="Also under"
            className="glass flex flex-wrap items-center gap-1 rounded-full px-3 py-1 text-sm"
          >
            <span className="text-muted">Also under</span>
            {focus.alsoIn.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => focusOn(id)}
                className="link rounded-full px-2 py-0.5 hover:bg-accent/10"
              >
                {[contextPath(byId, id), byId.get(id)!.name].filter(Boolean).join(" › ")}
              </button>
            ))}
          </nav>
        )}
      </div>

      <CategoryKey
        nodes={nodes}
        childrenOf={children}
        byId={byId}
        focusId={focusId}
        expanded={expanded}
        reveal={reveal}
        matches={matches}
        keyOptions={keys}
        formOptions={forms}
        filter={filter}
        onFilter={setFilter}
        onToggle={toggle}
        onFocus={(id) => focusOn(id)}
      />

      {selected && selectedCircle && view && (
        <RecordingPopover
          tune={focus}
          recording={selected}
          anchor={toScreen(selectedCircle, transform)}
          view={view}
          onClose={() => setRecordingIndex(null)}
        />
      )}
    </div>
  );
}
