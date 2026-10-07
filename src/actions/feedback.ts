"use server";

import { parseFeedback } from "@/lib/feedback";
import { createClient } from "@/lib/supabase/server";

export type SendFeedbackState = { status: "idle" } | { status: "sent" } | { status: "error"; error: string };

/** Stores visitor feedback. Anyone may send it; only admins can read it back (see the RLS policies). */
export async function sendFeedback(_prev: SendFeedbackState, data: FormData): Promise<SendFeedbackState> {
  const parsed = parseFeedback(data);
  // Bots get the same answer as people so they learn nothing from the honeypot.
  if (parsed.status === "spam") return { status: "sent" };
  if (parsed.status === "invalid") return { status: "error", error: parsed.error };

  const supabase = await createClient();
  // No .select(): visitors may insert but not read, so asking for the new row back would fail RLS.
  const { error } = await supabase.from("feedback").insert(parsed.feedback);
  if (error) {
    console.error("sendFeedback insert failed", error);
    return { status: "error", error: "Sorry, that didn't send. Please try again later." };
  }
  return { status: "sent" };
}
