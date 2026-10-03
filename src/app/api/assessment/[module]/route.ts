import { NextResponse } from "next/server";
import { MODULES } from "@/lib/curriculum";
import { getEntitlement } from "@/lib/access";
import { assessmentIsFree, grade, loadAssessment } from "@/lib/assessments";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Grades a module assessment on the server, so the answers never reach the browser
 * before the learner submits. Anyone may sit a free module's assessment; the score
 * is saved only when they are signed in.
 */
export async function POST(request: Request, { params }: { params: Promise<{ module: string }> }) {
  const { module: m } = await params;
  const mod = MODULES.find((x) => x.number === Number(m));
  const assessment = mod ? loadAssessment(mod.number) : null;
  if (!mod || !assessment) return NextResponse.json({ error: "Unknown assessment" }, { status: 404 });

  const entitlement = await getEntitlement();
  if (!assessmentIsFree(mod) && !entitlement.hasAccess) {
    return NextResponse.json({ error: "This assessment is part of the full course" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const given = body?.answers && typeof body.answers === "object" ? (body.answers as Record<string, string | number | boolean | null>) : {};
  const result = grade(assessment, given);

  let saved = false;
  if (entitlement.signedIn && entitlement.userId) {
    const { error } = await createAdminClient()
      .from("quiz_attempts")
      .insert({
        user_id: entitlement.userId,
        lesson_id: assessment.id,
        score: result.score,
        total: result.total,
        answers: result.results.map((r) => ({ id: r.id, correct: r.correct })),
      });
    saved = !error;
  }

  return NextResponse.json({ ...result, passRequires: assessment.passRequires, passMark: assessment.passMark, saved, signedIn: entitlement.signedIn });
}
