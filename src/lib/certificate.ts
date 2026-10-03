import "server-only";
import { ALL_LESSONS, MODULES } from "@/lib/curriculum";
import { loadAssessment } from "@/lib/assessments";
import { getCompletedLessonIds } from "@/lib/progress";
import { createClient } from "@/lib/supabase/server";

/** The rule for earning the certificate. Change it here and every page follows. */
export const CERT_RULE = {
  finalAssessmentModule: 8,
  finalAssessmentMinPercent: 75,
};

export interface Requirement {
  label: string;
  done: boolean;
  detail: string;
}

export async function getRequirements(userId: string): Promise<{ eligible: boolean; items: Requirement[] }> {
  const completed = await getCompletedLessonIds(userId);
  const lessonsDone = ALL_LESSONS.filter((l) => completed.has(l.id)).length;
  const projects = MODULES.flatMap((m) => m.projects ?? []);
  const projectsDone = projects.filter((p) => completed.has(p.id)).length;

  const final = loadAssessment(CERT_RULE.finalAssessmentModule);
  const total = final?.questionCount ?? 15;
  const needed = Math.ceil((total * CERT_RULE.finalAssessmentMinPercent) / 100);

  const supabase = await createClient();
  const { data } = await supabase
    .from("quiz_attempts")
    .select("score")
    .eq("user_id", userId)
    .eq("lesson_id", `assessment.0${CERT_RULE.finalAssessmentModule}`);
  const best = Math.max(0, ...(data ?? []).map((r) => r.score as number));

  const items: Requirement[] = [
    { label: "Complete every lesson", done: lessonsDone === ALL_LESSONS.length, detail: `${lessonsDone} of ${ALL_LESSONS.length}` },
    {
      label: `Pass the Module ${CERT_RULE.finalAssessmentModule} assessment with ${CERT_RULE.finalAssessmentMinPercent}% or more`,
      done: best >= needed,
      detail: best ? `Best so far ${best}/${total}, need ${needed}` : `Need ${needed} of ${total} correct`,
    },
    { label: "Finish the capstone projects", done: projectsDone === projects.length, detail: `${projectsDone} of ${projects.length}` },
  ];
  return { eligible: items.every((i) => i.done), items };
}
