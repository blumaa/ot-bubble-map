import { recordingDetails } from "@/lib/tunes";
import type { Recording } from "@/lib/types";

/** The known facts about a recording (who played it, key, tuning, ...) as a definition list. */
export function RecordingFacts({ recording, className = "" }: { recording: Recording; className?: string }) {
  return (
    <dl className={`grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm ${className}`}>
      {recordingDetails(recording).map(([term, value]) => (
        <div key={term} className="contents">
          <dt className="text-muted">{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
