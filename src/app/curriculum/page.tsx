import Link from "next/link";
import { CURRICULUM } from "@/lib/curriculum";
import { getCurrentProfile } from "@/lib/access";
import { createClient } from "@/lib/supabase/server";
import LessonCard from "@/components/LessonCard";
import { COURSE_PRICE_INR } from "@/lib/razorpay";

export default async function CurriculumPage() {
  const current = await getCurrentProfile();
  const unlocked = current?.profile.access_status === "paid";

  let completedSlugs = new Set<string>();
  if (current) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("lesson_progress")
      .select("lesson_slug")
      .eq("user_id", current.userId)
      .eq("completed", true);
    completedSlugs = new Set((data ?? []).map((r) => r.lesson_slug));
  }

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-bold">Curriculum</h1>
      <p className="mt-2 text-ink-500">
        Basics → formatting → data cleaning → formulas &amp; functions → analysis → PivotTables →
        reports &amp; dashboards → advanced Excel → Power Query/Power Pivot → automation.
      </p>

      {!unlocked && (
        <div className="mt-6 rounded-lg border border-brand-200 bg-brand-50 p-4 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-brand-800">
            You&apos;re seeing the free basics lessons. Unlock everything else for ₹{COURSE_PRICE_INR}.
          </p>
          <Link
            href="/checkout"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 shrink-0"
          >
            Unlock Full Course
          </Link>
        </div>
      )}

      <div className="mt-10 space-y-10">
        {CURRICULUM.map((module) => (
          <section key={module.slug}>
            <h2 className="text-xl font-semibold">{module.title}</h2>
            <p className="text-sm text-ink-500">{module.outcome}</p>
            <div className="mt-4 space-y-3">
              {module.lessons.map((lesson) => (
                <LessonCard
                  key={lesson.slug}
                  lesson={lesson}
                  moduleSlug={module.slug}
                  hasFullAccess={unlocked}
                  completed={completedSlugs.has(lesson.slug)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
