import { google } from "googleapis";
import { createAdminClient } from "@/lib/supabase/admin";

const SHEET_TAB = "Registrations";
const HEADER = [
  "Name",
  "Email",
  "Mobile",
  "Registration Date",
  "Payment Status",
  "Payment ID",
  "Payment Date",
  "Course Access Status",
];

function getAuth() {
  const privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

interface SheetRecord {
  name: string;
  email: string;
  mobile: string;
  registrationDate: string;
  paymentStatus: "none" | "pending" | "paid" | "failed";
  paymentId: string;
  paymentDate: string;
  accessStatus: string;
}

/**
 * Admin reporting only — this is a one-way write from the backend for HR/admin
 * visibility. The Sheet is never read back to decide access; Postgres stays
 * the source of truth. Failures are logged, not thrown, so a Sheets outage
 * never blocks registration or payment.
 */
export async function syncRegistrationToSheet(record: SheetRecord, userId: string, eventType: string) {
  try {
    const sheets = google.sheets({ version: "v4", auth: getAuth() });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_TAB}!A:H`,
    });

    const rows = existing.data.values ?? [];
    if (rows.length === 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SHEET_TAB}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [HEADER] },
      });
    }

    const emailColumnIndex = rows.findIndex((row, i) => i > 0 && row[1] === record.email);
    const rowValues = [
      record.name,
      record.email,
      record.mobile,
      record.registrationDate,
      record.paymentStatus,
      record.paymentId,
      record.paymentDate,
      record.accessStatus,
    ];

    if (emailColumnIndex > 0) {
      const rowNumber = emailColumnIndex + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_TAB}!A${rowNumber}:H${rowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: [rowValues] },
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SHEET_TAB}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [rowValues] },
      });
    }

    const admin = createAdminClient();
    await admin.from("sheets_sync_log").insert({
      user_id: userId,
      event_type: eventType,
      status: "synced",
      synced_at: new Date().toISOString(),
    });
  } catch (error) {
    const admin = createAdminClient();
    await admin.from("sheets_sync_log").insert({
      user_id: userId,
      event_type: eventType,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
