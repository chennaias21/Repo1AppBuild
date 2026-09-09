"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

type Phase = "idle" | "opening" | "verifying" | "error";

export default function CheckoutPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  async function pollForAccess(attempts = 0) {
    if (attempts > 20) {
      setPhase("error");
      setError(
        "Payment received but access hasn't unlocked yet. This can take a minute — refresh your dashboard shortly, or contact support with your payment ID."
      );
      return;
    }
    const res = await fetch("/api/payment/status");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    if (data.accessStatus === "paid") {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setTimeout(() => pollForAccess(attempts + 1), 3000);
  }

  async function startCheckout() {
    setError(null);
    setPhase("opening");

    const res = await fetch("/api/payment/create-order", { method: "POST" });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setPhase("error");
      setError(data.error ?? "Could not start checkout.");
      return;
    }

    const { orderId, amount, currency, keyId } = await res.json();

    const razorpay = new window.Razorpay({
      key: keyId,
      amount,
      currency,
      order_id: orderId,
      name: "Excel Mastery",
      description: "Full course unlock",
      theme: { color: "#158755" },
      handler: () => {
        // This callback is UX-only — it never grants access itself.
        // Real confirmation comes from the server-verified webhook.
        setPhase("verifying");
        pollForAccess();
      },
      modal: {
        ondismiss: () => setPhase("idle"),
      },
    });

    razorpay.open();
  }

  return (
    <div className="container-page py-16 max-w-lg text-center">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <h1 className="text-2xl font-bold">Unlock the Full Course</h1>
      <p className="mt-2 text-ink-500">
        Secure payment via Razorpay. Access unlocks automatically once payment is confirmed.
      </p>

      {phase === "verifying" ? (
        <div className="mt-8">
          <p className="text-ink-700">Verifying your payment…</p>
          <p className="mt-1 text-sm text-ink-500">This usually takes a few seconds.</p>
        </div>
      ) : (
        <button
          onClick={startCheckout}
          disabled={phase === "opening"}
          className="mt-8 w-full rounded-md bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {phase === "opening" ? "Opening secure checkout…" : "Pay and Unlock"}
        </button>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
