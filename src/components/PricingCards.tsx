"use client";

import Link from "next/link";
import { useState } from "react";
import BuyButton from "@/components/BuyButton";

export interface PricingCard {
  id: string;
  name: string;
  blurb: string;
  featured: boolean;
  /** Price actually charged before any promo code, in paise. */
  pricePaise: number;
  /** Normal price, shown struck through only when a launch price applies. */
  regularPaise: number | null;
  launchLabel: string | null;
}

type Mode = "anon" | "signedIn" | "owned";

const rupees = (paise: number) => "₹" + (paise / 100).toLocaleString("en-IN");

export default function PricingCards({ cards, mode }: { cards: PricingCard[]; mode: Mode }) {
  const [input, setInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; percent: number } | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    setNote(null);
    try {
      const res = await fetch(`/api/promo?code=${encodeURIComponent(input)}`, { cache: "no-store" });
      const data = await res.json();
      if (data.valid) {
        setPromo({ code: data.code, percent: data.percent });
        setNote(`${data.code} applied: ${data.percent}% off`);
      } else {
        setPromo(null);
        setNote("That code isn't valid.");
      }
    } catch {
      setNote("Could not check the code. Please try again.");
    }
  }

  const final = (paise: number) =>
    promo ? Math.round((paise * (100 - promo.percent)) / 100 / 100) * 100 : paise;

  return (
    <div>
      <form onSubmit={apply} className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row" aria-label="Promo code">
        <label htmlFor="promo" className="sr-only">Promo code</label>
        <input
          id="promo"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Have a promo code?"
          autoComplete="off"
          className="flex-1 rounded-lg border border-line bg-surface px-4 py-2.5 uppercase text-ink placeholder:normal-case"
        />
        <button type="submit" className="rounded-lg border-2 border-primary px-5 py-2.5 font-semibold text-primary hover:bg-tint">
          Apply
        </button>
      </form>
      <p className={`mt-2 min-h-5 text-center text-sm ${promo ? "font-semibold text-success" : "text-danger"}`} role="status" aria-live="polite">
        {note}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {cards.map((t) => {
          const price = final(t.pricePaise);
          const struck = promo ? t.pricePaise : t.regularPaise;
          return (
            <section
              key={t.id}
              aria-labelledby={`tier-${t.id}`}
              className={`flex flex-col rounded-2xl border bg-surface p-7 shadow-card ${t.featured ? "border-2 border-accent" : "border-line"}`}
            >
              {t.featured && <p className="mb-3 text-xs font-bold uppercase tracking-wider text-accent">Best value</p>}
              <h2 id={`tier-${t.id}`} className="text-2xl font-bold text-heading">{t.name}</h2>
              <p className="mt-4">
                <span className="text-4xl font-bold text-ink">{rupees(price)}</span>
                {struck !== null && struck !== price && (
                  <span className="ml-2 text-lg text-muted line-through">
                    <span className="sr-only">Regular price </span>{rupees(struck)}
                  </span>
                )}
              </p>
              {t.launchLabel && <p className="mt-1 text-sm font-semibold text-accent">{t.launchLabel}</p>}
              {promo && <p className="mt-1 text-sm font-semibold text-success">{promo.code}: {promo.percent}% off applied</p>}
              <p className="mt-4 flex-1 text-[0.97rem]">{t.blurb}</p>
              <div className="mt-6">
                {mode === "owned" ? (
                  <Link href="/dashboard" className="block rounded-xl border-2 border-primary px-6 py-3 text-center font-semibold text-primary">
                    Go to your dashboard
                  </Link>
                ) : mode === "signedIn" ? (
                  <BuyButton tier={t.id} promo={promo?.code} label={`Get ${t.name}`} featured={t.featured} />
                ) : (
                  <Link
                    href="/login?next=/pricing"
                    className={`block rounded-xl px-6 py-3 text-center font-semibold hover:brightness-110 ${t.featured ? "bg-cta text-cta-ink" : "border-2 border-primary text-primary"}`}
                  >
                    Sign in to get {t.name}
                  </Link>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
