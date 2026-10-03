import type { ReactNode } from "react";

/** A keyboard key that looks physical: raised cap with a thicker bottom edge. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="mx-0.5 inline-block rounded-md border border-key-edge border-b-[3px] bg-key px-2 py-0.5 align-baseline font-mono text-[0.82em] font-semibold leading-snug text-ink shadow-[0_1px_0_var(--key-edge)]">
      {children}
    </kbd>
  );
}

/** Splits "Ctrl+Shift+L" into physical keys joined by plus signs. */
export function KeyCombo({ combo }: { combo: string }) {
  const keys = combo.split("+").map((k) => k.trim()).filter(Boolean);
  return (
    <span className="inline-flex flex-wrap items-center gap-0.5">
      {keys.map((k, i) => (
        <span key={`${k}-${i}`} className="inline-flex items-center">
          {i > 0 && <span className="px-0.5 text-muted" aria-hidden="true">+</span>}
          <Kbd>{k}</Kbd>
        </span>
      ))}
    </span>
  );
}

/** The 2-4 keystrokes a lesson teaches, shown above the lesson title. */
export function ShortcutBar({ keys }: { keys: string[] }) {
  if (!keys?.length) return null;
  return (
    <div
      className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-line bg-tint px-4 py-3"
      aria-label="Keyboard shortcuts in this lesson"
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">Keys you&apos;ll use</span>
      {keys.map((k) => (
        <KeyCombo key={k} combo={k} />
      ))}
    </div>
  );
}

type CalloutType = "tip" | "warning" | "note" | "story";

const CALLOUT_STYLE: Record<CalloutType, { label: string; box: string; badge: string; icon: string }> = {
  tip: { label: "Pro tip", box: "border-success/40 bg-success-tint", badge: "text-success", icon: "💡" },
  warning: { label: "Watch out", box: "border-danger/40 bg-danger-tint", badge: "text-danger", icon: "⚠" },
  note: { label: "Note", box: "border-sky/40 bg-tint", badge: "text-link", icon: "ℹ" },
  story: { label: "In the real world", box: "border-accent/50 bg-accent-tint", badge: "text-accent", icon: "📖" },
};

export function Callout({ type = "note", title, children }: { type?: CalloutType; title?: string; children: ReactNode }) {
  const s = CALLOUT_STYLE[type] ?? CALLOUT_STYLE.note;
  return (
    <aside className={`my-6 rounded-xl border-l-4 border px-5 py-4 ${s.box}`} role="note">
      <p className={`mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${s.badge}`}>
        <span aria-hidden="true">{s.icon}</span>
        {title ?? s.label}
      </p>
      <div className="space-y-2 text-[0.97rem] [&>p:last-child]:mb-0">{children}</div>
    </aside>
  );
}

/** Real-world story. Visually distinct: this is the part learners remember. */
export function UseCase({ children, title }: { children: ReactNode; title?: string }) {
  return <Callout type="story" title={title}>{children}</Callout>;
}

/** Formula anatomy in monospace. Wrap a fenced code block or plain text. */
export function FormulaBlock({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <figure className="my-6 overflow-hidden rounded-xl border border-line bg-code">
      <figcaption className="border-b border-line px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
        {title ?? "Formula"}
      </figcaption>
      <div className="overflow-x-auto px-4 py-4 font-mono text-[0.92rem] leading-7 text-ink [&_pre]:m-0 [&_pre]:border-0 [&_pre]:bg-transparent [&_pre]:p-0">
        {children}
      </div>
    </figure>
  );
}

export function ShortcutTable({ children }: { children: ReactNode }) {
  return <div aria-label="Keyboard shortcuts">{children}</div>;
}

export function MistakeTable({ children }: { children: ReactNode }) {
  return <div aria-label="Common mistakes">{children}</div>;
}

export function VersionBadge({ version }: { version?: string }) {
  if (!version || version === "all") return null;
  const label = version === "365" ? "Microsoft 365 only" : `Excel ${version}`;
  return (
    <span className="inline-flex items-center rounded-full border border-amber/60 bg-warn-tint px-3 py-1 text-xs font-semibold text-ink">
      {label}
    </span>
  );
}
