import raw from "../../data/curriculum.json";

export type Stage = "Beginner" | "Intermediate" | "Advanced" | "Business-Ready";

export interface LessonRef {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  durationMin: number;
  access: "free" | "paid";
  file: string;
  prev: string | null;
  next: string | null;
}

export interface ProjectRef {
  id: string;
  slug: string;
  title: string;
  skills: string;
  estimatedMin: number;
  file: string;
}

export interface ModuleRef {
  number: number;
  title: string;
  stage: Stage;
  promise: string;
  lessons: LessonRef[];
  projects?: ProjectRef[];
  assessment: string;
  miniProject?: string;
}

export interface CourseMeta {
  title: string;
  totalModules: number;
  totalLessons: number;
  totalProjects: number;
  lessonMinutes: number;
  projectMinutes: number;
  estimatedHours: number;
  freeLessons: number;
  stages: Stage[];
}

/**
 * The only source for navigation, lock state and progress.
 * Never derive the curriculum by globbing content/lessons: a half-written
 * file must not appear in the nav.
 */
const COURSE_RAW = (raw as unknown as { course: CourseMeta }).course;
export const MODULES = (raw as unknown as { modules: ModuleRef[] }).modules;

export type LessonWithModule = LessonRef & { module: ModuleRef };

export const ALL_LESSONS: LessonWithModule[] = MODULES.flatMap((m) =>
  m.lessons.map((l) => ({ ...l, module: m }))
);

export function findLessonById(id: string): LessonWithModule | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}

export function findLesson(moduleNumber: number, slug: string): LessonWithModule | undefined {
  return ALL_LESSONS.find((l) => l.module.number === moduleNumber && l.slug === slug);
}

export function findProject(slug: string): { project: ProjectRef; module: ModuleRef } | undefined {
  for (const m of MODULES) {
    const project = m.projects?.find((p) => p.slug === slug);
    if (project) return { project, module: m };
  }
  return undefined;
}

export function lessonHref(l: Pick<LessonWithModule, "slug"> & { module: { number: number } }): string {
  return `/learn/${l.module.number}/${l.slug}`;
}

export function projectHref(slug: string): string {
  return `/learn/8/project/${slug}`;
}

export const FREE_LESSONS = ALL_LESSONS.filter((l) => l.access === "free");

export function moduleMinutes(m: ModuleRef): number {
  return m.lessons.reduce((sum, l) => sum + l.durationMin, 0);
}

/** Course facts. Lesson counts come from the lessons themselves so they can never drift from the data. */
export const COURSE: CourseMeta = {
  ...COURSE_RAW,
  totalLessons: ALL_LESSONS.length,
  freeLessons: FREE_LESSONS.length,
};
