"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ERROR_MESSAGES: Record<string, string> = {
  expired_link: "That sign-in link has expired or was already used. Enter your email to get a new one.",
  missing_code: "That link didn't look right. Enter your email to get a new one.",
};

function LoginForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const linkError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    linkError ? (ERROR_MESSAGES[linkError] ?? "Something went wrong. Please try again.") : null
  );

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Remember where to send the learner after the emailed link. A cookie is used because the
    // link opens in a new tab, and a query string on the redirect URL could miss Supabase's allow-list.
    const next = searchParams.get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      document.cookie = `post_login_next=${encodeURIComponent(next)}; path=/; max-age=3600; samesite=lax`;
    }

    // Name and mobile ride along as user metadata, so they're saved even though
    // the user leaves the page to open their email. A database trigger copies
    // them into the profile when the account is created.
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: fullName.trim(), mobile: mobile.trim() },
      },
    });

    setLoading(false);

    if (sendError) {
      setError(sendError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="container-page py-16 max-w-md text-center">
        <div className="text-4xl">📧</div>
        <h1 className="mt-4 text-2xl font-bold text-heading">Check your email</h1>
        <p className="mt-3 text-ink">
          We&apos;ve sent a sign-in link to <strong>{email}</strong>. Click it and you&apos;ll be
          signed straight in.
        </p>
        <p className="mt-4 text-sm text-muted">
          Open the link on this same device. It expires in about an hour, and can only be used
          once. If it hasn&apos;t arrived in a minute or two, check your spam folder.
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-6 text-sm font-semibold text-link hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="container-page py-16 max-w-md">
      <h1 className="text-3xl font-bold text-heading">Sign in or register</h1>
      <p className="mt-2 text-sm text-muted">
        No password to remember — we email you a link that signs you in.
      </p>

      <form onSubmit={sendLink} className="mt-8 space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-ink">
            Full name
          </label>
          <input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-ink"
            placeholder="e.g. Sai Gupta"
          />
        </div>
        <div>
          <label htmlFor="mobile" className="block text-sm font-medium text-ink">
            Mobile number
          </label>
          <input
            id="mobile"
            required
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-ink"
            placeholder="e.g. 9876543210"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-ink"
            placeholder="you@example.com"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          disabled={loading}
          className="w-full rounded-xl bg-cta px-4 py-3 font-semibold text-cta-ink hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Sending link…" : "Email me a sign-in link"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container-page py-16 max-w-md">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
