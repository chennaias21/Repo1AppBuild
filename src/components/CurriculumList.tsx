"use client";

import Link from "next/link";
import { useState } from "react";

export interface CurriculumModule {
  number: number;
  title: string;
  stage: string;
  promise: string;
  minutes: number;
  lessons: { id: string; title: string; href: string; durationMin: number; free: boolean }[];
  projects: { id: string; title: string; href: string; skills: string }[];
}

const FILTERS = ["All", "Free", "Beginner", "Intermediate", "Advanced", "Business-Ready"] as const;

export default function CurriculumList({ modules }: { modules: CurriculumModule[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const shown = modules.filter((m) =>
    filter === "All" ? true : filter === "Free" ? m.lessons.some((l) => l.free) : m.stage === filter
  );

  return (
    <div>
      <div role="group" aria-label="Filter modules" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
              filter === f ? "border-primary bg-primary text-primary-ink" : "border-line bg-surface text-ink hover:border-primary"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {shown.map((m) => (
          <details key={m.number} className="group rounded-2xl border border-line bg-surface">
            <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy font-bold text-white" aria-hidden="true">{m.number}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold text-heading">{m.title}</span>
                <span className="block text-sm text-muted">{m.stage} · {m.lessons.length} lessons · {m.minutes} min</span>
              </span>
              <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-90">›</span>
            </summary>
            <div className="border-t border-line px-5 py-4">
              <p className="text-muted">{m.promise}</p>
              <ol className="mt-3 divide-y divide-line">
                {m.lessons.map((l) => (
                  <li key={l.id}>
                    <Link href={l.href} className="flex items-center justify-between gap-3 py-2.5 hover:text-primary">
                      <span><span className="text-muted">{l.id}</span> {l.title}</span>
                      <span className="flex shrink-0 items-center gap-2 text-sm">
                        {l.free ? (
                          <span className="rounded-full bg-success-tint px-2.5 py-0.5 font-semibold text-success">Free</span>
                        ) : (
                          <span className="text-muted" aria-label="Paid lesson">🔒</span>
                        )}
                        <span className="text-muted">{l.durationMin} min</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
              {m.projects.length > 0 && (
                <div className="mt-4 rounded-xl bg-tint p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-accent">Capstone projects</p>
                  <ul className="mt-2 space-y-2">
                    {m.projects.map((p) => (
                      <li key={p.id}>
                        <Link href={p.href} className="font-semibold hover:text-primary">{p.id} {p.title}</Link>
                        <span className="block text-sm text-muted">{p.skills}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </details>
        ))}
        {shown.length === 0 && <p className="text-muted">No modules match this filter.</p>}
      </div>
    </div>
  );
}
