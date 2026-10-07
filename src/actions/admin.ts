"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export type SignInState = { status: "idle" } | { status: "error"; error: string };

/** Signs an existing account in with email and password, then opens the feedback list. Nobody can sign up here. */
export async function signIn(_prev: SignInState, data: FormData): Promise<SignInState> {
  const email = String(data.get("email") ?? "").trim();
  const password = String(data.get("password") ?? "");
  if (!email || !password) return { status: "error", error: "Please enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  // Same answer for an unknown email and a wrong password, so the form does not reveal who has an account.
  if (error?.code === "invalid_credentials") return { status: "error", error: "Wrong email or password." };
  if (error) {
    console.error("signIn failed", error);
    return { status: "error", error: error.message };
  }
  redirect("/admin/feedback");
}

export async function setResolved(id: number, resolved: boolean) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("feedback").update({ resolved }).eq("id", id);
  if (error) throw error;
  refresh();
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  redirect("/admin/login");
}
