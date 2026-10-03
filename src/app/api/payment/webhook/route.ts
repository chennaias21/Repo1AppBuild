import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email";
import { syncRegistrationToSheet } from "@/lib/sheets";
import { getTier } from "@/lib/tiers";

/**
 * Razorpay webhook — the only place that ever grants course access.
 * The client's own "payment success" redirect is cosmetic; this server-to-server
 * call, verified by HMAC signature, is what actually flips access_status.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const eventType = event.event as string;

  if (eventType === "refund.processed") {
    return handleRefund(event);
  }

  if (eventType !== "payment.captured" && eventType !== "order.paid") {
    // Acknowledge anything we don't act on so Razorpay stops retrying it.
    return NextResponse.json({ received: true });
  }

  const paymentEntity = event.payload?.payment?.entity;
  const orderId: string | undefined = paymentEntity?.order_id ?? event.payload?.order?.entity?.id;
  const paymentId: string | undefined = paymentEntity?.id;

  if (!orderId) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: payment } = await admin
    .from("payments")
    .select("id, user_id, status, amount_paise, tier")
    .eq("razorpay_order_id", orderId)
    .single();

  if (!payment) {
    return NextResponse.json({ error: "Unknown order" }, { status: 404 });
  }

  // Idempotent: Razorpay may deliver the same webhook more than once.
  if (payment.status === "paid") {
    return NextResponse.json({ received: true, alreadyProcessed: true });
  }

  // Defense in depth: re-confirm the amount actually captured matches what we created the order for.
  if (paymentEntity && paymentEntity.amount !== payment.amount_paise) {
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Timed plans (Essentials) end a fixed number of months after the confirmed payment.
  const tier = getTier(payment.tier ?? "complete");
  let expiresAt: string | null = null;
  if (tier?.accessMonths) {
    const d = new Date();
    d.setMonth(d.getMonth() + tier.accessMonths);
    expiresAt = d.toISOString();
  }

  await admin
    .from("payments")
    .update({ status: "paid", razorpay_payment_id: paymentId, verified_at: now, expires_at: expiresAt })
    .eq("id", payment.id);

  await admin
    .from("profiles")
    .update({ access_status: "paid", access_granted_at: now })
    .eq("id", payment.user_id);

  const { data: authUser } = await admin.auth.admin.getUserById(payment.user_id);
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, mobile, created_at")
    .eq("id", payment.user_id)
    .single();

  const email = authUser?.user?.email ?? "";
  const name = profile?.full_name ?? "";

  try {
    if (email) await sendWelcomeEmail(email, name);
  } catch {
    // Non-fatal — access is already granted regardless of email delivery.
  }

  await syncRegistrationToSheet(
    {
      name,
      email,
      mobile: profile?.mobile ?? "",
      registrationDate: profile?.created_at ?? "",
      paymentStatus: "paid",
      paymentId: paymentId ?? "",
      paymentDate: now,
      accessStatus: "paid",
    },
    payment.user_id,
    "payment_confirmed"
  );

  return NextResponse.json({ received: true });
}

/**
 * Revokes course access when a refund completes, so a refunded customer doesn't
 * keep the content. Razorpay sends this whether the refund was issued from the
 * dashboard or via API.
 */
async function handleRefund(event: Record<string, unknown>) {
  const payload = event.payload as
    | { refund?: { entity?: { payment_id?: string } } }
    | undefined;
  const refundedPaymentId = payload?.refund?.entity?.payment_id;

  if (!refundedPaymentId) {
    return NextResponse.json({ error: "Missing payment id" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: payment } = await admin
    .from("payments")
    .select("id, user_id, status")
    .eq("razorpay_payment_id", refundedPaymentId)
    .single();

  if (!payment) {
    return NextResponse.json({ error: "Unknown payment" }, { status: 404 });
  }

  if (payment.status === "refunded") {
    return NextResponse.json({ received: true, alreadyProcessed: true });
  }

  const now = new Date().toISOString();

  await admin.from("payments").update({ status: "refunded" }).eq("id", payment.id);

  await admin
    .from("profiles")
    .update({ access_status: "free", access_granted_at: null })
    .eq("id", payment.user_id);

  const { data: authUser } = await admin.auth.admin.getUserById(payment.user_id);
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, mobile, created_at")
    .eq("id", payment.user_id)
    .single();

  await syncRegistrationToSheet(
    {
      name: profile?.full_name ?? "",
      email: authUser?.user?.email ?? "",
      mobile: profile?.mobile ?? "",
      registrationDate: profile?.created_at ?? "",
      paymentStatus: "refunded",
      paymentId: refundedPaymentId,
      paymentDate: now,
      accessStatus: "free",
    },
    payment.user_id,
    "payment_refunded"
  );

  return NextResponse.json({ received: true });
}
