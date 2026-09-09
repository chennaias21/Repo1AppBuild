"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Step = "details" | "code";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("details");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (verifyError) {
      setLoading(false);
      setError(verifyError.message);
      return;
    }

    // Only send name/mobile the first time (fresh sign-up). Existing users just skip to the dashboard.
    if (fullName.trim()) {
      await fetch("/api/auth/sync-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, mobile }),
      });
    }

    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="container-page py-16 max-w-md">
      <h1 className="text-2xl font-bold">Log in or Register</h1>
      <p className="mt-2 text-sm text-ink-500">
        No password to remember — we email you a one-time code.
      </p>

      {step === "details" && (
        <form onSubmit={sendCode} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700">Full name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2"
              placeholder="e.g. Sai Gupta"
            />
            <p className="mt-1 text-xs text-ink-500">Only asked for new accounts.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700">Mobile number</label>
            <input
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2"
              placeholder="e.g. 9876543210"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2"
              placeholder="you@example.com"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            disabled={loading}
            className="w-full rounded-md bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? "Sending code…" : "Send me a login code"}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verifyCode} className="mt-8 space-y-4">
          <p className="text-sm text-ink-700">
            Enter the 6-digit code sent to <strong>{email}</strong>.
          </p>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-md border border-black/15 px-3 py-2 text-center text-lg tracking-widest"
            placeholder="123456"
            maxLength={6}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            disabled={loading}
            className="w-full rounded-md bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Verify and continue"}
          </button>
          <button
            type="button"
            onClick={() => setStep("details")}
            className="w-full text-sm text-ink-500 hover:underline"
          >
            Use a different email
          </button>
        </form>
      )}
    </div>
  );
}
