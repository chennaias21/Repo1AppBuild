import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendRegistrationEmail } from "@/lib/email";
import { syncRegistrationToSheet } from "@/lib/sheets";

/**
 * Where the sign-in link in the email lands. Supabase verifies the link on its
 * own domain first, then sends the user here with a one-time `code` which we
 * exchange for a session. This works with Supabase's default email template —
 * nothing has to be customised in the dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=expired_link`);
  }

  await recordRegistrationOnce(data.user.id, data.user.email ?? "");

  return NextResponse.redirect(`${origin}/dashboard`);
}

/**
 * Sends the welcome-to-registration email and writes the admin sheet row, once
 * per user. Uses the existing sync log as the idempotency guard so a second
 * sign-in doesn't re-send or duplicate the row.
 */
async function recordRegistrationOnce(userId: string, email: string) {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("sheets_sync_log")
    .select("id")
    .eq("user_id", userId)
    .eq("event_type", "registration")
    .limit(1);

  if (existing && existing.length > 0) return;

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, mobile, access_status, created_at")
    .eq("id", userId)
    .single();

  try {
    if (email) await sendRegistrationEmail(email, profile?.full_name ?? "");
  } catch {
    // Non-fatal — the account works whether or not this email is delivered.
  }

  await syncRegistrationToSheet(
    {
      name: profile?.full_name ?? "",
      email,
      mobile: profile?.mobile ?? "",
      registrationDate: profile?.created_at ?? new Date().toISOString(),
      paymentStatus: "none",
      paymentId: "",
      paymentDate: "",
      accessStatus: profile?.access_status ?? "free",
    },
    userId,
    "registration"
  );
}
