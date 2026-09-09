import Link from "next/link";
import { CURRICULUM, totalLessonCount } from "@/lib/curriculum";
import { COURSE_PRICE_INR } from "@/lib/razorpay";

const ENGAGEMENT_FEATURES = [
  "Real workplace examples, not generic textbook data",
  "Step-by-step demos you can follow along with",
  "Exercises and challenges after every topic",
  "Quizzes to check what actually stuck",
  "Shortcut challenges to build real speed",
  "Real-world projects for your portfolio",
  "Progress tracking across every module",
  "Achievement milestones as you advance",
  "Tips and hacks from real spreadsheet work",
  "Quick revision cheat sheets for every topic",
];

export default function HomePage() {
  const freeLessonCount = CURRICULUM.flatMap((m) => m.lessons).filter((l) => l.isFree).length;

  return (
    <div>
      <section className="container-page pt-16 pb-20 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Excel Mastery
        </p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-bold text-ink-900 tracking-tight">
          From Basics to Business-Ready Excel
        </h1>
        <p className="mt-5 max-w-2xl mx-auto text-lg text-ink-700">
          A practical, trainer-crafted Excel course — {totalLessonCount()}+ lessons, exercises,
          and real-world projects taking you from your first spreadsheet to PivotTables,
          dashboards, Power Query, and automation.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/curriculum"
            className="rounded-md bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
          >
            Start Free — {freeLessonCount} Lessons
          </Link>
          <Link
            href="/checkout"
            className="rounded-md border border-brand-600 px-6 py-3 font-semibold text-brand-700 hover:bg-brand-50"
          >
            Unlock Full Course — ₹{COURSE_PRICE_INR}
          </Link>
        </div>
      </section>

      <section className="container-page py-16 border-t border-black/5">
        <h2 className="text-2xl font-bold text-center">The Full Curriculum</h2>
        <p className="mt-2 text-center text-ink-500">
          Ten modules, in the order that actually builds skill.
        </p>
        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          {CURRICULUM.map((module) => (
            <div key={module.slug} className="rounded-lg border border-black/10 p-5 bg-white">
              <h3 className="font-semibold text-ink-900">{module.title}</h3>
              <p className="mt-1 text-sm text-ink-500">{module.outcome}</p>
              <p className="mt-2 text-xs text-ink-500">{module.lessons.length} items</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-16 border-t border-black/5">
        <h2 className="text-2xl font-bold text-center">Built to Keep You Moving</h2>
        <div className="mt-8 grid sm:grid-cols-2 gap-x-8 gap-y-3">
          {ENGAGEMENT_FEATURES.map((feature) => (
            <div key={feature} className="flex items-start gap-2 text-ink-700">
              <span className="text-brand-600">✓</span>
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-16 border-t border-black/5 text-center">
        <h2 className="text-2xl font-bold">Free vs. Full Access</h2>
        <div className="mt-8 grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
          <div className="rounded-lg border border-black/10 p-6">
            <h3 className="font-semibold">Free</h3>
            <p className="mt-1 text-sm text-ink-500">{freeLessonCount} basics lessons, no payment.</p>
          </div>
          <div className="rounded-lg border-2 border-brand-500 p-6 bg-brand-50">
            <h3 className="font-semibold text-brand-800">Full Course — ₹{COURSE_PRICE_INR}</h3>
            <p className="mt-1 text-sm text-ink-700">
              Every module, exercise, quiz, project, shortcut challenge, and cheat sheet — plus a
              detailed welcome guide emailed the moment payment is confirmed.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
