import "server-only";
import fs from "node:fs";
import path from "node:path";
import { MODULES, type ModuleRef } from "@/lib/curriculum";
import { isCorrect, type QuizQuestion } from "@/lib/quiz";

export interface AssessmentFile {
  id: string;
  module: number;
  title: string;
  subtitle: string;
  description: string;
  questionCount: number;
  passMark: number;
  passRequires: number;
  retakes: string;
  shuffleQuestions: boolean;
  questions: (QuizQuestion & { lesson: string })[];
}

/** What the browser is allowed to see: never the answers or explanations. */
export interface PublicQuestion {
  id: string;
  type: QuizQuestion["type"];
  lesson: string;
  question: string;
  options?: string[];
}

export function loadAssessment(moduleNumber: number): AssessmentFile | null {
  const mod = MODULES.find((m) => m.number === moduleNumber);
  if (!mod) return null;
  const file = path.join(/*turbopackIgnore: true*/ process.cwd(), "content", "assessments", mod.assessment);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as AssessmentFile;
  } catch {
    return null;
  }
}

/** Free modules have a free assessment; everything else needs a plan. */
export function assessmentIsFree(mod: ModuleRef): boolean {
  return mod.lessons.every((l) => l.access === "free");
}

export function toPublic(a: AssessmentFile): PublicQuestion[] {
  return a.questions.map((q) => ({ id: q.id, type: q.type, lesson: q.lesson, question: q.question, options: q.options }));
}

export interface GradedQuestion {
  id: string;
  lesson: string;
  correct: boolean;
  explanation: string;
  /** Shown only when the learner got it wrong. */
  answer: string | null;
}

export function grade(a: AssessmentFile, given: Record<string, string | number | boolean | null>) {
  const results: GradedQuestion[] = a.questions.map((q) => {
    const ok = isCorrect(q, given[q.id] ?? null);
    let answer: string | null = null;
    if (!ok) {
      if (q.type === "formula") answer = q.accept?.[0] ?? null;
      else if (q.type === "truefalse") answer = q.correct ? "True" : "False";
      else if (typeof q.correct === "number") answer = q.options?.[q.correct] ?? null;
    }
    return { id: q.id, lesson: q.lesson, correct: ok, explanation: q.explanation, answer };
  });
  const score = results.filter((r) => r.correct).length;
  return { score, total: results.length, passed: score >= a.passRequires, results };
}
