import { NextResponse } from "next/server";
import { getEntitlement } from "@/lib/access";

/** Polled by the "verifying payment" screen after Razorpay checkout closes. */
export async function GET() {
  const e = await getEntitlement();
  if (!e.signedIn) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return NextResponse.json({ hasAccess: e.hasAccess, tier: e.tier?.id ?? null }, { headers: { "Cache-Control": "no-store" } });
}
