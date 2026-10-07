// Kinds and limits mirror the checks on public.feedback (supabase/migrations/20261007120000_feedback.sql).

export const FEEDBACK_KINDS = {
  mistake: "Something is wrong",
  missing: "Something is missing",
  idea: "Idea",
  other: "Other",
} as const;

export type FeedbackKind = keyof typeof FEEDBACK_KINDS;

export const FEEDBACK_LIMITS = { message: 2000, email: 254, tuneSlug: 200, recordingUrl: 500 } as const;

/** A row for public.feedback, in its column names. */
export interface Feedback {
  kind: FeedbackKind;
  message: string;
  email: string | null;
  tune_slug: string | null;
  recording_url: string | null;
}

export type ParsedFeedback = { status: "valid"; feedback: Feedback } | { status: "invalid"; error: string } | { status: "spam" };

/** Field a person never sees; bots that fill every input fill it too. */
export const HONEYPOT_FIELD = "website";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(data: FormData, name: string): string | null {
  const value = data.get(name);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isKind(value: string | null): value is FeedbackKind {
  return value !== null && Object.hasOwn(FEEDBACK_KINDS, value);
}

/** Validates the feedback form before it is stored. */
export function parseFeedback(data: FormData): ParsedFeedback {
  if (text(data, HONEYPOT_FIELD)) return { status: "spam" };

  const kind = text(data, "kind");
  const message = text(data, "message");
  const email = text(data, "email");
  const tuneSlug = text(data, "tuneSlug");
  const recordingUrl = text(data, "recordingUrl");

  if (!isKind(kind)) return { status: "invalid", error: "Please choose what kind of feedback this is." };
  if (!message) return { status: "invalid", error: "Please write a message." };
  if (message.length > FEEDBACK_LIMITS.message) return { status: "invalid", error: `Please keep it under ${FEEDBACK_LIMITS.message} characters.` };
  if (email && (email.length > FEEDBACK_LIMITS.email || !EMAIL.test(email))) return { status: "invalid", error: "That email address doesn't look right." };
  if (tuneSlug && tuneSlug.length > FEEDBACK_LIMITS.tuneSlug) return { status: "invalid", error: "Unknown tune." };
  if (recordingUrl && (recordingUrl.length > FEEDBACK_LIMITS.recordingUrl || !recordingUrl.startsWith("https://"))) {
    return { status: "invalid", error: "Unknown recording." };
  }

  return { status: "valid", feedback: { kind, message, email, tune_slug: tuneSlug, recording_url: recordingUrl } };
}
