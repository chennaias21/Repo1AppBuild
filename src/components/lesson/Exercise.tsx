import fs from "node:fs";
import path from "node:path";
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import ExerciseReveals from "@/components/lesson/ExerciseReveals";

function Block({ label, children, tone = "plain" }: { label: string; children: ReactNode; tone?: "plain" | "accent" }) {
  return (
    <div className={`mt-5 ${tone === "accent" ? "rounded-xl border border-line bg-tint px-5 py-4" : ""}`}>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      <div className="space-y-2 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol>li]:mb-1.5">{children}</div>
    </div>
  );
}

export function Scenario({ children }: { children: ReactNode }) {
  return <Block label="Scenario">{children}</Block>;
}

export function Task({ children }: { children: ReactNode }) {
  return <Block label="Your task">{children}</Block>;
}

export function Expected({ children }: { children: ReactNode }) {
  return <Block label="What you should end up with" tone="accent">{children}</Block>;
}

/** Content wrappers: the reveal component decides when each is shown. */
export function Hint({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
export function Solution({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
export function Explanation({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/**
 * A dataset renders as a real HTML table, never an image, so learners can copy it.
 * The starter-file download appears only when that file is actually on disk:
 * most datasets are small on purpose and typing them is the practice.
 */
export function Dataset({ name, starter, children }: { name?: string; starter?: string; children: ReactNode }) {
  const hasFile = Boolean(starter) && fs.existsSync(path.join(process.cwd(), "public", "files", starter!));
  return (
    <div className="mt-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          Dataset{name ? `: ${name.replaceAll("_", " ")}` : ""}
        </p>
        {hasFile && (
          <a
            href={`/files/${starter}`}
            download
            className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-ink hover:brightness-110"
          >
            Download starter file
          </a>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function typeOf(node: ReactNode): unknown {
  return isValidElement(node) ? (node as ReactElement).type : undefined;
}

export function Exercise({ children }: { id?: string; children: ReactNode }) {
  const kids = Children.toArray(children);
  const pick = (t: unknown) => kids.find((k) => typeOf(k) === t);
  const rest = kids.filter((k) => ![Hint, Solution, Explanation].includes(typeOf(k) as never));

  const hint = pick(Hint);
  const solution = pick(Solution);
  const explanation = pick(Explanation);

  return (
    <section aria-label="Practice exercise" className="my-8 rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-7">
      <p className="inline-block rounded-full bg-accent-tint px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">
        Practice
      </p>
      {rest}
      <ExerciseReveals hint={hint} solution={solution} explanation={explanation} />
    </section>
  );
}
