"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Me = { signedIn: boolean; name: string | null };

export const AUTH_CHANGED = "skillsopan:auth-changed";

/**
 * Sign-in state for the header. The header lives in the page layout and is not rebuilt when
 * the learner moves between pages, so it re-checks on every page change and whenever
 * sign-in or sign-out happens, instead of trusting what it saw on first load.
 */
function useMe(): Me | null {
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener(AUTH_CHANGED, bump);
    window.addEventListener("focus", bump);
    return () => {
      window.removeEventListener(AUTH_CHANGED, bump);
      window.removeEventListener("focus", bump);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { signedIn: false, name: null }))
      .then((data) => alive && setMe(data))
      .catch(() => alive && setMe({ signedIn: false, name: null }));
    return () => {
      alive = false;
    };
  }, [pathname, tick]);

  return me;
}

export default function HeaderActions({ variant, onNavigate }: { variant: "desktop" | "mobile"; onNavigate?: () => void }) {
  const me = useMe();
  const router = useRouter();

  async function signOut() {
    onNavigate?.();
    await createClient().auth.signOut();
    window.dispatchEvent(new Event(AUTH_CHANGED));
    router.push("/");
    router.refresh();
  }

  const signedIn = Boolean(me?.signedIn);

  if (variant === "mobile") {
    return (
      <>
        <li className="border-b border-line">
          {signedIn ? (
            <Link href="/dashboard" onClick={onNavigate} className="block py-3 font-semibold text-primary">My dashboard</Link>
          ) : (
            <Link href="/login" onClick={onNavigate} className="block py-3 font-semibold text-ink">Log in</Link>
          )}
        </li>
        {signedIn ? (
          <li className="border-b border-line">
            <button type="button" onClick={signOut} className="block w-full py-3 text-left font-semibold text-ink">Sign out</button>
          </li>
        ) : (
          <li className="pt-4">
            <Link href="/free" onClick={onNavigate} className="block rounded-lg bg-cta px-5 py-3 text-center text-lg font-semibold text-cta-ink">Start free</Link>
          </li>
        )}
      </>
    );
  }

  return (
    <div className="hidden items-center gap-4 lg:flex">
      {signedIn ? (
        <>
          <Link href="/dashboard" className="rounded-lg bg-cta px-5 py-2.5 text-[0.95rem] font-semibold text-cta-ink hover:brightness-110">
            My dashboard
          </Link>
          <button type="button" onClick={signOut} className="text-[0.95rem] font-semibold text-ink hover:underline">
            Sign out
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className="text-[0.95rem] font-semibold text-ink hover:underline">Log in</Link>
          <Link href="/free" className="rounded-lg bg-cta px-5 py-2.5 text-[0.95rem] font-semibold text-cta-ink hover:brightness-110">
            Start free
          </Link>
        </>
      )}
    </div>
  );
}
