import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

/** Supabase client for a signed-in admin; anyone else is sent to the sign-in page. Call from every admin page and action. */
export async function requireAdmin() {
  const supabase = await createClient();
  // getClaims verifies the token signature; getSession would trust the cookie as is.
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError) throw authError;
  const userId = auth?.claims.sub;
  if (!userId) redirect("/admin/login");

  const { data: admin, error } = await supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!admin) redirect("/admin/login?error=not-admin");
  return supabase;
}
