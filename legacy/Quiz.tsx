"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/content-types";

export default function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const answeredCount = Object.keys(revealed).length;
  const score = Object.entries(revealed).filter(
    ([i]) => answers[Number(i)] === questions[Number(i)].correctIndex
  ).length;

  function choose(questionIndex: number, optionIndex: number) {
    if (revealed[questionIndex]) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
    setRevealed((prev) => ({ ...prev, [questionIndex]: true }));
  }

  function reset() {
    setAnswers({});
    setRevealed({});
  }

  return (
    <div className="mt-8 space-y-6">
      {questions.map((q, qi) => {
        const chosen = answers[qi];
        const isRevealed = revealed[qi];

        return (
          <div key={qi} className="rounded-lg border border-black/10 bg-white p-5">
            <p className="font-semibold text-ink-900">
              {qi + 1}. {q.question}
            </p>
            <div className="mt-3 space-y-2">
              {q.options.map((option, oi) => {
                const isCorrect = oi === q.correctIndex;
                const isChosen = chosen === oi;

                let style = "border-black/10 hover:border-brand-400 hover:bg-brand-50";
                if (isRevealed && isCorrect) {
                  style = "border-brand-500 bg-brand-50 text-brand-900";
                } else if (isRevealed && isChosen && !isCorrect) {
                  style = "border-red-300 bg-red-50 text-red-900";
                } else if (isRevealed) {
                  style = "border-black/10 opacity-60";
                }

                return (
                  <button
                    key={oi}
                    onClick={() => choose(qi, oi)}
                    disabled={isRevealed}
                    className={`block w-full rounded-md border px-4 py-2 text-left text-sm transition ${style}`}
                  >
                    {option}
                    {isRevealed && isCorrect && <span className="ml-2 font-semibold">✓</span>}
                    {isRevealed && isChosen && !isCorrect && <span className="ml-2">✕</span>}
                  </button>
                );
              })}
            </div>
            {isRevealed && (
              <p className="mt-3 rounded-md bg-ink-900/[0.03] p-3 text-sm text-ink-700">
                {q.explanation}
              </p>
            )}
          </div>
        );
      })}

      <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 p-4">
        <p className="text-sm font-semibold text-brand-800">
          Score: {score} / {questions.length}
          {answeredCount < questions.length && (
            <span className="ml-2 font-normal text-brand-700">
              ({questions.length - answeredCount} left)
            </span>
          )}
        </p>
        <button
          onClick={reset}
          className="rounded-md border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-white"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
