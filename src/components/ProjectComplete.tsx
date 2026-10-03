"use client";

import Link from "next/link";
import { useState } from "react";

/** Lets a learner tick a capstone project off. It counts toward the certificate. */
export default function ProjectComplete({ projectId, initial }: { projectId: string; initial: boolean }) {
  const [done, setDone] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function toggle() {
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: projectId, completed: !done }),
      });
      if (res.ok) setDone(!done);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-line bg-tint px-5 py-4">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={done}
        className={`rounded-xl px-5 py-2.5 font-semibold disabled:opacity-60 ${done ? "bg-teal text-white" : "bg-cta text-cta-ink hover:brightness-110"}`}
      >
        {done ? "✓ Project complete (undo)" : "Mark project complete"}
      </button>
      <p className="text-sm text-muted" role="status">
        {error ? "Couldn't save just now. Please try again." : done ? <>Counted toward your <Link href="/certificate" className="font-semibold text-link underline">certificate</Link>.</> : "Tick this when you have finished and checked your work."}
      </p>
    </div>
  );
}
