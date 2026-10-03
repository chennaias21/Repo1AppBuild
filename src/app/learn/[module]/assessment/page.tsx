import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MODULES, lessonHref } from "@/lib/curriculum";
import { assessmentIsFree, loadAssessment, toPublic } from "@/lib/assessments";
import { getEntitlement } from "@/lib/access";
import { Paywall } from "@/components/lesson/journey";
import AssessmentRunner from "@/components/AssessmentRunner";

export async function generateMetadata({ params }: { params: Promise<{ module: string }> }): Promise<Metadata> {
  const { module: m } = await params;
  const mod = MODULES.find((x) => x.number === Number(m));
  return { title: mod ? `Module ${mod.number} assessment` : "Assessment not found" };
}

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function AssessmentPage({ params }: { params: Promise<{ module: string }> }) {
  const { module: m } = await params;
  const mod = MODULES.find((x) => x.number === Number(m));
  if (!mod) notFound();
  const assessment = loadAssessment(mod.number);
  if (!assessment) notFound();

  const e = await getEntitlement();
  const locked = !assessmentIsFree(mod) && !e.hasAccess;
  const nextModule = MODULES.find((x) => x.number === mod.number + 1);
  const nextHref = nextModule ? lessonHref({ ...nextModule.lessons[0], module: nextModule }) : "/dashboard";
  const lessonLinks = Object.fromEntries(mod.lessons.map((l) => [l.id, lessonHref({ ...l, module: mod })]));
  const questions = assessment.shuffleQuestions ? shuffled(toPublic(assessment)) : toPublic(assessment);

  return (
    <div className="container-page max-w-3xl py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/curriculum" className="hover:underline">Curriculum</Link>
        <span aria-hidden="true"> / </span>
        <span>Module {mod.number}: {mod.title}</span>
      </nav>
      <h1 className="mt-4 text-3xl font-bold text-heading sm:text-4xl">{assessment.title}</h1>
      <p className="mt-2 text-lg text-muted">{assessment.subtitle}</p>
      <p className="mt-4">{assessment.description}</p>
      <p className="mt-2 text-sm text-muted">
        {assessment.questionCount} questions. Pass with {assessment.passRequires} correct ({assessment.passMark}%). Unlimited retakes.
      </p>

      <div className="mt-8">
        {locked ? (
          <Paywall objectives={[]}>
            <p className="mt-4">The Module {mod.number} assessment is part of the paid plans.</p>
            <Link href="/pricing" className="mt-5 inline-flex rounded-xl bg-cta px-6 py-3 font-semibold text-cta-ink hover:brightness-110">See plans</Link>
          </Paywall>
        ) : (
          <AssessmentRunner
            moduleNumber={mod.number}
            questions={questions}
            lessonLinks={lessonLinks}
            nextHref={nextHref}
            signedIn={e.signedIn}
          />
        )}
      </div>
    </div>
  );
}
