"use client";

import { useState, type ReactNode } from "react";

export function Milestone({ n, title, children }: { n: string | number; title: string; children: ReactNode }) {
  return (
    <section className="my-6 rounded-2xl border border-line bg-surface p-5 shadow-card" aria-label={`Milestone ${n}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy font-bold text-white" aria-hidden="true">
          {n}
        </span>
        <h3 className="text-lg font-semibold text-heading">{title}</h3>
      </div>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

/** Tick-off checklist. Ticks are kept in this browser only; they are a personal aid, not progress data. */
export function Deliverable({ children }: { children: ReactNode }) {
  return <div className="my-5 rounded-2xl border border-line bg-tint px-5 py-4 [&_ul]:list-none [&_ul]:pl-0">{children}</div>;
}

/** Collapsed by default: opening it straight away means the project hasn't been attempted. */
export function Walkthrough({ children, title = "Show the solution walkthrough" }: { children: ReactNode; title?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-6">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-tint"
      >
        {open ? "Hide walkthrough" : title}
      </button>
      {open && <div className="mt-4 rounded-2xl border border-line bg-surface p-5">{children}</div>}
    </div>
  );
}

export function Rubric({ children }: { children: ReactNode }) {
  return (
    <div className="my-6" aria-label="Marking rubric">
      {children}
    </div>
  );
}
