import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findLesson } from "@/lib/curriculum";

/** Marks a lesson complete/incomplete for the signed-in user. RLS scopes writes to their own rows. */
export async function POST(request: Request) {
  const { lessonSlug, completed } = await request.json();

  if (typeof lessonSlug !== "string" || !findLesson(lessonSlug)) {
    return NextResponse.json({ error: "Unknown lesson" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_slug: lessonSlug,
      completed: Boolean(completed),
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,lesson_slug" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
