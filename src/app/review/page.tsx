import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import recordings from "../../../data/recordings.json";
import { ReviewBoard } from "@/components/ReviewBoard";
import { taxonomyEntries } from "@/lib/keywords";
import { mergePlacements } from "@/lib/placements";
import { reviewQueue } from "@/lib/review";
import { readReviewData, requireDev } from "@/lib/review-files";
import { buildHierarchy, groupTunes } from "@/lib/tunes";
import type { Recording } from "@/lib/types";

export const metadata: Metadata = { title: "Review placements", robots: { index: false } };

async function Queue() {
  // Data comes from disk on each request so a save shows at once.
  await connection();
  const { ai, curated, taxonomy } = await readReviewData();
  const root = buildHierarchy(groupTunes(recordings as Recording[]), taxonomy, mergePlacements(ai, curated));
  const paths = taxonomyEntries(taxonomy).map((e) => e.path).toSorted();
  return <ReviewBoard groups={reviewQueue(root, ai, curated)} paths={paths} />;
}

export default function ReviewPage() {
  requireDev();
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="font-display text-2xl font-semibold">Review placements</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        AI placements and Unsorted tunes nobody has checked. Saving writes to data/curated.json. Only runs in development.
      </p>
      <Suspense fallback={<p>Loading…</p>}>
        <Queue />
      </Suspense>
    </main>
  );
}
