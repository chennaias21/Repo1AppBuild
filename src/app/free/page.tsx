import type { Metadata } from "next";
import Link from "next/link";
import { MODULES, lessonHref, moduleMinutes } from "@/lib/curriculum";

export const metadata: Metadata = { title: "Free lessons" };

export default function FreePage() {
  const free = MODULES.filter((m) => m.lessons.some((l) => l.access === "free"));
  return (
    <div className="container-page max-w-4xl py-14">
      <h1 className="text-4xl font-bold text-heading">Start free, no sign-up</h1>
      <p className="mt-4 text-lg text-muted">
        Modules 1 and 2 are open to everyone: 12 lessons that take you from your first workbook to confident, tidy spreadsheets. Sign in free only if you want your progress saved.
      </p>
      <div className="mt-10 space-y-8">
        {free.map((m) => (
          <section key={m.number} aria-labelledby={`m-${m.number}`} className="rounded-2xl border border-line bg-surface p-6 shadow-card">
            <p className="text-xs font-bold uppercase tracking-wider text-accent">Module {m.number} · {m.stage} · {moduleMinutes(m)} min</p>
            <h2 id={`m-${m.number}`} className="mt-1 text-2xl font-bold text-heading">{m.title}</h2>
            <p className="mt-2 text-muted">{m.promise}</p>
            <ol className="mt-5 divide-y divide-line">
              {m.lessons.map((l) => (
                <li key={l.id}>
                  <Link href={lessonHref({ ...l, module: m })} className="flex items-center justify-between gap-4 py-3 hover:text-primary">
                    <span><span className="text-muted">{l.id}</span> {l.title}</span>
                    <span className="shrink-0 text-sm text-muted">{l.durationMin} min</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
