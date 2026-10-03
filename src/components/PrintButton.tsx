"use client";

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-xl bg-cta px-6 py-3 font-semibold text-cta-ink hover:brightness-110">
      Print or save as PDF
    </button>
  );
}
