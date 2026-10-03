import type { Metadata } from "next";
import Link from "next/link";
import { TIERS, INTRO_OFFER, effectivePricePaise, type Tier } from "@/lib/tiers";
import { COURSE } from "@/lib/curriculum";
import { BUSINESS } from "@/lib/business";
import PricingCards from "@/components/PricingCards";
import { getEntitlement } from "@/lib/access";

export const metadata: Metadata = { title: "Pricing" };

function Check({ yes }: { yes: boolean }) {
  return yes ? (
    <span className="text-success" aria-label="Included">✓</span>
  ) : (
    <span className="text-muted" aria-label="Not included">–</span>
  );
}

const ROWS: { label: string; value: (t: Tier) => React.ReactNode }[] = [
  { label: `All ${COURSE.totalLessons} lessons, quizzes and practice files`, value: () => <Check yes /> },
  { label: "Access", value: (t) => (t.accessMonths ? `${t.accessMonths} months` : "Lifetime") },
  { label: "Capstone projects", value: (t) => (t.projects === "full" ? "Full, with walkthroughs" : "Briefs and data") },
  { label: "Certificate of completion", value: (t) => <Check yes={t.certificate} /> },
  { label: "Email support", value: (t) => <Check yes={t.support !== "none"} /> },
  { label: "Instructor feedback on 2 projects", value: (t) => <Check yes={t.instructorReviews > 0} /> },
  { label: "Course updates", value: (t) => <Check yes={t.updates} /> },
];

export default async function PricingPage() {
  const e = await getEntitlement();

  return (
    <div className="container-page py-14">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-heading">Pick the plan that fits</h1>
        <p className="mt-4 text-lg text-muted">
          One payment, no subscription. Not sure yet? <Link href="/free" className="font-semibold text-link underline">Start with the 12 free lessons</Link>.
        </p>
      </header>

      <PricingCards
        mode={e.hasAccess ? "owned" : e.signedIn ? "signedIn" : "anon"}
        cards={TIERS.map((t) => ({
          id: t.id,
          name: t.name,
          blurb: t.blurb,
          featured: Boolean(t.featured),
          pricePaise: effectivePricePaise(t),
          regularPaise: effectivePricePaise(t) !== t.pricePaise ? t.pricePaise : null,
          launchLabel: effectivePricePaise(t) !== t.pricePaise ? INTRO_OFFER?.label ?? null : null,
        }))}
      />

      <div className="mt-14 overflow-x-auto rounded-2xl border border-line" role="region" aria-label="Plan comparison" tabIndex={0}>
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <caption className="sr-only">What each plan includes</caption>
          <thead className="bg-tint">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold text-heading">What is included</th>
              {TIERS.map((t) => (
                <th key={t.id} scope="col" className="px-5 py-3 font-semibold text-heading">{t.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label} className="border-t border-line">
                <th scope="row" className="px-5 py-3 font-medium">{r.label}</th>
                {TIERS.map((t) => (
                  <td key={t.id} className="px-5 py-3">{r.value(t)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mx-auto mt-14 max-w-2xl rounded-2xl border border-line bg-tint p-7 text-center">
        <h2 className="text-xl font-bold text-heading">{BUSINESS.refundWindowDays}-day refund, no questions asked</h2>
        <p className="mt-2">
          If the course is not for you, write to {BUSINESS.supportEmail} within {BUSINESS.refundWindowDays} days of buying and we will refund you.
          Payments are processed securely by Razorpay (UPI, cards, net banking).
        </p>
      </section>
    </div>
  );
}
