"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type Phase = "idle" | "opening" | "verifying" | "error";

/**
 * Opens Razorpay checkout for one plan. The browser only says WHICH plan; the
 * price is set by the server. The success callback here is cosmetic: access is
 * granted by the signed webhook, and this component just waits for that.
 */
export default function BuyButton({ tier, label, featured, promo }: { tier: string; label: string; featured?: boolean; promo?: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function waitForAccess(attempt = 0) {
    if (attempt > 20) {
      setPhase("error");
      setMessage("Your payment went through, but access can take a minute to unlock. Refresh your dashboard shortly, or write to us with your payment ID.");
      return;
    }
    const res = await fetch("/api/payment/status", { cache: "no-store" });
    if (res.status === 401) return router.push("/login?next=/pricing");
    const data = await res.json().catch(() => ({}));
    if (data.hasAccess) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setTimeout(() => waitForAccess(attempt + 1), 3000);
  }

  async function start() {
    setMessage(null);
    setPhase("opening");
    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, promo }),
      });
      if (res.status === 401) return router.push("/login?next=/pricing");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhase("error");
        setMessage(data.error ?? "Could not start checkout. Please try again.");
        return;
      }
      if (!window.Razorpay) {
        setPhase("error");
        setMessage("The payment window is still loading. Please try again in a moment.");
        return;
      }
      new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "SkillSopan",
        description: data.tierName,
        theme: { color: "#004080" },
        handler: () => {
          setPhase("verifying");
          waitForAccess();
        },
        modal: { ondismiss: () => setPhase("idle") },
      }).open();
    } catch {
      setPhase("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <div>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <button
        type="button"
        onClick={start}
        disabled={phase === "opening" || phase === "verifying"}
        className={`w-full rounded-xl px-6 py-3 text-base font-semibold hover:brightness-110 disabled:opacity-60 ${
          featured ? "bg-cta text-cta-ink" : "border-2 border-primary text-primary"
        }`}
      >
        {phase === "opening" ? "Opening secure checkout…" : phase === "verifying" ? "Confirming your payment…" : label}
      </button>
      <p className="mt-2 min-h-5 text-sm text-danger" role="status" aria-live="polite">
        {phase === "verifying" ? <span className="text-muted">This usually takes a few seconds.</span> : message}
      </p>
    </div>
  );
}
