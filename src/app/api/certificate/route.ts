import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getEntitlement } from "@/lib/access";
import { getRequirements } from "@/lib/certificate";
import { createAdminClient } from "@/lib/supabase/admin";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I, so the ID can be read aloud

function newId() {
  const bytes = crypto.randomBytes(10);
  return "SKS-" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/**
 * Issues the learner's certificate once they genuinely meet the rule. Eligibility is
 * recomputed here from the database, so nothing the browser sends can earn one.
 */
export async function POST(request: Request) {
  const e = await getEntitlement();
  if (!e.signedIn || !e.userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!e.hasAccess || !e.certificate) return NextResponse.json({ error: "Your plan does not include a certificate." }, { status: 403 });

  const admin = createAdminClient();
  const { data: existing } = await admin.from("certificates").select("id").eq("user_id", e.userId).maybeSingle();
  if (existing) return NextResponse.json({ id: existing.id });

  const { eligible } = await getRequirements(e.userId);
  if (!eligible) return NextResponse.json({ error: "Complete all the requirements first." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  if (name.length < 2) return NextResponse.json({ error: "Enter your full name as it should appear." }, { status: 400 });

  const id = newId();
  const { error } = await admin.from("certificates").insert({ id, user_id: e.userId, holder_name: name });
  if (error) return NextResponse.json({ error: "Could not issue the certificate. Please try again." }, { status: 500 });
  return NextResponse.json({ id });
}
