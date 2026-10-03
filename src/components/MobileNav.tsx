"use client";

import Link from "next/link";
import { useState } from "react";
import HeaderActions from "@/components/HeaderActions";

export default function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink hover:bg-tint"
      >
        <span aria-hidden="true" className="text-xl leading-none">
          {open ? "✕" : "☰"}
        </span>
      </button>
      {open && (
        <nav
          id="mobile-menu"
          className="absolute inset-x-0 top-full border-b border-line bg-page px-5 pb-5 pt-2 shadow-card"
        >
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-line py-3 font-medium text-ink"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <HeaderActions variant="mobile" onNavigate={() => setOpen(false)} />
          </ul>
        </nav>
      )}
    </div>
  );
}
