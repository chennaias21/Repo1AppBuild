import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Polled by the "verifying payment…" screen after Razorpay checkout closes. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("access_status")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ accessStatus: profile?.access_status ?? "free" });
}
