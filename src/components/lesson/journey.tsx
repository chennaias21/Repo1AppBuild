import Link from "next/link";
import type { ReactNode } from "react";

export function ProgressBar({ value, label, className = "" }: { value: number; label?: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={className}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={label ?? "Progress"}
        className="h-2.5 w-full overflow-hidden rounded-full bg-line"
      >
        <div className="h-full rounded-full bg-teal transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function NextLesson({ href, label, title }: { href: string; label: string; title: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card hover:border-primary"
    >
      <span>
        <span className="block text-xs font-bold uppercase tracking-wider text-muted">{label}</span>
        <span className="mt-1 block text-lg font-semibold text-heading">{title}</span>
      </span>
      <span aria-hidden="true" className="text-2xl text-accent transition-transform group-hover:translate-x-1">→</span>
    </Link>
  );
}

/** Objectives are public on purpose: specific desire converts better than a bare lock. */
export function Paywall({
  objectives,
  children,
}: {
  objectives: string[];
  children?: ReactNode;
}) {
  return (
    <section className="my-8 rounded-2xl border-2 border-accent/60 bg-accent-tint p-6 sm:p-8" aria-label="Unlock this lesson">
      <p className="text-xs font-bold uppercase tracking-wider text-accent">Part of the full course</p>
      <h2 className="mt-2 text-2xl font-bold text-heading">Unlock this lesson</h2>
      {objectives.length > 0 && (
        <>
          <p className="mt-4 text-sm font-semibold text-ink">After this lesson you will be able to:</p>
          <ul className="mt-2 space-y-2">
            {objectives.map((o) => (
              <li key={o} className="flex gap-2.5">
                <span className="mt-0.5 text-teal" aria-hidden="true">✓</span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {children}
    </section>
  );
}

/** Stage progress motif: the logo's four steps, filled up to the current stage. */
export function Staircase({ filled, className = "h-6" }: { filled: number; className?: string }) {
  const colors = ["#004080", "#1888d0", "#089898", "#f88c10"];
  return (
    <svg viewBox="0 0 48 28" className={className} role="img" aria-label={`Step ${filled} of 4`}>
      {colors.map((c, i) => {
        const h = (i + 1) * 6 + 4;
        return (
          <rect
            key={c}
            x={i * 12}
            y={28 - h}
            width={10}
            height={h}
            rx={1.5}
            fill={i < filled ? c : "currentColor"}
            opacity={i < filled ? 1 : 0.15}
          />
        );
      })}
    </svg>
  );
}
