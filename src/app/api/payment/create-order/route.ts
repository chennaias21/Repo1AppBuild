import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayClient } from "@/lib/razorpay";
import { effectivePricePaise, getTier } from "@/lib/tiers";

/**
 * Creates a Razorpay order. Only the plan id is read from the request; the
 * amount always comes from lib/tiers.ts on the server, so a tampered request
 * cannot buy a plan for a different price.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const tier = typeof body?.tier === "string" ? getTier(body.tier) : undefined;
  if (!tier) return NextResponse.json({ error: "Choose a plan." }, { status: 400 });

  const amountPaise = effectivePricePaise(tier);
  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    notes: { user_id: user.id, email: user.email ?? "", tier: tier.id },
  });

  const { error } = await createAdminClient().from("payments").insert({
    user_id: user.id,
    razorpay_order_id: order.id,
    amount_paise: amountPaise,
    currency: "INR",
    status: "created",
    tier: tier.id,
  });
  if (error) return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });

  return NextResponse.json({
    orderId: order.id,
    amount: amountPaise,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID,
    tierName: tier.name,
  });
}
