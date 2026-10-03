import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Lightweight sign-in check for the header. Never returns anything beyond a name. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ signedIn: false, name: null }, { headers: { "Cache-Control": "no-store" } });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return NextResponse.json(
    { signedIn: true, name: profile?.full_name ?? null },
    { headers: { "Cache-Control": "no-store" } }
  );
}
