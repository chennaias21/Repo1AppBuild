import type { Metadata } from "next";
import Link from "next/link";
import { FAQ } from "@/lib/faq";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <div className="container-page max-w-3xl py-14">
      <h1 className="text-4xl font-bold text-heading">Frequently asked questions</h1>
      <div className="mt-8 space-y-3">
        {FAQ.map((f) => (
          <details key={f.q} className="group rounded-xl border border-line bg-surface">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-heading">
              {f.q}
              <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="border-t border-line px-5 py-4">{f.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-10">
        Still have a question? <Link href="/contact" className="font-semibold text-link underline">Contact us</Link>.
      </p>
    </div>
  );
}
