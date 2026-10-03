import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ALL_LESSONS, MODULES, findLesson, findLessonById, lessonHref } from "@/lib/curriculum";
import { loadDocument, readFrontmatter } from "@/lib/content/lessons";
import { getEntitlement } from "@/lib/access";
import { getCompletedLessonIds } from "@/lib/progress";
import { ShortcutBar, VersionBadge } from "@/components/lesson/elements";
import { NextLesson, Paywall } from "@/components/lesson/journey";
import { QuizProvider } from "@/components/lesson/QuizContext";
import LessonSidebar, { type SidebarModule } from "@/components/lesson/LessonSidebar";
import OnThisPage from "@/components/lesson/OnThisPage";
import PrimaryAction from "@/components/lesson/PrimaryAction";
import { TIERS, formatRupees } from "@/lib/tiers";

interface Params {
  module: string;
  lesson: string;
}

export function generateStaticParams() {
  return ALL_LESSONS.map((l) => ({ module: String(l.module.number), lesson: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { module: m, lesson } = await params;
  const found = findLesson(Number(m), lesson);
  if (!found) return { title: "Lesson not found" };
  return { title: `${found.id} ${found.title}` };
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { module: m, lesson: slug } = await params;
  const lesson = findLesson(Number(m), slug);
  if (!lesson) notFound();

  const entitlement = await getEntitlement();
  const completed = await getCompletedLessonIds(entitlement.userId);
  const locked = lesson.access === "paid" && !entitlement.hasAccess;

  const sidebar: SidebarModule[] = MODULES.map((mod) => ({
    number: mod.number,
    title: mod.title,
    lessons: mod.lessons.map((l) => ({
      id: l.id,
      title: l.shortTitle || l.title,
      href: lessonHref({ ...l, module: mod }),
      locked: l.access === "paid" && !entitlement.hasAccess,
      done: completed.has(l.id),
      free: l.access === "free",
    })),
  }));

  const next = lesson.next ? findLessonById(lesson.next) : undefined;
  const prev = lesson.prev ? findLessonById(lesson.prev) : undefined;
  const nextHref = next ? lessonHref(next) : null;

  // Locked lessons: read the frontmatter only. The body never leaves the server.
  const frontmatter = readFrontmatter("lessons", lesson.file);
  const doc = locked ? null : await loadDocument("lessons", lesson.file);


  return (
    <div className="container-page grid gap-8 py-8 pb-32 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)_13rem]">
      <div>
        <LessonSidebar modules={sidebar} currentId={lesson.id} />
      </div>

      <article className="min-w-0">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href="/curriculum" className="hover:underline">Curriculum</Link>
          <span aria-hidden="true"> / </span>
          <span>Module {lesson.module.number}: {lesson.module.title}</span>
        </nav>

        <header className="mt-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-tint px-3 py-1 font-semibold text-primary">Lesson {lesson.id}</span>
            <span className="text-muted">{lesson.durationMin} min</span>
            {lesson.access === "free" && (
              <span className="rounded-full bg-success-tint px-3 py-1 font-semibold text-success">Free</span>
            )}
            <VersionBadge version={frontmatter?.excelVersion} />
          </div>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-heading sm:text-4xl">{lesson.title}</h1>
        </header>

        {frontmatter?.keys && frontmatter.keys.length > 0 && (
          <div className="mt-5">
            <ShortcutBar keys={frontmatter.keys} />
          </div>
        )}

        {frontmatter?.objectives && frontmatter.objectives.length > 0 && !locked && (
          <section className="mt-6" aria-label="Learning objectives">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">After this lesson you can</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {frontmatter.objectives.map((o) => (
                <li key={o} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm">{o}</li>
              ))}
            </ul>
          </section>
        )}


        <div className="mt-8">
          {locked ? (
            <Paywall objectives={frontmatter?.objectives ?? []}>
              <p className="mt-5 text-sm text-muted">
                Plans start at {formatRupees(TIERS[0].pricePaise)}, with a 14-day refund window.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/pricing" className="rounded-xl bg-cta px-6 py-3 font-semibold text-cta-ink hover:brightness-110">
                  See plans
                </Link>
                {!entitlement.signedIn && (
                  <Link href={`/login?next=${encodeURIComponent(lessonHref(lesson))}`} className="rounded-xl border border-line px-6 py-3 font-semibold">
                    Sign in
                  </Link>
                )}
              </div>
            </Paywall>
          ) : doc ? (
            <QuizProvider lessonId={lesson.id} questions={doc.quiz ?? undefined}>
              {doc.content}
            </QuizProvider>
          ) : (
            <div className="rounded-2xl border border-line bg-tint p-6">
              <h2 className="text-xl font-semibold text-heading">This lesson is being finalised</h2>
              <p className="mt-2">It will appear here shortly. In the meantime you can continue with another lesson.</p>
            </div>
          )}
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {prev && <NextLesson href={lessonHref(prev)} label="Previous" title={prev.title} />}
          {next && nextHref && <NextLesson href={nextHref} label="Next lesson" title={next.title} />}
        </div>
      </article>

      {doc && (
        <div className="hidden xl:block">
          <OnThisPage items={doc.toc} />
        </div>
      )}
      {doc && (
        <div className="xl:hidden lg:col-start-2">
          <OnThisPage items={doc.toc} />
        </div>
      )}

      {!locked && doc && (
        <PrimaryAction
          lessonId={lesson.id}
          initialCompleted={completed.has(lesson.id)}
          signedIn={entitlement.signedIn}
          nextHref={nextHref}
          nextTitle={next?.shortTitle ?? next?.title ?? null}
        />
      )}
    </div>
  );
}
