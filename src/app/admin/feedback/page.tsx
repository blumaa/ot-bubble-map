import type { Metadata } from "next";
import { Suspense } from "react";
import { setResolved, signOut } from "@/actions/admin";
import { requireAdmin } from "@/lib/admin";
import { FEEDBACK_KINDS, type FeedbackKind } from "@/lib/feedback";
import { recordingAt, tuneRecordings } from "@/lib/recordings";
import { recordingLabel, tuneUrl } from "@/lib/tunes";
import { RecordingFacts } from "@/components/RecordingFacts";

export const metadata: Metadata = { title: "Feedback", robots: { index: false } };

const DATE = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

/** The tune and recording a report is about, looked up from the site data so it shows current facts. */
function About({ tuneSlug, recordingUrl }: { tuneSlug: string | null; recordingUrl: string | null }) {
  const recording = recordingUrl ? recordingAt(recordingUrl) : undefined;
  const tune = recording?.tune ?? (tuneSlug ? tuneRecordings(tuneSlug)?.[0]?.tune : undefined);
  if (!tune && !tuneSlug) return null;
  return (
    <section aria-label="About" className="mt-2 rounded-2xl bg-ink/5 p-3">
      <p className="font-semibold">{tune ?? `Unknown tune (${tuneSlug})`}</p>
      {recording && (
        <>
          <p className="text-sm text-muted">{recordingLabel(recording)}</p>
          <RecordingFacts recording={recording} className="mt-2" />
        </>
      )}
    </section>
  );
}

async function FeedbackList() {
  const supabase = await requireAdmin();
  const { data: rows, error } = await supabase.from("feedback").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  if (rows.length === 0) return <p>No feedback yet.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li
          key={row.id}
          data-resolved={row.resolved}
          className="rounded-3xl border border-line bg-paper p-4 shadow-sm data-[resolved=true]:opacity-60"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-muted">
            <span className="font-semibold text-ink">{FEEDBACK_KINDS[row.kind as FeedbackKind] ?? row.kind}</span>
            <time dateTime={row.created_at}>{DATE.format(new Date(row.created_at))}</time>
          </div>
          <About tuneSlug={row.tune_slug} recordingUrl={row.recording_url} />
          <p className="mt-2 whitespace-pre-wrap">{row.message}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {row.tune_slug && (
              <a href={tuneUrl(row.tune_slug)} target="_blank" rel="noopener" className="link">
                All recordings of this tune ↗
              </a>
            )}
            {row.recording_url && (
              <a href={row.recording_url} target="_blank" rel="noopener" className="link">
                Recording ↗
              </a>
            )}
            {row.email && (
              <a href={`mailto:${row.email}`} className="link">
                {row.email}
              </a>
            )}
            <form action={setResolved.bind(null, row.id, !row.resolved)} className="ml-auto">
              <button type="submit" className="button-ghost">
                {row.resolved ? "Reopen" : "Mark resolved"}
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function FeedbackPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-6 flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-semibold">Feedback</h1>
        <form action={signOut}>
          <button type="submit" className="button-ghost">
            Sign out
          </button>
        </form>
      </header>
      <Suspense fallback={<p>Loading…</p>}>
        <FeedbackList />
      </Suspense>
    </main>
  );
}
