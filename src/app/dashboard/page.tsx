import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/access";
import { createClient } from "@/lib/supabase/server";
import { CURRICULUM, allLessons, totalLessonCount } from "@/lib/curriculum";
import { COURSE_PRICE_INR } from "@/lib/razorpay";
import RecordRegistration from "@/components/RecordRegistration";

export default async function DashboardPage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login");

  const supabase = await createClient();
  const { data: progressRows } = await supabase
    .from("lesson_progress")
    .select("lesson_slug")
    .eq("user_id", current.userId)
    .eq("completed", true);

  const completedSlugs = new Set((progressRows ?? []).map((r) => r.lesson_slug));
  const unlocked = current.profile.access_status === "paid";
  const total = totalLessonCount();
  const completedCount = allLessons().filter((l) => completedSlugs.has(l.slug)).length;
  const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  const nextLesson = allLessons().find(
    (l) => (l.isFree || unlocked) && !completedSlugs.has(l.slug)
  );

  const milestones = [
    { key: "started", label: "First Lesson Completed", earned: completedCount >= 1 },
    { key: "quarter", label: "25% Through the Course", earned: percent >= 25 },
    { key: "half", label: "Halfway There", earned: percent >= 50 },
    { key: "finished", label: "Course Complete", earned: percent === 100 },
  ];

  return (
    <div className="container-page py-12">
      <RecordRegistration />
      <h1 className="text-3xl font-bold">
        Welcome back{current.profile.full_name ? `, ${current.profile.full_name.split(" ")[0]}` : ""}
      </h1>

      {!unlocked && (
        <div className="mt-6 rounded-lg border border-brand-200 bg-brand-50 p-4 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-brand-800">
            You have free access to the basics. Unlock every module for ₹{COURSE_PRICE_INR}.
          </p>
          <Link
            href="/checkout"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 shrink-0"
          >
            Unlock Full Course
          </Link>
        </div>
      )}

      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-black/10 p-5">
          <p className="text-sm text-ink-500">Overall progress</p>
          <p className="mt-1 text-3xl font-bold text-brand-700">{percent}%</p>
          <p className="text-xs text-ink-500">
            {completedCount} of {total} items complete
          </p>
        </div>
        <div className="rounded-lg border border-black/10 p-5">
          <p className="text-sm text-ink-500">Access level</p>
          <p className="mt-1 text-xl font-bold">{unlocked ? "Full Course" : "Free"}</p>
        </div>
        <div className="rounded-lg border border-black/10 p-5">
          <p className="text-sm text-ink-500">Up next</p>
          {nextLesson ? (
            <Link href={`/lesson/${nextLesson.slug}`} className="mt-1 block font-semibold text-brand-700 hover:underline">
              {nextLesson.title}
            </Link>
          ) : (
            <p className="mt-1 font-semibold text-ink-700">All caught up!</p>
          )}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Achievements</h2>
        <div className="mt-4 grid sm:grid-cols-4 gap-3">
          {milestones.map((m) => (
            <div
              key={m.key}
              className={`rounded-lg border p-4 text-center ${
                m.earned ? "border-brand-300 bg-brand-50" : "border-black/10 opacity-50"
              }`}
            >
              <div className="text-2xl">{m.earned ? "🏆" : "🔒"}</div>
              <p className="mt-1 text-xs font-medium text-ink-700">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Module Progress</h2>
        <div className="mt-4 space-y-2">
          {CURRICULUM.map((module) => {
            const moduleCompleted = module.lessons.filter((l) => completedSlugs.has(l.slug)).length;
            return (
              <div key={module.slug} className="flex items-center justify-between rounded-md border border-black/10 px-4 py-3">
                <span className="text-sm font-medium">{module.title}</span>
                <span className="text-xs text-ink-500">
                  {moduleCompleted}/{module.lessons.length}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-10">
        <Link href="/curriculum" className="text-brand-700 font-semibold hover:underline">
          Go to full curriculum →
        </Link>
      </div>
    </div>
  );
}
