import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendRegistrationEmail } from "@/lib/email";
import { syncRegistrationToSheet } from "@/lib/sheets";

/**
 * Called right after a user verifies their OTP for the first time, to save the
 * Name/Mobile captured at registration. Runs with the user's own session
 * (RLS-scoped) — it can only ever touch their own row, and the access_status
 * column is protected at the database level regardless of what this route sends.
 */
export async function POST(request: Request) {
  const { fullName, mobile } = await request.json();

  if (typeof fullName !== "string" || typeof mobile !== "string" || !fullName.trim()) {
    return NextResponse.json({ error: "Name and mobile are required." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ full_name: fullName.trim(), mobile: mobile.trim() })
    .eq("id", user.id)
    .select("access_status, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    if (user.email) await sendRegistrationEmail(user.email, fullName.trim());
  } catch {
    // Non-fatal — the account still works without the email.
  }

  await syncRegistrationToSheet(
    {
      name: fullName.trim(),
      email: user.email ?? "",
      mobile: mobile.trim(),
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
