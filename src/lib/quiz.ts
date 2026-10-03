export type QuestionType = "mcq" | "truefalse" | "formula" | "scenario" | "decision";

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correct?: number | boolean;
  accept?: string[];
  explanation: string;
}

/** Case, spaces and a leading "=" are ignored so equivalent formulas match. */
export function normaliseFormula(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase().replace(/^=/, "");
}

/**
 * Formulas are matched as text and never evaluated. That keeps quiz scoring
 * safe and predictable, and the explanation is shown whether or not it matched.
 */
export function isCorrect(q: QuizQuestion, answer: string | number | boolean | null): boolean {
  if (answer === null || answer === "") return false;
  if (q.type === "formula") {
    const given = normaliseFormula(String(answer));
    return (q.accept ?? []).some((a) => normaliseFormula(a) === given);
  }
  return answer === q.correct;
}
