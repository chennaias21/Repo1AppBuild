import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Callout, FormulaBlock, Kbd, MistakeTable, ShortcutTable, UseCase, VersionBadge } from "@/components/lesson/elements";
import { Shot, ShotPair } from "@/components/lesson/Shot";
import { Dataset, Exercise, Expected, Explanation, Hint, Scenario, Solution, Task } from "@/components/lesson/Exercise";
import Quiz from "@/components/lesson/Quiz";
import { Deliverable, Milestone, Rubric, Walkthrough } from "@/components/lesson/project";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) return textOf((node as { props: { children?: ReactNode } }).props.children);
  return "";
}

type P<T extends keyof React.JSX.IntrinsicElements> = ComponentPropsWithoutRef<T>;

/** Elements that appear in lesson bodies, styled once here. */
const elements = {
  h2: (props: P<"h2">) => (
    <h2
      id={slugify(textOf(props.children))}
      className="mb-4 mt-14 scroll-mt-24 border-t border-line pt-8 text-2xl font-bold text-heading first:mt-0 first:border-0 first:pt-0"
      {...props}
    />
  ),
  h3: (props: P<"h3">) => <h3 className="mb-3 mt-8 text-lg font-semibold text-heading" {...props} />,
  p: (props: P<"p">) => <p className="my-4 text-[1.02rem] leading-[1.75]" {...props} />,
  ul: (props: P<"ul">) => <ul className="my-4 list-disc space-y-1.5 pl-6 marker:text-accent" {...props} />,
  ol: (props: P<"ol">) => <ol className="my-4 list-decimal space-y-2 pl-6 marker:font-semibold marker:text-heading" {...props} />,
  li: (props: P<"li">) => <li className="pl-1 leading-[1.7]" {...props} />,
  strong: (props: P<"strong">) => <strong className="font-semibold text-ink" {...props} />,
  a: ({ href = "", ...rest }: P<"a">) => {
    const external = /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        className="font-medium text-link underline"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...rest}
      />
    );
  },
  blockquote: (props: P<"blockquote">) => (
    <blockquote className="my-6 border-l-4 border-accent bg-accent-tint px-5 py-3 [&>p]:my-1" {...props} />
  ),
  hr: () => <hr className="my-10 border-line" />,
  code: (props: P<"code">) => (
    <code className="rounded-md bg-code px-1.5 py-0.5 font-mono text-[0.88em] text-ink [pre_&]:bg-transparent [pre_&]:p-0" {...props} />
  ),
  pre: (props: P<"pre">) => (
    <pre
      className="my-6 overflow-x-auto rounded-xl border border-line bg-code p-4 font-mono text-[0.88rem] leading-7"
      tabIndex={0}
      {...props}
    />
  ),
  table: (props: P<"table">) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-line" role="region" aria-label="Table" tabIndex={0}>
      <table className="w-full min-w-max border-collapse text-left text-[0.93rem]" {...props} />
    </div>
  ),
  thead: (props: P<"thead">) => <thead className="bg-tint" {...props} />,
  th: (props: P<"th">) => <th className="whitespace-nowrap border-b border-line px-4 py-2.5 font-semibold text-heading" {...props} />,
  td: (props: P<"td">) => <td className="border-t border-line px-4 py-2.5 align-top" {...props} />,
};

/** Everything a lesson or project MDX file is allowed to use. */
export const mdxComponents = {
  ...elements,
  Shot,
  ShotPair,
  Exercise,
  Scenario,
  Dataset,
  Task,
  Expected,
  Hint,
  Solution,
  Explanation,
  Why: Explanation,
  Quiz,
  Kbd,
  ShortcutTable,
  FormulaBlock,
  Callout,
  MistakeTable,
  UseCase,
  VersionBadge,
  Milestone,
  Deliverable,
  Walkthrough,
  Rubric,
};
