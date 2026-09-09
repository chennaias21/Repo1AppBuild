import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncRegistrationToSheet } from "@/lib/sheets";

/**
 * Retries any admin-sheet syncs that failed earlier (Sheets outage, quota, etc).
 * Wire this to a scheduled job (e.g. Netlify Scheduled Function or an external
 * cron hitting this URL) with the CRON_SECRET as a bearer token. Never gates
 * user access — purely catches up the reporting sheet.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: failedLogs } = await admin
    .from("sheets_sync_log")
    .select("id, user_id, event_type")
    .eq("status", "failed")
    .limit(50);

  let retried = 0;

  for (const log of failedLogs ?? []) {
    if (!log.user_id) continue;

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, mobile, access_status, access_granted_at, created_at")
      .eq("id", log.user_id)
      .single();

    const { data: authUser } = await admin.auth.admin.getUserById(log.user_id);
    const { data: payment } = await admin
      .from("payments")
      .select("razorpay_payment_id, status, verified_at")
      .eq("user_id", log.user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!profile || !authUser?.user?.email) continue;

    await syncRegistrationToSheet(
      {
        name: profile.full_name ?? "",
        email: authUser.user.email,
        mobile: profile.mobile ?? "",
        registrationDate: profile.created_at,
        paymentStatus: (payment?.status as "paid" | "failed" | undefined) ?? "none",
        paymentId: payment?.razorpay_payment_id ?? "",
        paymentDate: payment?.verified_at ?? "",
        accessStatus: profile.access_status,
      },
      log.user_id,
      `${log.event_type}_retry`
    );

    await admin.from("sheets_sync_log").delete().eq("id", log.id);
    retried += 1;
  }

  return NextResponse.json({ retried });
}
