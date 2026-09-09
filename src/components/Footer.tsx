import Link from "next/link";

const POLICY_LINKS = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/contact", label: "Contact Us" },
];

export default function Footer() {
  return (
    <footer className="border-t border-black/5 mt-24">
      <div className="container-page py-10">
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {POLICY_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-ink-700 hover:text-brand-700">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 flex flex-col sm:flex-row justify-between gap-2 text-sm text-ink-500">
          <p>
            &copy; {new Date().getFullYear()} Excel Mastery. From Basics to Business-Ready Excel.
          </p>
          <p>Payments processed securely via Razorpay.</p>
        </div>
      </div>
    </footer>
  );
}
