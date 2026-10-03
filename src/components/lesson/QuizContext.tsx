"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { QuizQuestion } from "@/lib/quiz";

interface QuizData {
  lessonId?: string;
  questions?: QuizQuestion[];
}

const Ctx = createContext<QuizData>({});

/** Gives <Quiz /> its questions without the lesson author passing them through MDX. */
export function QuizProvider({ lessonId, questions, children }: QuizData & { children: ReactNode }) {
  return <Ctx.Provider value={{ lessonId, questions }}>{children}</Ctx.Provider>;
}

export function useQuizData(): QuizData {
  return useContext(Ctx);
}
