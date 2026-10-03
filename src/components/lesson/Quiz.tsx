"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { isCorrect, type QuizQuestion } from "@/lib/quiz";
import { useQuizData } from "@/components/lesson/QuizContext";

type Answer = string | number | boolean | null;

const TYPE_LABEL: Record<QuizQuestion["type"], string> = {
  mcq: "Multiple choice",
  truefalse: "True or false",
  formula: "Write the formula",
  scenario: "Workplace scenario",
  decision: "Which is better here?",
};

export default function Quiz({ questions: given, lessonId: givenId }: { questions?: QuizQuestion[]; lessonId?: string }) {
  const ctx = useQuizData();
  const questions = given ?? ctx.questions ?? [];
  const lessonId = givenId ?? ctx.lessonId;

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [draft, setDraft] = useState("");
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState<"idle" | "saved" | "anon" | "error">("idle");
  const feedbackRef = useRef<HTMLDivElement>(null);

  if (questions.length === 0) return null;

  const q = questions[index];
  const current: Answer = answers[index] ?? null;
  const results = questions.map((qq, i) => isCorrect(qq, answers[i] ?? null));
  const score = results.filter(Boolean).length;

  function submit(value: Answer) {
    if (checked) return;
    const next = [...answers];
    next[index] = value;
    setAnswers(next);
    setChecked(true);
    queueMicrotask(() => feedbackRef.current?.focus());
  }

  async function finish() {
    setDone(true);
    if (!lessonId) return;
    try {
      const res = await fetch("/api/quiz/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          score,
          total: questions.length,
          answers: questions.map((qq, i) => ({ id: qq.id, answer: answers[i] ?? null, correct: results[i] })),
        }),
      });
      setSaved(res.status === 401 ? "anon" : res.ok ? "saved" : "error");
    } catch {
      setSaved("error");
    }
  }

  function retake() {
    setIndex(0);
    setAnswers([]);
    setDraft("");
    setChecked(false);
    setDone(false);
    setSaved("idle");
  }

  function advance() {
    setChecked(false);
    setDraft("");
    if (index + 1 < questions.length) setIndex(index + 1);
    else void finish();
  }

  const frame = "my-8 rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-7";

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <section className={frame} aria-label="Quiz result">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Quiz result</p>
        <p className="mt-2 text-4xl font-bold text-heading">
          {score}/{questions.length}
          <span className="ml-3 text-lg font-semibold text-muted">{pct}%</span>
        </p>
        <p className="mt-2 text-muted">
          {score === questions.length
            ? "Every answer correct. You can move on with confidence."
            : "Read the explanations below, then retake it whenever you like."}
        </p>
        <ol className="mt-5 space-y-3">
          {questions.map((qq, i) => (
            <li key={qq.id ?? i} className="rounded-xl border border-line px-4 py-3 text-[0.95rem]">
              <p className="font-semibold">
                <span className={results[i] ? "text-success" : "text-danger"} aria-hidden="true">
                  {results[i] ? "✓" : "✕"}{" "}
                </span>
                <span className="sr-only">{results[i] ? "Correct: " : "Incorrect: "}</span>
                {qq.question}
              </p>
              <p className="mt-1 text-muted">{qq.explanation}</p>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={retake}
            className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-ink hover:brightness-110"
          >
            Retake quiz
          </button>
          {saved === "saved" && <span className="text-sm text-success">Score saved to your progress.</span>}
          {saved === "anon" && (
            <span className="text-sm text-muted">
              <Link href="/login" className="font-semibold text-link underline">Create a free account</Link> to save scores.
            </span>
          )}
          {saved === "error" && <span className="text-sm text-danger">Your score couldn&apos;t be saved this time.</span>}
        </div>
      </section>
    );
  }

  const optionStyle = (i: number | boolean) => {
    if (!checked) return "border-line hover:border-primary hover:bg-tint";
    if (i === q.correct) return "border-success bg-success-tint";
    if (i === current) return "border-danger bg-danger-tint";
    return "border-line opacity-60";
  };

  const options: { value: number | boolean; label: string }[] =
    q.type === "truefalse"
      ? [
          { value: true, label: "True" },
          { value: false, label: "False" },
        ]
      : (q.options ?? []).map((label, value) => ({ value, label }));

  const right = checked && isCorrect(q, current);

  return (
    <section className={frame} aria-label="Quiz">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          Question {index + 1} of {questions.length} · {TYPE_LABEL[q.type]}
        </p>
        <div className="flex gap-1.5" aria-hidden="true">
          {questions.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-6 rounded-full ${i < index || (i === index && checked) ? "bg-teal" : i === index ? "bg-primary" : "bg-line"}`}
            />
          ))}
        </div>
      </div>

      <h3 className="mt-3 text-lg font-semibold leading-snug">{q.question}</h3>

      {q.type === "formula" ? (
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) submit(draft);
          }}
        >
          <label htmlFor={`f-${index}`} className="sr-only">Your formula</label>
          <input
            id={`f-${index}`}
            value={checked ? String(current ?? "") : draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={checked}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="=SUM(A1:A5)"
            className="w-full rounded-lg border border-line bg-code px-4 py-3 font-mono text-[0.95rem] text-ink disabled:opacity-80"
          />
          {!checked && (
            <button className="mt-3 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-ink hover:brightness-110">
              Check answer
            </button>
          )}
        </form>
      ) : (
        <div role="group" aria-label="Answer options" className="mt-4 grid gap-2.5">
          {options.map((o) => (
            <button
              key={String(o.value)}
              type="button"
              disabled={checked}
              onClick={() => submit(o.value)}
              className={`rounded-xl border-2 px-4 py-3 text-left text-[0.97rem] transition-colors ${optionStyle(o.value)}`}
            >
              {o.label}
              {checked && o.value === q.correct && <span className="sr-only"> (correct answer)</span>}
            </button>
          ))}
        </div>
      )}

      {checked && (
        <div
          ref={feedbackRef}
          tabIndex={-1}
          role="status"
          className={`mt-4 rounded-xl border px-5 py-4 outline-none ${right ? "border-success/50 bg-success-tint" : "border-danger/40 bg-danger-tint"}`}
        >
          <p className={`font-bold ${right ? "text-success" : "text-danger"}`}>{right ? "Correct" : "Not quite"}</p>
          {!right && q.type === "formula" && q.accept?.[0] && (
            <p className="mt-1 font-mono text-sm">One accepted answer: {q.accept[0]}</p>
          )}
          <p className="mt-1 text-[0.95rem]">{q.explanation}</p>
          <button
            type="button"
            onClick={advance}
            className="mt-3 rounded-lg bg-cta px-5 py-2.5 font-semibold text-cta-ink hover:brightness-110"
          >
            {index + 1 < questions.length ? "Next question" : "See my score"}
          </button>
        </div>
      )}
    </section>
  );
}
