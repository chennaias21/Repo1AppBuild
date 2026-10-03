"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Me = { signedIn: boolean; name: string | null };

/** Fetches sign-in state on the client so every marketing page can stay statically rendered. */
export default function AuthNav({ className = "" }: { className?: string }) {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : { signedIn: false, name: null }))
      .then((data) => alive && setMe(data))
      .catch(() => alive && setMe({ signedIn: false, name: null }));
    return () => {
      alive = false;
    };
  }, []);

  if (me?.signedIn) {
    return (
      <Link href="/dashboard" className={`font-semibold text-primary hover:underline ${className}`}>
        My dashboard
      </Link>
    );
  }

  return (
    <Link href="/login" className={`font-semibold text-ink hover:underline ${className}`}>
      Log in
    </Link>
  );
}
