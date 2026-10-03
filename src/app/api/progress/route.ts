import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findLessonById, findProjectById } from "@/lib/curriculum";
import { getEntitlement } from "@/lib/access";

/** Marks a lesson complete or not for the signed-in learner. RLS limits writes to their own rows. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const lessonId = body?.lessonId;
  const lesson = typeof lessonId === "string" ? findLessonById(lessonId) : undefined;
  // Capstone projects are tracked the same way, under ids like "8.P1".
  const project = typeof lessonId === "string" && !lesson ? findProjectById(lessonId) : undefined;
  if (!lesson && !project) return NextResponse.json({ error: "Unknown lesson" }, { status: 400 });

  const entitlement = await getEntitlement();
  if (!entitlement.signedIn || !entitlement.userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if ((project || lesson?.access === "paid") && !entitlement.hasAccess) {
    return NextResponse.json({ error: "This lesson is locked" }, { status: 403 });
  }

  const completed = Boolean(body.completed);
  const supabase = await createClient();
  const { error } = await supabase.from("progress").upsert(
    {
      user_id: entitlement.userId,
      lesson_id: (lesson?.id ?? project!.id),
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
