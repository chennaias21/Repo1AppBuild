"use client";

import Link from "next/link";
import { useState } from "react";

export interface SidebarModule {
  number: number;
  title: string;
  lessons: { id: string; title: string; href: string; locked: boolean; done: boolean; free: boolean }[];
}

function Contents({ modules, currentId, onNavigate }: { modules: SidebarModule[]; currentId: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Course contents" className="space-y-3">
      {modules.map((m) => {
        const done = m.lessons.filter((l) => l.done).length;
        const isCurrent = m.lessons.some((l) => l.id === currentId);
        return (
          <details key={m.number} open={isCurrent} className="group rounded-xl border border-line bg-surface">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-3.5 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white" aria-hidden="true">
                {m.number}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-heading">{m.title}</span>
                <span className="block text-xs text-muted">
                  {done}/{m.lessons.length} complete
                </span>
              </span>
              <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-90">›</span>
            </summary>
            <ul className="border-t border-line py-1.5">
              {m.lessons.map((l) => {
                const current = l.id === currentId;
                return (
                  <li key={l.id}>
                    <Link
                      href={l.href}
                      onClick={onNavigate}
                      aria-current={current ? "page" : undefined}
                      className={`flex items-start gap-2.5 px-3.5 py-2 text-sm hover:bg-tint ${current ? "bg-tint font-semibold text-heading" : "text-ink"}`}
                    >
                      <span className="mt-0.5 w-5 shrink-0 text-center" aria-hidden="true">
                        {l.done ? <span className="text-success">✓</span> : current ? <span className="text-accent">►</span> : l.locked ? <span className="text-muted">🔒</span> : <span className="text-muted">○</span>}
                      </span>
                      <span className="min-w-0">
                        <span className="text-muted">{l.id}</span> {l.title}
                        <span className="sr-only">
                          {l.done ? " (completed)" : ""}
                          {l.locked ? " (locked)" : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
    </nav>
  );
}

export default function LessonSidebar({ modules, currentId }: { modules: SidebarModule[]; currentId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop: sticky column */}
      <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 lg:block">
        <Contents modules={modules} currentId={currentId} />
      </aside>

      {/* Phones and tablets: drawer */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-left font-semibold text-heading"
          aria-haspopup="dialog"
        >
          <span>Course contents</span>
          <span aria-hidden="true">☰</span>
        </button>
        {open && (
          <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Course contents">
            <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close contents" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-[88%] max-w-sm overflow-y-auto bg-page p-4 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-heading">Course contents</p>
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-line px-3 py-1.5 text-sm">
                  Close ✕
                </button>
              </div>
              <Contents modules={modules} currentId={currentId} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
