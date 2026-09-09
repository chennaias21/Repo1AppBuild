import Link from "next/link";
import { notFound } from "next/navigation";
import { findLesson } from "@/lib/curriculum";
import { getCurrentProfile } from "@/lib/access";
import { createClient } from "@/lib/supabase/server";
import LessonCompleteToggle from "@/components/LessonCompleteToggle";
import LessonBody from "@/components/LessonBody";
import { COURSE_PRICE_INR } from "@/lib/razorpay";

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = findLesson(slug);
  if (!found) notFound();

  const { module, lesson } = found;
  const current = await getCurrentProfile();
  const unlocked = lesson.isFree || current?.profile.access_status === "paid";

  // The access check runs before anything lesson-specific is read below, so a
  // locked lesson's video id / body never even reaches this render — there is
  // nothing for a curious visitor to find in the page source.
  if (!unlocked) {
    return (
      <div className="container-page py-16 max-w-2xl text-center">
        <div className="text-4xl">🔒</div>
        <h1 className="mt-4 text-2xl font-bold">{lesson.title}</h1>
        <p className="mt-2 text-ink-500">{lesson.summary}</p>
        <p className="mt-6 text-ink-700">
          This is part of the full Excel Mastery course. Unlock everything for ₹{COURSE_PRICE_INR}.
        </p>
        <Link
          href="/checkout"
          className="mt-6 inline-block rounded-md bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
        >
          Unlock Full Course
        </Link>
      </div>
    );
  }

  let initialCompleted = false;
  if (current) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("lesson_progress")
      .select("completed")
      .eq("user_id", current.userId)
      .eq("lesson_slug", lesson.slug)
      .maybeSingle();
    initialCompleted = data?.completed ?? false;
  }

  return (
    <div className="container-page py-12 max-w-3xl">
      <Link href="/curriculum" className="text-sm text-brand-700 hover:underline">
        ← Back to curriculum
      </Link>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-brand-600">
        {module.title}
      </p>
      <h1 className="mt-1 text-3xl font-bold">{lesson.title}</h1>
      <p className="mt-2 text-ink-500">{lesson.summary}</p>

      {lesson.videoId && (
        <div className="mt-6 aspect-video overflow-hidden rounded-lg border border-black/10">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${lesson.videoId}`}
            title={lesson.title}
            allowFullScreen
          />
        </div>
      )}

      <LessonBody content={lesson.content} />

      {current && (
        <div className="mt-8">
          <LessonCompleteToggle lessonSlug={lesson.slug} initialCompleted={initialCompleted} />
        </div>
      )}
    </div>
  );
}
