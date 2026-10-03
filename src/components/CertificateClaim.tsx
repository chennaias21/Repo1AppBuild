"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CertificateClaim({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function claim(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? "Something went wrong.");
      else router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={claim} className="mt-6 rounded-2xl border-2 border-success bg-success-tint p-6">
      <h2 className="text-xl font-bold text-heading">You have earned it</h2>
      <p className="mt-2">Check the name below. It is printed on your certificate and cannot be changed afterwards.</p>
      <label htmlFor="cert-name" className="mt-4 block text-sm font-semibold">Name on certificate</label>
      <input
        id="cert-name"
        required
        maxLength={80}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mt-1 w-full rounded-lg border border-line bg-surface px-4 py-2.5"
      />
      <button disabled={busy} className="mt-4 rounded-xl bg-cta px-6 py-3 font-semibold text-cta-ink hover:brightness-110 disabled:opacity-60">
        {busy ? "Issuing…" : "Get my certificate"}
      </button>
      {error && <p className="mt-3 text-sm text-danger" role="alert">{error}</p>}
    </form>
  );
}
