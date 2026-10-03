import { NextResponse } from "next/server";
import { findLessonById } from "@/lib/curriculum";
import { getEntitlement } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Records a quiz attempt for the signed-in learner. Written with the service
 * role so the table has no browser write policy at all. Anonymous readers of
 * free lessons simply get a 401 and keep their on-screen result.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const lesson = typeof body?.lessonId === "string" ? findLessonById(body.lessonId) : undefined;
  const score = Number(body?.score);
  const total = Number(body?.total);
  if (!lesson || !Number.isInteger(score) || !Number.isInteger(total) || total < 1 || total > 50 || score < 0 || score > total) {
    return NextResponse.json({ error: "Invalid attempt" }, { status: 400 });
  }

  const entitlement = await getEntitlement();
  if (!entitlement.signedIn || !entitlement.userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (lesson.access === "paid" && !entitlement.hasAccess) {
    return NextResponse.json({ error: "This lesson is locked" }, { status: 403 });
  }

  const answers = Array.isArray(body.answers) ? body.answers.slice(0, 50) : null;
  const { error } = await createAdminClient().from("quiz_attempts").insert({
    user_id: entitlement.userId,
    lesson_id: lesson.id,
    score,
    total,
    answers,
  });
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
