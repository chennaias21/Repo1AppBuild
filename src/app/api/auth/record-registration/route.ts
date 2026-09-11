import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendRegistrationEmail } from "@/lib/email";
import { syncRegistrationToSheet } from "@/lib/sheets";

/**
 * Sends the registration email and writes the admin tracking-sheet row, once per
 * user. Called in the background from the dashboard rather than during sign-in,
 * because both of those calls reach slow third parties and must never make a
 * person wait to get into their account.
 *
 * Safe to call repeatedly: the sync log is the idempotency guard.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("sheets_sync_log")
    .select("id")
    .eq("user_id", user.id)
    .eq("event_type", "registration")
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ ok: true, alreadyRecorded: true });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, mobile, access_status, created_at")
    .eq("id", user.id)
    .single();

  try {
    if (user.email) await sendRegistrationEmail(user.email, profile?.full_name ?? "");
  } catch {
    // Non-fatal — the account works whether or not this email is delivered.
  }

  await syncRegistrationToSheet(
    {
      name: profile?.full_name ?? "",
      email: user.email ?? "",
      mobile: profile?.mobile ?? "",
      registrationDate: profile?.created_at ?? new Date().toISOString(),
      paymentStatus: "none",
      paymentId: "",
      paymentDate: "",
      accessStatus: profile?.access_status ?? "free",
    },
    user.id,
    "registration"
  );

  return NextResponse.json({ ok: true });
}
