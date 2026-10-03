import type { Metadata } from "next";
import Link from "next/link";
import { COURSE, MODULES, lessonHref, moduleMinutes, projectHref } from "@/lib/curriculum";
import CurriculumList, { type CurriculumModule } from "@/components/CurriculumList";

export const metadata: Metadata = { title: "Curriculum" };

export default function CurriculumPage() {
  const modules: CurriculumModule[] = MODULES.map((m) => ({
    number: m.number,
    title: m.title,
    stage: m.stage,
    promise: m.promise,
    minutes: moduleMinutes(m),
    lessons: m.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      href: lessonHref({ ...l, module: m }),
      durationMin: l.durationMin,
      free: l.access === "free",
    })),
    projects: (m.projects ?? []).map((p) => ({ id: p.id, title: p.title, href: projectHref(p.slug), skills: p.skills })),
  }));

  return (
    <div className="container-page max-w-4xl py-14">
      <h1 className="text-4xl font-bold text-heading">The full curriculum</h1>
      <p className="mt-4 text-lg text-muted">
        {COURSE.totalModules} modules, {COURSE.totalLessons} lessons and {COURSE.totalProjects} capstone projects, about {COURSE.estimatedHours} hours in all.
        Modules 1 and 2 are <Link href="/free" className="font-semibold text-link underline">free</Link>.
      </p>
      <div className="mt-8">
        <CurriculumList modules={modules} />
      </div>
    </div>
  );
}
