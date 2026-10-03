import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import AuthNav from "@/components/AuthNav";
import MobileNav from "@/components/MobileNav";

export const NAV_LINKS = [
  { href: "/curriculum", label: "Curriculum" },
  { href: "/free", label: "Free lessons" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-page/95 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-ink"
      >
        Skip to content
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="SkillSopan home" className="shrink-0">
          <Logo className="h-8" />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-[0.95rem] font-medium text-ink hover:text-primary">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <AuthNav className="hidden lg:inline text-[0.95rem]" />
          <Link
            href="/free"
            className="hidden rounded-lg bg-cta px-5 py-2.5 text-[0.95rem] font-semibold text-cta-ink hover:brightness-110 lg:inline-block"
          >
            Start free
          </Link>
          <MobileNav links={NAV_LINKS} />
        </div>
      </div>
    </header>
  );
}
