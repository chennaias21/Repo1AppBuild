import Link from "next/link";
import type { Lesson } from "@/lib/curriculum";

const TYPE_LABEL: Record<Lesson["type"], string> = {
  lesson: "Lesson",
  exercise: "Exercise",
  quiz: "Quiz",
  "shortcut-challenge": "Shortcut Challenge",
  project: "Project",
  "cheat-sheet": "Cheat Sheet",
};

export default function LessonCard({
  lesson,
  moduleSlug,
  hasFullAccess,
  completed,
}: {
  lesson: Lesson;
  moduleSlug: string;
  hasFullAccess: boolean;
  completed?: boolean;
}) {
  const unlocked = lesson.isFree || hasFullAccess;

  const content = (
    <div
      className={`flex items-center justify-between rounded-lg border p-4 transition ${
        unlocked
          ? "border-black/10 bg-white hover:border-brand-400 hover:shadow-sm"
          : "border-black/5 bg-black/[0.02]"
      }`}
    >
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-600">
          <span>{TYPE_LABEL[lesson.type]}</span>
          {lesson.isFree && (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-brand-700">Free</span>
          )}
          {completed && (
            <span className="rounded-full bg-ink-900/5 px-2 py-0.5 text-ink-700">Completed</span>
          )}
        </div>
        <h3 className={`mt-1 font-semibold ${unlocked ? "text-ink-900" : "text-ink-500"}`}>
          {lesson.title}
        </h3>
        <p className="mt-1 text-sm text-ink-500">{lesson.summary}</p>
      </div>
      <div className="ml-4 shrink-0 text-right">
        <div className="text-xs text-ink-500">{lesson.durationMinutes} min</div>
        {!unlocked && <div className="mt-1 text-lg" aria-label="Locked">🔒</div>}
      </div>
    </div>
  );

  if (!unlocked) {
    return <div data-module={moduleSlug}>{content}</div>;
  }

  return (
    <Link href={`/lesson/${lesson.slug}`} data-module={moduleSlug}>
      {content}
    </Link>
  );
}
