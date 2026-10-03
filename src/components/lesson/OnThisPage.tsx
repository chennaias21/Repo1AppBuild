import type { TocItem } from "@/lib/content/lessons";

/** Sticky outline on wide screens; a plain dropdown of the same links on small ones. */
export default function OnThisPage({ items }: { items: TocItem[] }) {
  if (!items.length) return null;
  return (
    <>
      <details className="rounded-xl border border-line bg-surface xl:hidden">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-heading">On this page</summary>
        <ul className="border-t border-line py-2">
          {items.map((i) => (
            <li key={i.id}>
              <a href={`#${i.id}`} className="block px-4 py-2 text-sm text-ink hover:bg-tint">{i.title}</a>
            </li>
          ))}
        </ul>
      </details>
      <nav aria-label="On this page" className="sticky top-20 hidden xl:block">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">On this page</p>
        <ul className="space-y-1 border-l border-line">
          {items.map((i) => (
            <li key={i.id}>
              <a href={`#${i.id}`} className="-ml-px block border-l-2 border-transparent py-1 pl-4 text-sm text-muted hover:border-accent hover:text-heading">
                {i.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
