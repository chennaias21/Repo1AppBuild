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
    blurb: "Everything, for life: full projects with solutions, a certificate and email support.",
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
 * Launch price: the Complete plan (lifetime access) is offered at Rs 199.
 * Confirmed by the owner. No buyer cap or end date was given, so there is none;
 * set INTRO_OFFER to null to return to the normal price.
 */
export const INTRO_OFFER: null | { tier: TierId; pricePaise: number; label: string } = {
  tier: "complete",
  pricePaise: 199_00,
  label: "Launch price",
};

export function effectivePricePaise(tier: Tier): number {
  return INTRO_OFFER && INTRO_OFFER.tier === tier.id ? INTRO_OFFER.pricePaise : tier.pricePaise;
}

/** Promo codes, checked on the server at checkout. Percent comes off the price being charged. */
export const PROMOS: Record<string, { percent: number }> = {
  FIRST15: { percent: 15 },
};

export function normalisePromo(code: unknown): string | null {
  if (typeof code !== "string") return null;
  const c = code.trim().toUpperCase();
  return c in PROMOS ? c : null;
}

/** Whole-rupee result, so learners see Rs 169 rather than Rs 169.15. */
export function priceWithPromo(paise: number, code: string | null): number {
  if (!code) return paise;
  const { percent } = PROMOS[code];
  return Math.round((paise * (100 - percent)) / 100 / 100) * 100;
}
