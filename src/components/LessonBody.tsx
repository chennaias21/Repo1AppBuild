import type { LessonContent } from "@/lib/content-types";
import Quiz from "@/components/Quiz";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 text-lg font-bold text-ink-900">{children}</h2>;
}

function Callout({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-6 rounded-lg border border-brand-200 bg-brand-50 p-5">
      <h3 className="text-sm font-bold uppercase tracking-wide text-brand-700">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-ink-700">
            <span className="text-brand-600">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LessonBody({ content }: { content: LessonContent }) {
  if (content.kind === "lesson") {
    return (
      <div>
        <div className="mt-6 rounded-lg border-l-4 border-brand-500 bg-brand-50/60 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand-700">
            The situation
          </h2>
          <p className="mt-2 text-ink-700">{content.scenario}</p>
        </div>

        <SectionHeading>What you&apos;ll be able to do</SectionHeading>
        <ul className="mt-3 space-y-2">
          {content.objectives.map((objective, i) => (
            <li key={i} className="flex gap-2 text-ink-700">
              <span className="text-brand-600">✓</span>
              <span>{objective}</span>
            </li>
          ))}
        </ul>

        <SectionHeading>Step by step</SectionHeading>
        <ol className="mt-4 space-y-5">
          {content.steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold text-ink-900">{step.title}</h3>
                <p className="mt-1 text-ink-700">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <Callout title="Tips and hacks" items={content.tips} />

        {content.practice && (
          <div className="mt-6 rounded-lg border border-black/10 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-ink-500">
              Try it now
            </h3>
            <p className="mt-2 text-ink-700">{content.practice}</p>
          </div>
        )}
      </div>
    );
  }

  if (content.kind === "exercise") {
    return (
      <div>
        <div className="mt-6 rounded-lg border-l-4 border-brand-500 bg-brand-50/60 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand-700">
            The brief
          </h2>
          <p className="mt-2 text-ink-700">{content.scenario}</p>
        </div>

        <SectionHeading>Your tasks</SectionHeading>
        <ol className="mt-3 space-y-2">
          {content.tasks.map((task, i) => (
            <li key={i} className="flex gap-3 text-ink-700">
              <span className="font-semibold text-brand-600">{i + 1}.</span>
              <span>{task}</span>
            </li>
          ))}
        </ol>

        <Callout title="Hints" items={content.hints} />

        <details className="mt-6 rounded-lg border border-black/10 p-5">
          <summary className="cursor-pointer font-semibold text-ink-900">
            Show the solution
          </summary>
          <ol className="mt-4 space-y-3">
            {content.solution.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-ink-700">
                <span className="font-semibold text-brand-600">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </details>
      </div>
    );
  }

  if (content.kind === "quiz") {
    return (
      <div>
        <p className="mt-6 text-ink-700">{content.intro}</p>
        <Quiz questions={content.questions} />
      </div>
    );
  }

  if (content.kind === "project") {
    return (
      <div>
        <div className="mt-6 rounded-lg border-l-4 border-brand-500 bg-brand-50/60 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand-700">
            The brief
          </h2>
          <p className="mt-2 text-ink-700">{content.scenario}</p>
        </div>

        <SectionHeading>What you&apos;ll deliver</SectionHeading>
        <ul className="mt-3 space-y-2">
          {content.deliverables.map((item, i) => (
            <li key={i} className="flex gap-2 text-ink-700">
              <span className="text-brand-600">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <SectionHeading>How to build it</SectionHeading>
        <ol className="mt-4 space-y-5">
          {content.steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold text-ink-900">{step.title}</h3>
                <p className="mt-1 text-ink-700">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <Callout title="You're done when" items={content.successCriteria} />
      </div>
    );
  }

  if (content.kind === "shortcuts") {
    return (
      <div>
        <p className="mt-6 text-ink-700">{content.intro}</p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-black/10">
                <th className="py-2 pr-4 font-semibold text-ink-900">Shortcut</th>
                <th className="py-2 pr-4 font-semibold text-ink-900">What it does</th>
                <th className="py-2 font-semibold text-ink-900">When to use it</th>
              </tr>
            </thead>
            <tbody>
              {content.shortcuts.map((s, i) => (
                <tr key={i} className="border-b border-black/5">
                  <td className="py-3 pr-4">
                    <code className="rounded bg-ink-900/[0.06] px-2 py-1 font-mono text-xs font-semibold text-ink-900">
                      {s.keys}
                    </code>
                  </td>
                  <td className="py-3 pr-4 text-ink-700">{s.action}</td>
                  <td className="py-3 text-ink-500">{s.whenToUse}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-lg border-l-4 border-brand-500 bg-brand-50/60 p-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-brand-700">
            The challenge
          </h3>
          <p className="mt-2 text-ink-700">{content.challenge}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mt-6 text-ink-700">{content.intro}</p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-black/10">
              <th className="py-2 pr-4 font-semibold text-ink-900">Item</th>
              <th className="py-2 pr-4 font-semibold text-ink-900">Syntax</th>
              <th className="py-2 font-semibold text-ink-900">Notes</th>
            </tr>
          </thead>
          <tbody>
            {content.rows.map((row, i) => (
              <tr key={i} className="border-b border-black/5">
                <td className="py-3 pr-4 font-medium text-ink-900">{row.item}</td>
                <td className="py-3 pr-4">
                  {row.syntax ? (
                    <code className="rounded bg-ink-900/[0.06] px-2 py-1 font-mono text-xs text-ink-900">
                      {row.syntax}
                    </code>
                  ) : (
                    <span className="text-ink-500">—</span>
                  )}
                </td>
                <td className="py-3 text-ink-700">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
