"use client";

import { startTransition, useActionState, useId, useRef, useState, type ReactNode } from "react";
import { sendFeedback, type SendFeedbackState } from "@/actions/feedback";
import { FEEDBACK_KINDS, FEEDBACK_LIMITS, HONEYPOT_FIELD } from "@/lib/feedback";
import { recordingLabel } from "@/lib/tunes";
import type { Recording } from "@/lib/types";
import { RecordingFacts } from "./RecordingFacts";

const INITIAL: SendFeedbackState = { status: "idle" };

interface Context {
  /** The recording the feedback is about; shown in the form and sent with it. Absent for general feedback. */
  recording?: Recording;
}

interface Props extends Context {
  /** Content of the button that opens the dialog. */
  children: ReactNode;
  triggerLabel: string;
  triggerClassName: string;
}

/** A button that opens a small form for reporting mistakes or ideas; the report lands in the admin feedback list. */
export function FeedbackDialog({ children, triggerLabel, triggerClassName, ...context }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  // Bumped on every open so the form starts empty instead of showing the last result.
  const [opened, setOpened] = useState(0);
  const titleId = useId();

  function open() {
    setOpened((n) => n + 1);
    dialog.current!.showModal();
  }

  return (
    <>
      <button type="button" onClick={open} aria-label={triggerLabel} title={triggerLabel} className={triggerClassName}>
        {children}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        // Keep Escape and clicks here from reaching popovers this dialog sits inside.
        onKeyDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          if (e.target === dialog.current) dialog.current.close();
        }}
        className="glass m-auto w-[28rem] max-w-[calc(100%-2rem)] rounded-3xl p-0 backdrop:bg-ink/25 backdrop:backdrop-blur-sm"
      >
        <FeedbackForm key={opened} titleId={titleId} onClose={() => dialog.current!.close()} {...context} />
      </dialog>
    </>
  );
}

function FeedbackForm({ titleId, onClose, recording }: Context & { titleId: string; onClose: () => void }) {
  const [state, action, pending] = useActionState(sendFeedback, INITIAL);
  const kindId = useId();
  const messageId = useId();
  const emailId = useId();
  const errorId = useId();

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 id={titleId} className="font-display text-xl font-semibold leading-snug">
          {recording ? "Report a problem" : "Send feedback"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="button-ghost -mr-1 -mt-1 text-base leading-none"
        >
          ✕
        </button>
      </div>
      {recording && (
        <section aria-label="About this recording" className="mt-3 rounded-2xl bg-ink/5 p-3">
          <p className="font-semibold">{recording.tune}</p>
          <p className="text-sm text-muted">{recordingLabel(recording)}</p>
          <RecordingFacts recording={recording} className="mt-2" />
        </section>
      )}
      {state.status === "sent" ? (
        <div className="mt-3">
          <p role="status">Thanks! Your feedback was sent.</p>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="button-primary mt-4"
          >
            Done
          </button>
        </div>
      ) : (
        <form
          // Submitting through onSubmit, not action={...}, so React does not clear what was typed when sending fails.
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            startTransition(() => action(data));
          }}
          className="mt-3 flex flex-col gap-3" aria-describedby={state.status === "error" ? errorId : undefined}>
          {recording && (
            <>
              <input type="hidden" name="tuneSlug" value={recording.tuneSlug} />
              <input type="hidden" name="recordingUrl" value={recording.url} />
            </>
          )}
          <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>
              Leave this empty
              <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <div>
            <label htmlFor={kindId} className="field-label">
              What kind of feedback?
            </label>
            <select id={kindId} name="kind" required defaultValue="mistake" className="field">
              {Object.entries(FEEDBACK_KINDS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={messageId} className="field-label">
              Message
            </label>
            <textarea id={messageId} name="message" required maxLength={FEEDBACK_LIMITS.message} rows={5} autoFocus className="field" />
          </div>
          <div>
            <label htmlFor={emailId} className="field-label">
              Email <span className="font-normal normal-case tracking-normal">(optional, if you’d like a reply)</span>
            </label>
            <input id={emailId} type="email" name="email" maxLength={FEEDBACK_LIMITS.email} autoComplete="email" className="field" />
          </div>
          {state.status === "error" && (
            <p id={errorId} role="alert" className="text-sm font-medium text-danger">
              {state.error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="button-primary"
          >
            {pending ? "Sending…" : "Send"}
          </button>
        </form>
      )}
    </div>
  );
}
