import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

/** Server-only. Reads the signed-in user's profile straight from the DB — never trust a client-supplied flag. */
export async function getCurrentProfile(): Promise<{ userId: string; profile: Profile } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return { userId: user.id, profile: profile as Profile };
}

export async function hasFullAccess(): Promise<boolean> {
  const current = await getCurrentProfile();
  return current?.profile.access_status === "paid";
}
