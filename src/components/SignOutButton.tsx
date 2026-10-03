"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AUTH_CHANGED } from "@/components/HeaderActions";

export default function SignOutButton() {
  const router = useRouter();
  async function out() {
    await createClient().auth.signOut();
    window.dispatchEvent(new Event(AUTH_CHANGED));
    router.push("/");
    router.refresh();
  }
  return (
    <button type="button" onClick={out} className="text-sm font-semibold text-muted underline hover:text-ink">
      Sign out
    </button>
  );
}
