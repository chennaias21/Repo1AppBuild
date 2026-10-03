"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createImplicitClient } from "@/lib/supabase/implicit";
import { AUTH_CHANGED } from "@/components/HeaderActions";

type Mode = "signin" | "register" | "forgot" | "sent" | "confirm";

const ERROR_MESSAGES: Record<string, string> = {
  expired_link:
    "That email link didn't work. Links only work in the same browser you asked for them in. Sign in with your password instead, or use “Forgot password” to get a reset link.",
  missing_code: "That link didn't look right. Sign in with your password below.",
};

const FIELD = "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-ink";
const BUTTON = "w-full rounded-xl bg-cta px-4 py-3 font-semibold text-cta-ink hover:brightness-110 disabled:opacity-60";

function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
}

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const linkError = params.get("error");

  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
    const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(linkError ? (ERROR_MESSAGES[linkError] ?? "Something went wrong. Please try again.") : null);

  function go(m: Mode) {
    setMode(m);
    setError(null);
    setInfo(null);
    setPassword("");
  }

  function done() {
    window.dispatchEvent(new Event(AUTH_CHANGED));
    router.push(next);
    router.refresh();
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await action();
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const signIn = (e: React.FormEvent) => {
    e.preventDefault();
    return run(async () => {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) setError("That email and password don't match. If you registered earlier without a password, use “Forgot password” to set one.");
      else done();
    });
  };

  const register = (e: React.FormEvent) => {
    e.preventDefault();
    return run(async () => {
      if (!/^\+?[0-9\s-]{10,15}$/.test(mobile.trim())) return setError("Enter a valid mobile number, for example 9876543210.");
      if (password.length < 8) return setError("Choose a password of at least 8 characters.");
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim(), mobile: mobile.trim() } },
      });
      if (err) return setError(err.message.toLowerCase().includes("registered") ? "That email already has an account. Sign in, or use “Forgot password”." : err.message);
      // Supabase hides whether an address exists: an empty identities list means it already does.
      if (data.user && data.user.identities?.length === 0) return setError("That email already has an account. Sign in, or use “Forgot password”.");
      if (data.session) done();
      else go("confirm");
    });
  };

  const sendReset = (e: React.FormEvent) => {
    e.preventDefault();
    return run(async () => {
      const { error: err } = await createImplicitClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      if (err) return setError(err.message);
      setMode("sent");
    });
  };

  const passwordField = (autoComplete: string, label = "Password") => (
    <div>
      <label htmlFor="password" className="block text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          id="password"
          type={show ? "text" : "password"}
          required
          minLength={mode === "signin" ? undefined : 8}
          autoComplete={autoComplete}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${FIELD} pr-20`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 mt-0.5 -translate-y-1/2 rounded px-2 py-1 text-sm font-semibold text-link"
          aria-pressed={show}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );

  const emailField = (
    <div>
      <label htmlFor="email" className="block text-sm font-medium">Email</label>
      <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={FIELD} placeholder="you@example.com" />
    </div>
  );

  const messages = (
    <>
      {info && <p className="text-sm text-success" role="status">{info}</p>}
      {error && <p className="text-sm text-danger" role="alert">{error}</p>}
    </>
  );

  const link = "text-sm font-semibold text-link hover:underline";

  return (
    <div className="container-page max-w-md py-14">
      {mode === "confirm" ? (
        <div className="text-center">
          <div className="text-4xl" aria-hidden="true">📧</div>
          <h1 className="mt-4 text-2xl font-bold text-heading">Confirm your email</h1>
          <p className="mt-3">We sent a confirmation link to <strong>{email}</strong>. Click it, then come back here and sign in with your password.</p>
          <button onClick={() => go("signin")} className={`mt-6 ${link}`}>Go to sign in</button>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold text-heading">
            {mode === "register" ? "Create your account" : mode === "signin" ? "Sign in" : "Reset your password"}
          </h1>
          {mode === "signin" && <p className="mt-2 text-sm text-muted">New here? <button onClick={() => go("register")} className={link}>Create an account</button></p>}
          {mode === "register" && <p className="mt-2 text-sm text-muted">Already registered? <button onClick={() => go("signin")} className={link}>Sign in</button></p>}

          {mode === "signin" && (
            <form onSubmit={signIn} className="mt-8 space-y-4">
              {emailField}
              {passwordField("current-password")}
              {messages}
              <button disabled={busy} className={BUTTON}>{busy ? "Signing in…" : "Sign in"}</button>
              <p><button type="button" onClick={() => go("forgot")} className={link}>Forgot password?</button></p>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={register} className="mt-8 space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium">Full name</label>
                <input id="fullName" required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={FIELD} placeholder="e.g. Sai Gupta" />
              </div>
              <div>
                <label htmlFor="mobile" className="block text-sm font-medium">Mobile number</label>
                <input id="mobile" required type="tel" autoComplete="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} className={FIELD} placeholder="e.g. 9876543210" />
              </div>
              {emailField}
              {passwordField("new-password", "Choose a password (8 or more characters)")}
              {messages}
              <button disabled={busy} className={BUTTON}>{busy ? "Creating account…" : "Create account"}</button>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={sendReset} className="mt-8 space-y-4">
              <p className="text-sm text-muted">Enter your email and we will send you a link to choose a new password. It works on any device.</p>
              {emailField}
              {messages}
              <button disabled={busy} className={BUTTON}>{busy ? "Sending…" : "Email me a reset link"}</button>
              <p><button type="button" onClick={() => go("signin")} className={link}>Back to sign in</button></p>
            </form>
          )}

          {mode === "sent" && (
            <div className="mt-8">
              <p>We sent a reset link to <strong>{email}</strong>. Open it, choose a new password, and you will be signed in.</p>
              <p className="mt-3 text-sm text-muted">Nothing after a couple of minutes? Check your spam folder.</p>
              <button onClick={() => go("forgot")} className={`mt-6 ${link}`}>Send it again</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container-page max-w-md py-14">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
