import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import { MODULES, findProject, lessonHref } from "@/lib/curriculum";
import { loadDocument, readFrontmatter } from "@/lib/content/lessons";
import { getEntitlement } from "@/lib/access";
import { getCompletedLessonIds } from "@/lib/progress";
import { Paywall } from "@/components/lesson/journey";
import LessonSidebar, { type SidebarModule } from "@/components/lesson/LessonSidebar";
import OnThisPage from "@/components/lesson/OnThisPage";
import { formatRupees, TIERS } from "@/lib/tiers";

export function generateStaticParams() {
  return MODULES.flatMap((m) => (m.projects ?? []).map((p) => ({ slug: p.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const found = findProject(slug);
  return { title: found ? `${found.project.id} ${found.project.title}` : "Project not found" };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = findProject(slug);
  if (!found) notFound();
  const { project } = found;

  const entitlement = await getEntitlement();
  const completed = await getCompletedLessonIds(entitlement.userId);
  const locked = !entitlement.hasAccess;

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

  const frontmatter = readFrontmatter("projects", project.file);
  const doc = locked ? null : await loadDocument("projects", project.file, { hideSolution: !entitlement.fullProjects, reviewIncluded: (entitlement.tier?.instructorReviews ?? 0) > 0 });
  const datasets = (frontmatter?.datasets ?? [])
    .map((name) => `starter/${name}.xlsx`)
    .filter((f) => fs.existsSync(path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "files", f)));

  return (
    <div className="container-page grid gap-8 py-8 pb-24 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)_13rem]">
      <div>
        <LessonSidebar modules={sidebar} currentId={project.id} />
      </div>
      <article className="min-w-0">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href="/curriculum" className="hover:underline">Curriculum</Link>
          <span aria-hidden="true"> / </span>
          <span>Module 8 projects</span>
        </nav>
        <header className="mt-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-tint px-3 py-1 font-semibold text-primary">Project {project.id}</span>
            <span className="text-muted">About {Math.round(project.estimatedMin / 60 * 10) / 10} hours</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-heading sm:text-4xl">{project.title}</h1>
          <p className="mt-3 text-muted">Skills: {project.skills}</p>
        </header>

        {datasets.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-3">
            {datasets.map((f) => (
              <li key={f}>
                <a href={`/files/${f}`} download className="inline-flex rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-tint">
                  Download {f.replace("starter/", "")} ↓
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8">
          {locked ? (
            <Paywall objectives={[]}>
              <p className="mt-4">Projects are part of the paid plans, starting at {formatRupees(TIERS[0].pricePaise)}.</p>
              <Link href="/pricing" className="mt-5 inline-flex rounded-xl bg-cta px-6 py-3 font-semibold text-cta-ink hover:brightness-110">See plans</Link>
            </Paywall>
          ) : doc ? (
            <>
              {doc.content}
              {!entitlement.fullProjects && (
                <div className="my-8 rounded-2xl border-2 border-accent/60 bg-accent-tint p-6">
                  <h2 className="text-xl font-bold text-heading">Solution walkthrough</h2>
                  <p className="mt-2">Step-by-step solutions are included in the Complete plans. Your Essentials plan includes the full project brief and data.</p>
                  <Link href="/pricing" className="mt-4 inline-flex rounded-xl bg-cta px-5 py-2.5 font-semibold text-cta-ink hover:brightness-110">Compare plans</Link>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-line bg-tint p-6">
              <h2 className="text-xl font-semibold text-heading">This project is being finalised</h2>
              <p className="mt-2">It will appear here shortly.</p>
            </div>
          )}
        </div>
      </article>
      {doc && <div className="hidden xl:block"><OnThisPage items={doc.toc} /></div>}
    </div>
  );
}
