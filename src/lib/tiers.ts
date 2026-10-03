/**
 * Pricing tiers. Amounts are in paise and are the ONLY place a price is defined:
 * the checkout API reads the amount from here, never from the request.
 */
export type TierId = "complete";

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
  support: "none" | "email";
  updates: boolean;
}

/**
 * One plan for now: the full course, for life, at an introductory Rs 199.
 * Raise pricePaise here when traffic justifies it; every page and the checkout read from this file.
 */
export const TIERS: Tier[] = [
  {
    id: "complete",
    name: "Full course",
    pricePaise: 199_00,
    blurb: "All 56 lessons, quizzes, module assessments and practice files, the three capstone projects with solutions, a certificate and email support. Yours for life.",
    featured: true,
    accessMonths: null,
    certificate: true,
    projects: "full",
    support: "email",
    updates: true,
  },
];

/** Older payments may name plans that no longer exist; those buyers keep the full course. */
export function getTier(id: string): Tier | undefined {
  return TIERS.find((t) => t.id === id) ?? TIERS[0];
}

export function formatRupees(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN");
}

export function effectivePricePaise(tier: Tier): number {
  return tier.pricePaise;
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
