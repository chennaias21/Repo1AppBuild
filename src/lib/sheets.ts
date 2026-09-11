import { createAdminClient } from "@/lib/supabase/admin";

interface SheetRecord {
  name: string;
  email: string;
  mobile: string;
  registrationDate: string;
  paymentStatus: "none" | "pending" | "paid" | "failed" | "refunded";
  paymentId: string;
  paymentDate: string;
  accessStatus: string;
}

/**
 * Admin reporting only — a one-way write to the tracking Sheet for HR/admin
 * visibility. The Sheet is never read back to decide access; Postgres stays the
 * source of truth. Failures are logged, not thrown, so a Sheets outage never
 * blocks registration or payment.
 *
 * Delivery goes through a Google Apps Script Web App bound to the Sheet (see
 * google-sheet-script/Code.gs), which avoids needing a Google Cloud project or
 * service-account credentials.
 */
export async function syncRegistrationToSheet(
  record: SheetRecord,
  userId: string,
  eventType: string
) {
  const admin = createAdminClient();
  const url = process.env.SHEETS_WEBHOOK_URL;

  if (!url) {
    await admin.from("sheets_sync_log").insert({
      user_id: userId,
      event_type: eventType,
      status: "failed",
      error: "SHEETS_WEBHOOK_URL is not set",
    });
    return;
  }

  try {
    // Apps Script can be slow to wake from cold. Cap the wait so a sluggish
    // Sheet can never hold up the request that triggered this.
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: process.env.SHEETS_WEBHOOK_SECRET, record }),
      signal: AbortSignal.timeout(8000),
    });

    const result = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

    if (!response.ok || !result?.ok) {
      throw new Error(result?.error ?? `Sheet script returned ${response.status}`);
    }

    await admin.from("sheets_sync_log").insert({
      user_id: userId,
      event_type: eventType,
      status: "synced",
      synced_at: new Date().toISOString(),
    });
  } catch (error) {
    await admin.from("sheets_sync_log").insert({
      user_id: userId,
      event_type: eventType,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
