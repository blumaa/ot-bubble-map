import recordings from "../../data/recordings.json";
import { groupTunes } from "./tunes";
import type { Recording } from "./types";

// Built once per server instance, not per request.
const all = recordings as Recording[];
const recordingsByTune = new Map(groupTunes(all).map((t) => [t.slug, t.recordings]));
const recordingByUrl = new Map(all.map((r) => [r.url, r]));

/** Every recording of a tune, or undefined for an unknown slug. */
export function tuneRecordings(slug: string): Recording[] | undefined {
  return recordingsByTune.get(slug);
}

/** One recording by its Slippery-Hill page URL. */
export function recordingAt(url: string): Recording | undefined {
  return recordingByUrl.get(url);
}
