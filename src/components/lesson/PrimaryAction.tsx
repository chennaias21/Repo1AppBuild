"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Phase = "learn" | "practice" | "quiz" | "complete";

interface Props {
  lessonId: string;
  initialCompleted: boolean;
  signedIn: boolean;
  nextHref: string | null;
  nextTitle: string | null;
}

/**
 * Exactly one primary action is visible at all times, and it follows the learner:
 * Start the exercise -> Take the quiz -> Mark complete -> Next lesson.
 * Which one is shown is decided by how far down the page they have scrolled.
 */
export default function PrimaryAction({ lessonId, initialCompleted, signedIn, nextHref, nextTitle }: Props) {
  const [phase, setPhase] = useState<Phase>("learn");
  const [completed, setCompleted] = useState(initialCompleted);
  const [busy, setBusy] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const practice = document.getElementById("practice");
    const quiz = document.getElementById("quiz");
    if (!practice && !quiz) return;

    function update() {
      const line = window.innerHeight * 0.6;
      const top = (el: HTMLElement | null) => (el ? el.getBoundingClientRect().top : Infinity);
      const quizTop = top(quiz);
      const practiceTop = top(practice);
      if (quiz && quizTop < line) {
        const end = document.documentElement.scrollHeight - window.innerHeight - 160;
        setPhase(window.scrollY >= end ? "complete" : "quiz");
      } else if (practice && practiceTop < line) setPhase("practice");
      else setPhase("learn");
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  async function toggleComplete() {
    setBusy(true);
    setError(false);
    setNeedLogin(false);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, completed: !completed }),
      });
      if (res.status === 401) setNeedLogin(true);
      else if (!res.ok) setError(true);
      else setCompleted(!completed);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const base = "inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold text-cta-ink hover:brightness-110";
  let action: React.ReactNode;

  if (completed && nextHref) {
    action = (
      <Link href={nextHref} className={`${base} bg-cta`}>
        Next: {nextTitle} →
      </Link>
    );
  } else if (completed) {
    action = <span className={`${base} bg-teal`}>Course complete 🎉</span>;
  } else if (phase === "learn") {
    action = (
      <a href="#practice" className={`${base} bg-cta`}>Start the exercise ↓</a>
    );
  } else if (phase === "practice") {
    action = (
      <a href="#quiz" className={`${base} bg-cta`}>Take the quiz ↓</a>
    );
  } else {
    action = (
      <button type="button" onClick={toggleComplete} disabled={busy} className={`${base} bg-cta disabled:opacity-60`}>
        {busy ? "Saving…" : "Mark complete ✓"}
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-page/95 backdrop-blur">
      <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
        <p className="text-sm text-muted" aria-live="polite">
          {needLogin ? (
            <>
              <Link href={`/login?next=${encodeURIComponent(window.location.pathname)}`} className="font-semibold text-link underline">
                Sign in free
              </Link>{" "}
              to save your progress.
            </>
          ) : error ? (
            "Couldn't save just now. Please try again."
          ) : completed ? (
            "Lesson complete. Nice work."
          ) : signedIn ? (
            "Your progress is saved to your account."
          ) : (
            "Reading is free. Sign in to save progress."
          )}
        </p>
        <div className="flex items-center gap-3">
          {completed && (
            <button type="button" onClick={toggleComplete} disabled={busy} className="text-sm text-muted underline">
              Undo
            </button>
          )}
          {action}
        </div>
      </div>
    </div>
  );
}
