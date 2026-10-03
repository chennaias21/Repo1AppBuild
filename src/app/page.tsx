import Link from "next/link";
import { COURSE, MODULES, lessonHref, projectHref } from "@/lib/curriculum";
import { SITE } from "@/lib/site";
import { TIERS, effectivePricePaise, formatRupees } from "@/lib/tiers";
import { FAQ } from "@/lib/faq";
import { BUSINESS } from "@/lib/business";
import { Staircase } from "@/components/lesson/journey";

const STAGE_COPY: Record<string, string> = {
  Beginner: "Get comfortable. Enter, format and tidy data without fear.",
  Intermediate: "Let Excel do the sums. Formulas, lookups and logic.",
  Advanced: "See the story in the data. Pivot tables and dashboards.",
  "Business-Ready": "Apply it. Real projects the way work actually looks.",
};

const PROBLEMS = [
  { title: "You type everything by hand", body: "Totals, counts and lookups that a formula would finish in a second." },
  { title: "Your data is messy", body: "Duplicates, stray spaces and dates that will not sort. Clean it once, properly." },
  { title: "Your reports take hours", body: "Pivot tables and charts turn a long afternoon into a few clicks." },
];

const STEPS = [
  { n: 1, title: "Read a short lesson", body: "Each one takes about ten minutes and ends with something you can use." },
  { n: 2, title: "Do the exercise", body: "Open the practice file and try it yourself, with hints if you need them." },
  { n: 3, title: "Check with the quiz", body: "A few questions with explanations, so you know it stuck." },
];

