import { NextResponse } from "next/server";
import { PROMOS, normalisePromo } from "@/lib/tiers";

/** Lets the pricing page confirm a promo code before showing the discounted price. */
export async function GET(request: Request) {
  const code = normalisePromo(new URL(request.url).searchParams.get("code"));
  return NextResponse.json(
    code ? { valid: true, code, percent: PROMOS[code].percent } : { valid: false },
    { headers: { "Cache-Control": "no-store" } }
  );
}
