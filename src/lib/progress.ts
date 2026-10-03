import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Lesson IDs ("3.3") the signed-in learner has marked complete. Empty when signed out. */
export async function getCompletedLessonIds(userId: string | null): Promise<Set<string>> {
  if (!userId) return new Set();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("progress")
    .select("lesson_id")
    .eq("user_id", userId)
    .eq("completed", true);
  if (error || !data) return new Set();
  return new Set(data.map((r) => r.lesson_id as string));
}