export default function Home() {
  const projects = MODULES.flatMap((m) => m.projects ?? []);
  const sample = MODULES[0].lessons.slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="bg-tint">
        <div className="container-page grid items-center gap-10 py-16 lg:grid-cols-[1.2fr_1fr] lg:py-24">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-accent">Online Excel course</p>
            <h1 className="mt-3 text-4xl font-bold leading-[1.15] text-heading sm:text-5xl">{SITE.homeHeadline}</h1>
            <p className="mt-5 max-w-xl text-lg text-muted">{SITE.tagline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/free" className="rounded-xl bg-cta px-7 py-3.5 text-base font-semibold text-cta-ink hover:brightness-110">
                Start the free lessons
              </Link>
              <Link href="/curriculum" className="rounded-xl border-2 border-primary px-7 py-3.5 text-base font-semibold text-primary hover:bg-surface">
                See the curriculum
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">No sign-up needed to read the first 12 lessons.</p>
          </div>
          <div className="mx-auto w-full max-w-sm rounded-3xl border border-line bg-surface p-8 shadow-card" aria-hidden="true">
            <Staircase filled={4} className="h-48 w-full text-ink" />
            <p className="mt-4 text-center text-sm font-semibold text-muted">Four stages. One clear path.</p>
          </div>
        </div>
      </section>

      {/* Facts: only numbers that are true of the course as built */}
      <section aria-label="The course at a glance" className="border-b border-line">
        <dl className="container-page grid grid-cols-2 gap-6 py-8 text-center md:grid-cols-4">
          {[
            [COURSE.totalLessons, "lessons"],
            [COURSE.totalProjects, "capstone projects"],
            [`${COURSE.estimatedHours}`, "hours of practice"],
            [COURSE.freeLessons, "free lessons"],
          ].map(([n, label]) => (
            <div key={String(label)}>
              <dt className="sr-only">{label}</dt>
              <dd className="text-3xl font-bold text-heading">{n}</dd>
              <dd className="text-sm text-muted" aria-hidden="true">{label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* About, in the owner's words */}
      <section className="container-page py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-heading">What is SkillSopan?</h2>
          <p className="mt-4 text-lg leading-relaxed">{SITE.description}</p>
        </div>
      </section>

      {/* Problems */}
      <section className="bg-tint py-16">
        <div className="container-page">
          <h2 className="text-center text-3xl font-bold text-heading">Does any of this sound familiar?</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PROBLEMS.map((p) => (
              <div key={p.title} className="rounded-2xl border border-line bg-surface p-6 shadow-card">
                <h3 className="text-lg font-semibold text-heading">{p.title}</h3>
                <p className="mt-2 text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="container-page py-16">
        <h2 className="text-center text-3xl font-bold text-heading">Your climb, stage by stage</h2>
        <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {COURSE.stages.map((stage, i) => {
            const mods = MODULES.filter((m) => m.stage === stage);
            return (
              <li key={stage} className="rounded-2xl border border-line bg-surface p-6">
                <Staircase filled={i + 1} className="h-8 text-ink" />
                <h3 className="mt-3 text-lg font-bold text-heading">{stage}</h3>
                <p className="mt-2 text-muted">{STAGE_COPY[stage]}</p>
                <p className="mt-3 text-sm font-semibold text-accent">
                  {mods.length === 1 ? `Module ${mods[0].number}` : `Modules ${mods.map((m) => m.number).join(", ")}`}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* What you'll build */}
      <section className="bg-tint py-16">
        <div className="container-page">
          <h2 className="text-center text-3xl font-bold text-heading">What you will build</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted">Three capstone projects at the end, each one shaped like real workplace data.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.id} href={projectHref(p.slug)} className="rounded-2xl border border-line bg-surface p-6 shadow-card hover:border-primary">
                <p className="text-xs font-bold uppercase tracking-wider text-accent">Project {p.id}</p>
                <h3 className="mt-2 text-lg font-semibold text-heading">{p.title}</h3>
                <p className="mt-2 text-sm text-muted">{p.skills}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-16">
        <h2 className="text-center text-3xl font-bold text-heading">How each lesson works</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-lg font-bold text-white" aria-hidden="true">{s.n}</span>
              <div>
                <h3 className="font-semibold text-heading">{s.title}</h3>
                <p className="mt-1 text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Free lessons */}
      <section className="bg-tint py-16">
        <div className="container-page">
          <h2 className="text-center text-3xl font-bold text-heading">Try it free, right now</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted">Modules 1 and 2 are open to everyone. Start with any of these.</p>
          <ul className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
            {sample.map((l) => (
              <li key={l.id}>
                <Link href={lessonHref({ ...l, module: MODULES[0] })} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-5 py-4 hover:border-primary">
                  <span><span className="text-muted">{l.id}</span> {l.title}</span>
                  <span className="shrink-0 text-sm text-muted">{l.durationMin} min</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center">
            <Link href="/free" className="font-semibold text-link underline">See all {COURSE.freeLessons} free lessons →</Link>
          </p>
        </div>
      </section>

      {/* Pricing summary */}
      <section className="container-page py-16">
        <h2 className="text-center text-3xl font-bold text-heading">Simple pricing, paid once</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {TIERS.map((t) => (
            <div key={t.id} className={`rounded-2xl border bg-surface p-6 ${t.featured ? "border-2 border-accent" : "border-line"}`}>
              <h3 className="text-lg font-bold text-heading">{t.name}</h3>
              <p className="mt-2 text-3xl font-bold">{formatRupees(effectivePricePaise(t))}</p>
              <p className="mt-3 text-sm text-muted">{t.blurb}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center">
          <Link href="/pricing" className="rounded-xl bg-cta px-7 py-3 font-semibold text-cta-ink hover:brightness-110">Compare plans</Link>
        </p>
        <p className="mt-4 text-center text-sm text-muted">{BUSINESS.refundWindowDays}-day refund, no questions asked.</p>
      </section>

      {/* FAQ */}
      <section className="bg-tint py-16">
        <div className="container-page max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-heading">Questions, answered</h2>
          <div className="mt-8 space-y-3">
            {FAQ.slice(0, 4).map((f) => (
              <details key={f.q} className="group rounded-xl border border-line bg-surface">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-heading">
                  {f.q}
                  <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="border-t border-line px-5 py-4">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-center"><Link href="/faq" className="font-semibold text-link underline">More questions</Link></p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container-page py-20 text-center">
        <h2 className="mx-auto max-w-2xl text-3xl font-bold text-heading">Take the first step today</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">It costs nothing to begin. Open lesson 1.1 and see if it suits you.</p>
        <Link href="/free" className="mt-8 inline-flex rounded-xl bg-cta px-8 py-4 text-lg font-semibold text-cta-ink hover:brightness-110">
          Start the free lessons
        </Link>
      </section>
    </>
  );
}
