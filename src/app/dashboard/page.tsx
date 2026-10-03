import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getEntitlement } from "@/lib/access";
import { getCompletedLessonIds } from "@/lib/progress";
import { createClient } from "@/lib/supabase/server";
import { ALL_LESSONS, COURSE, MODULES, lessonHref } from "@/lib/curriculum";
import { ProgressBar } from "@/components/lesson/journey";
import { loadAssessment } from "@/lib/assessments";
import SignOutButton from "@/components/SignOutButton";
import RecordRegistration from "@/components/RecordRegistration";

export const metadata: Metadata = { title: "Your dashboard" };

export default async function DashboardPage() {
  const e = await getEntitlement();
  if (!e.signedIn || !e.userId) redirect("/login?next=/dashboard");

  const completed = await getCompletedLessonIds(e.userId);
  const open = (l: (typeof ALL_LESSONS)[number]) => l.access === "free" || e.hasAccess;
  const available = ALL_LESSONS.filter(open);
  const doneCount = ALL_LESSONS.filter((l) => completed.has(l.id)).length;
  const percent = Math.round((doneCount / COURSE.totalLessons) * 100);
  const next = available.find((l) => !completed.has(l.id));

  const supabase = await createClient();
  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("lesson_id, score, total, created_at")
    .eq("user_id", e.userId)
    .order("created_at", { ascending: false })
    .limit(200);
  const latest = new Map<string, { score: number; total: number }>();
  const bestAssessment = new Map<string, number>();
  for (const a of attempts ?? []) {
    if (a.lesson_id.startsWith("assessment.")) {
      bestAssessment.set(a.lesson_id, Math.max(bestAssessment.get(a.lesson_id) ?? 0, a.score));
    } else if (!latest.has(a.lesson_id)) latest.set(a.lesson_id, { score: a.score, total: a.total });
  }
  const avg = latest.size
    ? Math.round(([...latest.values()].reduce((s, a) => s + a.score / a.total, 0) / latest.size) * 100)
    : null;

  const first = e.name?.split(" ")[0];

  return (
    <div className="container-page py-10">
      <RecordRegistration />
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-bold text-heading">Welcome back{first ? `, ${first}` : ""}</h1>
        <SignOutButton />
      </div>

      <section className="mt-6 grid gap-5 lg:grid-cols-[2fr_1fr]" aria-label="Where you are">
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
          <p className="text-sm font-semibold text-muted">{doneCount} of {COURSE.totalLessons} lessons complete</p>
          <p className="mt-1 text-4xl font-bold text-ink">{percent}%</p>
          <ProgressBar value={percent} label="Course progress" className="mt-4" />
          <div className="mt-6">
            {next ? (
              <Link href={lessonHref(next)} className="inline-flex rounded-xl bg-cta px-6 py-3 font-semibold text-cta-ink hover:brightness-110">
                {doneCount === 0 ? "Start" : "Continue"}: {next.id} {next.shortTitle || next.title} →
              </Link>
            ) : available.length === ALL_LESSONS.length ? (
              <p className="font-semibold text-success">You have completed every lesson. 🎉</p>
            ) : (
              <p className="font-semibold text-success">You have finished all the free lessons.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
          <p className="text-sm font-semibold text-muted">Your plan</p>
          <p className="mt-1 text-2xl font-bold text-heading">{e.tier ? e.tier.name : "Free lessons"}</p>
          {e.tier ? (
            <p className="mt-2 text-sm text-muted">
              {e.expiresAt ? `Access until ${new Date(e.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}` : "Lifetime access"}
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted">Modules 1 and 2 are open. Unlock everything when you are ready.</p>
              <Link href="/pricing" className="mt-4 inline-flex rounded-lg border-2 border-primary px-4 py-2 text-sm font-semibold text-primary">Get the full course</Link>
            </>
          )}
          {avg !== null && <p className="mt-4 text-sm">Average quiz score: <strong>{avg}%</strong> across {latest.size} lessons</p>}
        </div>
      </section>

      {e.certificate && (
        <p className="mt-6 rounded-xl border border-line bg-surface px-5 py-4">
          <span className="font-semibold text-heading">Certificate: </span>
          <Link href="/certificate" className="font-semibold text-link underline">See what is left to earn it</Link>
        </p>
      )}

      <section className="mt-10" aria-labelledby="modules-h">
        <h2 id="modules-h" className="text-xl font-bold text-heading">Your modules</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m) => {
            const done = m.lessons.filter((l) => completed.has(l.id)).length;
            const firstOpen = m.lessons.find((l) => open({ ...l, module: m }) && !completed.has(l.id)) ?? m.lessons[0];
            const assessment = loadAssessment(m.number);
            const best = bestAssessment.get(`assessment.0${m.number}`);
            const locked = m.lessons.every((l) => !open({ ...l, module: m }));
            return (
              <Link
                key={m.number}
                href={lessonHref({ ...firstOpen, module: m })}
                className="rounded-2xl border border-line bg-surface p-5 hover:border-primary"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-bold text-white" aria-hidden="true">{m.number}</span>
                <span className="mt-3 block font-semibold text-heading">{m.title}</span>
                <span className="mt-1 block text-sm text-muted">
                  {locked ? "🔒 Full course" : `${done}/${m.lessons.length} complete`}
                </span>
                <ProgressBar value={(done / m.lessons.length) * 100} label={`Module ${m.number} progress`} className="mt-3" />
                {assessment && best !== undefined && (
                  <span className={`mt-3 block text-sm font-semibold ${best >= assessment.passRequires ? "text-success" : "text-muted"}`}>
                    Assessment: {best}/{assessment.questionCount} {best >= assessment.passRequires ? "✓ passed" : "(not passed yet)"}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
