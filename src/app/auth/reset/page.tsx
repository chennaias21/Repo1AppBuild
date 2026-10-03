"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AUTH_CHANGED } from "@/components/HeaderActions";

type State = "checking" | "ready" | "invalid";

/** Landing page for the emailed reset link. Reads the tokens from the address and starts a session. */
export default function ResetPage() {
  const router = useRouter();
  const [state, setState] = useState<State>("checking");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    if (!access_token || !refresh_token) {
      // Strip any error details from the address bar and show the friendly message.
      window.history.replaceState(null, "", window.location.pathname);
      queueMicrotask(() => setState("invalid"));
      return;
    }
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error: err }) => {
      window.history.replaceState(null, "", window.location.pathname);
      setState(err ? "invalid" : "ready");
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Choose a password of at least 8 characters.");
    setBusy(true);
    const { error: err } = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (err) return setError(err.message);
    window.dispatchEvent(new Event(AUTH_CHANGED));
    router.push("/dashboard");
    router.refresh();
  }

  if (state === "checking") return <div className="container-page max-w-md py-14">One moment…</div>;

  if (state === "invalid") {
    return (
      <div className="container-page max-w-md py-14">
        <h1 className="text-3xl font-bold text-heading">This link didn&apos;t work</h1>
        <p className="mt-4">Reset links work once and expire after a short time. Ask for a new one and open it straight away.</p>
        <Link href="/login" className="mt-6 inline-flex rounded-xl bg-cta px-6 py-3 font-semibold text-cta-ink hover:brightness-110">Back to sign in</Link>
      </div>
    );
  }

  return (
    <div className="container-page max-w-md py-14">
      <h1 className="text-3xl font-bold text-heading">Choose a new password</h1>
      <form onSubmit={save} className="mt-8 space-y-4">
        <div>
          <label htmlFor="np" className="block text-sm font-medium">New password (8 or more characters)</label>
          <div className="relative">
            <input
              id="np"
              type={show ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 pr-20 text-ink"
            />
            <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} className="absolute right-2 top-1/2 mt-0.5 -translate-y-1/2 rounded px-2 py-1 text-sm font-semibold text-link">
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-cta px-4 py-3 font-semibold text-cta-ink hover:brightness-110 disabled:opacity-60">
          {busy ? "Saving…" : "Save password and continue"}
        </button>
      </form>
    </div>
  );
}
