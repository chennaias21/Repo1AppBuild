import { BUSINESS } from "@/lib/business";

export interface PolicySection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export default function PolicyPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: PolicySection[];
}) {
  return (
    <div className="container-page py-12 max-w-3xl">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-ink-500">
        Last updated: {BUSINESS.policiesLastUpdated}
      </p>
      <p className="mt-6 text-ink-700">{intro}</p>

      {sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="text-lg font-bold text-ink-900">{section.heading}</h2>
          {section.paragraphs?.map((paragraph, i) => (
            <p key={i} className="mt-3 text-ink-700">
              {paragraph}
            </p>
          ))}
          {section.bullets && (
            <ul className="mt-3 space-y-2">
              {section.bullets.map((bullet, i) => (
                <li key={i} className="flex gap-2 text-ink-700">
                  <span className="text-brand-600">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <div className="mt-12 rounded-lg border border-black/10 p-5 text-sm text-ink-700">
        <p className="font-semibold text-ink-900">Questions about this policy?</p>
        <p className="mt-2">
          Email {BUSINESS.supportEmail} or call {BUSINESS.supportPhone}. We respond within{" "}
          {BUSINESS.responseTimeHours} hours during {BUSINESS.supportHours}.
        </p>
      </div>
    </div>
  );
}
