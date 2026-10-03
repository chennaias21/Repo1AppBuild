import type { Metadata } from "next";
import Link from "next/link";
import { TIERS, effectivePricePaise } from "@/lib/tiers";
import { COURSE } from "@/lib/curriculum";
import { BUSINESS } from "@/lib/business";
import PricingCards from "@/components/PricingCards";
import { getEntitlement } from "@/lib/access";

export const metadata: Metadata = { title: "Pricing" };

const INCLUDED = [
  `All ${COURSE.totalLessons} lessons with practice files`,
  "Quizzes in every lesson and a 15-question assessment for each module",
  `${COURSE.totalProjects} capstone projects with step-by-step solutions`,
  "A certificate when you complete the course",
  "Email support",
  "Lifetime access, including updates",
];

export default async function PricingPage() {
  const e = await getEntitlement();

  return (
    <div className="container-page py-14">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-heading">One course. One price.</h1>
        <p className="mt-4 text-lg text-muted">
          Pay once, learn for life. Not sure yet? <Link href="/free" className="font-semibold text-link underline">Start with the 12 free lessons</Link>.
        </p>
      </header>

      <div className="mx-auto max-w-md">
        <PricingCards
          mode={e.hasAccess ? "owned" : e.signedIn ? "signedIn" : "anon"}
          cards={TIERS.map((t) => ({
            id: t.id,
            name: t.name,
            blurb: t.blurb,
            featured: Boolean(t.featured),
            pricePaise: effectivePricePaise(t),
            regularPaise: null,
            launchLabel: "Introductory price for early learners",
          }))}
        />
      </div>

      <section className="mx-auto mt-14 max-w-xl" aria-labelledby="included-h">
        <h2 id="included-h" className="text-xl font-bold text-heading">What is included</h2>
        <ul className="mt-4 space-y-2.5">
          {INCLUDED.map((i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 text-success" aria-hidden="true">✓</span>
              <span>{i}</span>
            </li>
          ))}
        </ul>
      </section>

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
