import type { Lesson, Module } from "@/lib/content-types";
import { basicsModule } from "@/content/01-basics";
import { formattingModule } from "@/content/02-formatting";
import { dataCleaningModule } from "@/content/03-data-cleaning";
import { formulasModule } from "@/content/04-formulas";
import { analysisModule } from "@/content/05-analysis";
import { pivotTablesModule } from "@/content/06-pivot-tables";
import { dashboardsModule } from "@/content/07-dashboards";
import { advancedModule } from "@/content/08-advanced";
import { powerQueryModule } from "@/content/09-power-query";
import { automationModule } from "@/content/10-automation";

export type { Lesson, Module, LessonType, LessonContent } from "@/lib/content-types";

export const CURRICULUM: Module[] = [
  basicsModule,
  formattingModule,
  dataCleaningModule,
  formulasModule,
  analysisModule,
  pivotTablesModule,
  dashboardsModule,
  advancedModule,
  powerQueryModule,
  automationModule,
];

export function allLessons(): Lesson[] {
  return CURRICULUM.flatMap((m) => m.lessons);
}

export function findLesson(slug: string): { module: Module; lesson: Lesson } | undefined {
  for (const mod of CURRICULUM) {
    const lesson = mod.lessons.find((l) => l.slug === slug);
    if (lesson) return { module: mod, lesson };
  }
  return undefined;
}

export function totalLessonCount(): number {
  return allLessons().length;
}
