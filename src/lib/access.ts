import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getTier, type Tier } from "@/lib/tiers";

export interface Entitlement {
  signedIn: boolean;
  userId: string | null;
  email: string | null;
  name: string | null;
  tier: Tier | null;
  /** True when the learner may open paid lessons. */
  hasAccess: boolean;
  /** Full project walkthroughs and solutions (Complete tiers). */
  fullProjects: boolean;
  certificate: boolean;
  expiresAt: string | null;
}

const ANONYMOUS: Entitlement = {
  signedIn: false,
  userId: null,
  email: null,
  name: null,
  tier: null,
  hasAccess: false,
  fullProjects: false,
  certificate: false,
  expiresAt: null,
};

/**
 * Reads what the signed-in learner has bought, straight from the database on
 * every request. The browser never supplies any of this, so there is nothing to tamper with.
 */
export async function getEntitlement(): Promise<Entitlement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return ANONYMOUS;

  const [{ data: profile }, { data: payments }] = await Promise.all([
    supabase.from("profiles").select("full_name, access_status").eq("id", user.id).single(),
    supabase
      .from("payments")
      .select("tier, status, expires_at")
      .eq("user_id", user.id)
      .eq("status", "paid"),
  ]);

  const now = Date.now();
  let best: { tier: Tier; expiresAt: string | null } | null = null;

  for (const p of payments ?? []) {
    const tier = getTier(p.tier ?? "complete"); // rows from before tiers existed were the single full-access purchase
    if (!tier) continue;
    if (p.expires_at && new Date(p.expires_at).getTime() < now) continue;
    if (!best)  best = { tier, expiresAt: p.expires_at ?? null };
  }

  if (!best && profile?.access_status === "paid") {
    const tier = getTier("complete");
    if (tier) best = { tier, expiresAt: null };
  }

  return {
    signedIn: true,
    userId: user.id,
    email: user.email ?? null,
    name: profile?.full_name ?? null,
    tier: best?.tier ?? null,
    hasAccess: Boolean(best),
    fullProjects: best?.tier.projects === "full",
    certificate: best?.tier.certificate ?? false,
    expiresAt: best?.expiresAt ?? null,
  };
}
