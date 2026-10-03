"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

interface Question {
  id: string;
  type: "mcq" | "truefalse" | "formula" | "scenario" | "decision";
  lesson: string;
  question: string;
  options?: string[];
}

interface Result {
  id: string;
  lesson: string;
  correct: boolean;
  explanation: string;
  answer: string | null;
}

interface Outcome {
  score: number;
  total: number;
  passed: boolean;
  passRequires: number;
  passMark: number;
  results: Result[];
  saved: boolean;
  signedIn: boolean;
}

type Answer = string | number | boolean;

/** Renders `code` spans, since the question bank marks cell addresses and formulas with backticks. */
function rich(text: string): ReactNode[] {
  return text.split("`").map((part, i) =>
    i % 2 ? (
      <code key={i} className="rounded-md bg-code px-1.5 py-0.5 font-mono text-[0.88em]">{part}</code>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function AssessmentRunner({
  moduleNumber,
  questions,
  lessonLinks,
  nextHref,
  signedIn,
}: {
  moduleNumber: number;
  questions: Question[];
  lessonLinks: Record<string, string>;
  nextHref: string | null;
  signedIn: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const answered = questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "").length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessment/${moduleNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? "Could not mark your answers. Please try again.");
      else {
        setOutcome(data);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setError("Could not mark your answers. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function retake() {
    setAnswers({});
    setOutcome(null);
    window.scrollTo({ top: 0 });
  }

  if (outcome) {
    const byId = new Map(outcome.results.map((r) => [r.id, r]));
    const pct = Math.round((outcome.score / outcome.total) * 100);
    return (
      <div>
        <section
          className={`rounded-2xl border-2 p-6 ${outcome.passed ? "border-success bg-success-tint" : "border-accent/60 bg-accent-tint"}`}
          aria-label="Assessment result"
          role="status"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-muted">{outcome.passed ? "Passed" : "Not passed yet"}</p>
          <p className="mt-2 text-4xl font-bold text-heading">
            {outcome.score}/{outcome.total} <span className="text-lg font-semibold text-muted">{pct}%</span>
          </p>
          <p className="mt-2">
            {outcome.passed
              ? `You needed ${outcome.passRequires} correct (${outcome.passMark}%). Well done.`
              : `You needed ${outcome.passRequires} correct (${outcome.passMark}%). Read the explanations and the lessons they point to, then retake it. There is no limit on retakes.`}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button type="button" onClick={retake} className="rounded-lg border-2 border-primary px-5 py-2.5 font-semibold text-primary hover:bg-surface">
              Retake assessment
            </button>
            {outcome.passed && nextHref && (
              <Link href={nextHref} className="rounded-xl bg-cta px-5 py-2.5 font-semibold text-cta-ink hover:brightness-110">Continue →</Link>
            )}
          </div>
          <p className="mt-3 text-sm text-muted">
            {outcome.saved ? (
              "Your score is saved to your account."
            ) : outcome.signedIn ? (
              "Your score couldn't be saved this time."
            ) : (
              <>
                <Link href="/login" className="font-semibold text-link underline">Sign in free</Link> to keep your scores.
              </>
            )}
          </p>
        </section>

        <ol className="mt-8 space-y-4">
          {questions.map((q, i) => {
            const r = byId.get(q.id);
            if (!r) return null;
            return (
              <li key={q.id} className="rounded-2xl border border-line bg-surface p-5">
                <p className="font-semibold">
                  <span className={r.correct ? "text-success" : "text-danger"} aria-hidden="true">{r.correct ? "✓" : "✕"} </span>
                  <span className="sr-only">{r.correct ? "Correct: " : "Incorrect: "}</span>
                  {i + 1}. {rich(q.question)}
                </p>
                {!r.correct && r.answer && (
                  <p className="mt-2 text-sm">
                    <span className="font-semibold">Correct answer: </span>
                    {rich(r.answer)}
                  </p>
                )}
                <p className="mt-2 text-muted">{rich(r.explanation)}</p>
                {!r.correct && lessonLinks[r.lesson] && (
                  <Link href={lessonLinks[r.lesson]} className="mt-2 inline-block text-sm font-semibold text-link underline">
                    Review lesson {r.lesson}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <ol className="space-y-5">
        {questions.map((q, i) => (
          <li key={q.id}>
            <fieldset className="rounded-2xl border border-line bg-surface p-5">
              <legend className="px-1 text-xs font-bold uppercase tracking-wider text-muted">Question {i + 1} of {questions.length}</legend>
              <p className="mt-1 font-semibold">{rich(q.question)}</p>
              {q.type === "formula" ? (
                <div className="mt-3">
                  <label htmlFor={`a-${q.id}`} className="sr-only">Your formula</label>
                  <input
                    id={`a-${q.id}`}
                    value={String(answers[q.id] ?? "")}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Type your answer"
                    className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 font-mono"
                  />
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {(q.type === "truefalse" ? [true, false] : (q.options ?? []).map((_, k) => k)).map((value, k) => {
                    const label = q.type === "truefalse" ? (value ? "True" : "False") : q.options![value as number];
                    const checked = answers[q.id] === value;
                    return (
                      <label
                        key={k}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 ${checked ? "border-primary bg-tint" : "border-line hover:border-primary"}`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={checked}
                          onChange={() => setAnswers({ ...answers, [q.id]: value })}
                          className="mt-1"
                        />
                        <span>{rich(label)}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-cta px-7 py-3 text-base font-semibold text-cta-ink hover:brightness-110 disabled:opacity-60"
        >
          {busy ? "Marking…" : "Submit answers"}
        </button>
        <p className="text-sm text-muted" aria-live="polite">
          {answered} of {questions.length} answered
          {answered < questions.length && " (you can submit with some blank, but they will count as wrong)"}
        </p>
      </div>
      {!signedIn && <p className="mt-3 text-sm text-muted">You are not signed in, so your score won&apos;t be saved unless you <Link href={`/login?next=/learn/${moduleNumber}/assessment`} className="font-semibold text-link underline">sign in</Link> first.</p>}
      {error && <p className="mt-3 text-sm text-danger" role="alert">{error}</p>}
    </form>
  );
}
