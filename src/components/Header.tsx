import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-black/5 bg-white/80 backdrop-blur sticky top-0 z-40">
      <div className="container-page flex items-center justify-between py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-brand-700">Excel Mastery</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-ink-700">
          <Link href="/curriculum" className="hover:text-brand-700">
            Curriculum
          </Link>
          <Link href="/dashboard" className="hover:text-brand-700">
            My Dashboard
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
          >
            Log in
          </Link>
        </nav>
      </div>
    </header>
  );
}
