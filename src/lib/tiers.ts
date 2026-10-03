/**
 * Pricing tiers. Amounts are in paise and are the ONLY place a price is defined:
 * the checkout API reads the amount from here, never from the request.
 */
export type TierId = "essentials" | "complete" | "complete_review";

export interface Tier {
  id: TierId;
  name: string;
  pricePaise: number;
  blurb: string;
  featured?: boolean;
  /** null = lifetime; otherwise months of access from purchase. */
  accessMonths: number | null;
  certificate: boolean;
  projects: "briefs" | "full";
  support: "none" | "email" | "priority";
  instructorReviews: number;
  updates: boolean;
}

export const TIERS: Tier[] = [
  {
    id: "essentials",
    name: "Essentials",
    pricePaise: 1999_00,
    blurb: "All 56 lessons, quizzes and practice files, for a year.",
    accessMonths: 12,
    certificate: false,
    projects: "briefs",
    support: "none",
    instructorReviews: 0,
    updates: false,
  },
  {
    id: "complete",
    name: "Complete",
    pricePaise: 3999_00,
    blurb: "Everything, for life: full projects with solutions, a verifiable certificate and email support.",
    featured: true,
    accessMonths: null,
    certificate: true,
    projects: "full",
    support: "email",
    instructorReviews: 0,
    updates: true,
  },
  {
    id: "complete_review",
    name: "Complete + Review",
    pricePaise: 7999_00,
    blurb: "Everything in Complete, plus written feedback from the instructor on two of your projects.",
    accessMonths: null,
    certificate: true,
    projects: "full",
    support: "priority",
    instructorReviews: 2,
    updates: true,
  },
];

export function getTier(id: string): Tier | undefined {
  return TIERS.find((t) => t.id === id);
}

export function formatRupees(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN");
}

/**
 * Optional launch/intro price. Left null until the owner confirms the tier,
 * amount and limit; when set, the checkout API and pricing page both honour it.
 */
export const INTRO_OFFER: null | { tier: TierId; pricePaise: number; label: string } = null;

export function effectivePricePaise(tier: Tier): number {
  return INTRO_OFFER && INTRO_OFFER.tier === tier.id ? INTRO_OFFER.pricePaise : tier.pricePaise;
}
