import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayClient, COURSE_PRICE_INR } from "@/lib/razorpay";

/**
 * Creates a Razorpay order. The amount is fixed here, server-side, from an
 * environment variable — never taken from the request body — so a tampered
 * frontend request can't buy the course for a different price.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("access_status")
    .eq("id", user.id)
    .single();

  if (profile?.access_status === "paid") {
    return NextResponse.json({ error: "Course already unlocked." }, { status: 400 });
  }

  const amountPaise = COURSE_PRICE_INR * 100;
  const razorpay = getRazorpayClient();

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    notes: { user_id: user.id, email: user.email ?? "" },
  });

  const admin = createAdminClient();
  await admin.from("payments").insert({
    user_id: user.id,
    razorpay_order_id: order.id,
    amount_paise: amountPaise,
    currency: "INR",
    status: "created",
  });

  return NextResponse.json({
    orderId: order.id,
    amount: amountPaise,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
