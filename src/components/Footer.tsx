import Link from "next/link";
import Logo from "@/components/Logo";
import { SITE } from "@/lib/site";

const COLS = [
  {
    title: "Learn",
    links: [
      { href: "/curriculum", label: "Curriculum" },
      { href: "/free", label: "Free lessons" },
      { href: "/pricing", label: "Pricing" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/contact", label: "Contact us" },
      { href: "/terms", label: "Terms & conditions" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/refund-policy", label: "Refund policy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-24 bg-navy text-white">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <span className="inline-flex rounded-xl bg-white px-3 py-2">
            <Logo className="h-8" />
          </span>
          <p className="mt-4 max-w-sm text-[0.95rem] text-white/80">{SITE.tagline}</p>
        </div>
        {COLS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">{col.title}</h2>
            <ul className="mt-4 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/90 hover:text-white hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/15">
        <div className="container-page flex flex-col gap-2 py-5 text-sm text-white/70 sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <p>Payments processed securely by Razorpay.</p>
        </div>
      </div>
    </footer>
  );
}
