"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { Circle, LaidOutNode, View } from "@/lib/layout";
import { popoverPlacement } from "@/lib/navigation";
import { FeedbackDialog } from "./FeedbackDialog";
import { RecordingFacts } from "./RecordingFacts";
import { recordingLabel, tuneUrl } from "@/lib/tunes";
import type { Recording } from "@/lib/types";

interface Props {
  tune: LaidOutNode;
  recording: Recording;
  /** The recording's bubble, in screen pixels. */
  anchor: Circle;
  view: View;
  onClose: () => void;
}

/** Details and Slippery-Hill links for one recording, placed next to its bubble. */
export function RecordingPopover({ tune, recording, anchor, view, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  // Placement needs the rendered size; measure before paint so it never shows misplaced.
  useLayoutEffect(() => {
    const { width, height } = ref.current!.getBoundingClientRect();
    setSize({ width, height });
  }, [recording]);

  // Move keyboard focus into the popover when it opens.
  useEffect(() => {
    ref.current!.focus();
  }, [recording]);

  const position = size ? popoverPlacement(anchor, size, view) : { left: 0, top: 0 };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      style={{ left: position.left, top: position.top }}
      className="glass absolute w-80 max-w-[calc(100%-1rem)] rounded-3xl p-5 text-base outline-none data-[measured=false]:invisible"
      data-measured={size !== null}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{tune.name}</p>
          <h2 id={titleId} className="font-display text-xl font-semibold leading-snug">
            {recordingLabel(recording)}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="button-ghost -mr-1 -mt-1 text-base leading-none"
        >
          ✕
        </button>
      </div>
      <RecordingFacts recording={recording} className="mt-3" />
      <div className="mt-4 flex flex-col gap-2">
        <a
          href={recording.url}
          target="_blank"
          rel="noopener"
          className="button-primary"
        >
          Listen on Slippery-Hill ↗
        </a>
        <a
          href={tuneUrl(tune.slug!)}
          target="_blank"
          rel="noopener"
          className="link text-center text-sm"
        >
          All recordings of this tune ↗
        </a>
        <FeedbackDialog
          recording={recording}
          triggerLabel="Report a problem with this recording"
          triggerClassName="text-center text-sm font-medium text-muted underline-offset-3 hover:text-ink hover:underline"
        >
          Report a problem
        </FeedbackDialog>
      </div>
    </div>
  );
}
