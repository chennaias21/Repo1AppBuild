"use client";

import { useState, type ReactNode } from "react";

/**
 * Hint -> Solution -> Why are progressive reveals. A learner who can see the
 * answer straight away reads it instead of trying, so each step stays hidden
 * until the previous one has been opened.
 */
export default function ExerciseReveals({
  hint,
  solution,
  explanation,
}: {
  hint?: ReactNode;
  solution?: ReactNode;
  explanation?: ReactNode;
}) {
  const [hintOpen, setHintOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);

  const canShowSolution = !hint || hintOpen;
  const btn =
    "rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-tint focus-visible:outline-offset-2";

  return (
    <div className="mt-6 space-y-4">
      {hint && !hintOpen && (
        <button type="button" onClick={() => setHintOpen(true)} className={btn}>
          Show hint
        </button>
      )}
      {hint && hintOpen && (
        <div className="rounded-xl border border-amber/60 bg-warn-tint px-5 py-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">Hint</p>
          {hint}
        </div>
      )}

      {solution && canShowSolution && !solutionOpen && (
        <button type="button" onClick={() => setSolutionOpen(true)} className={btn}>
          Show solution
        </button>
      )}
      {solution && solutionOpen && (
        <div className="rounded-xl border border-success/50 bg-success-tint px-5 py-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-success">Solution</p>
          {solution}
        </div>
      )}

      {explanation && solutionOpen && !whyOpen && (
        <button type="button" onClick={() => setWhyOpen(true)} className={btn}>
          Why this works
        </button>
      )}
      {explanation && whyOpen && (
        <div className="rounded-xl border border-line bg-tint px-5 py-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">Why this works</p>
          {explanation}
        </div>
      )}
    </div>
  );
}
