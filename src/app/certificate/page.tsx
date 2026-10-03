import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getEntitlement } from "@/lib/access";
import { getRequirements } from "@/lib/certificate";
import { createClient } from "@/lib/supabase/server";
import CertificateClaim from "@/components/CertificateClaim";
import PrintButton from "@/components/PrintButton";
import { LogoMark } from "@/components/Logo";

export const metadata: Metadata = { title: "Your certificate" };

export default async function CertificatePage() {
  const e = await getEntitlement();
  if (!e.signedIn || !e.userId) redirect("/login?next=/certificate");

  if (!e.hasAccess || !e.certificate) {
    return (
      <div className="container-page max-w-2xl py-14">
        <h1 className="text-3xl font-bold text-heading">Certificate</h1>
        <p className="mt-4">The certificate comes with the full course. Complete the course to earn it.</p>
        <Link href="/pricing" className="mt-6 inline-flex rounded-xl bg-cta px-6 py-3 font-semibold text-cta-ink hover:brightness-110">Get the full course</Link>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: cert } = await supabase.from("certificates").select("id, holder_name, issued_at").eq("user_id", e.userId).maybeSingle();

  if (cert) {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
    const proto = h.get("x-forwarded-proto") ?? "https";
    const verifyUrl = `${proto}://${host}/verify/${cert.id}`;
    const date = new Date(cert.issued_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    return (
      <div className="container-page max-w-4xl py-10">
        <div className="print:hidden">
          <h1 className="text-3xl font-bold text-heading">Your certificate</h1>
          <p className="mt-2 text-muted">Congratulations. Anyone can confirm it is genuine at the link printed on it.</p>
          <div className="mt-4"><PrintButton /></div>
        </div>
        <div className="mt-8 rounded-3xl border-[6px] border-double border-navy bg-white p-8 text-center text-[#1b2733] sm:p-14">
          <LogoMark className="mx-auto h-14 w-auto" />
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-[#5b6b7b]">Certificate of completion</p>
          <p className="mt-8 text-[#5b6b7b]">This certifies that</p>
          <p className="mt-3 text-4xl font-bold text-[#004080] sm:text-5xl">{cert.holder_name}</p>
          <p className="mx-auto mt-6 max-w-lg text-lg">
            has completed the SkillSopan Excel course, from data entry to data analysis, including all lessons, the final assessment and the capstone projects.
          </p>
          <p className="mt-8 text-[#5b6b7b]">Issued on {date}</p>
          <p className="mt-6 text-sm text-[#5b6b7b]">Certificate ID <strong className="font-mono text-[#1b2733]">{cert.id}</strong></p>
          <p className="mt-1 break-all text-sm text-[#5b6b7b]">Verify at {verifyUrl}</p>
        </div>
      </div>
    );
  }

  const { eligible, items } = await getRequirements(e.userId);
  return (
    <div className="container-page max-w-2xl py-14">
      <h1 className="text-3xl font-bold text-heading">Your certificate</h1>
      <p className="mt-3 text-muted">Finish these three things and your certificate unlocks.</p>
      <ul className="mt-6 space-y-3">
        {items.map((i) => (
          <li key={i.label} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4">
            <span className={`mt-0.5 ${i.done ? "text-success" : "text-muted"}`} aria-hidden="true">{i.done ? "✓" : "○"}</span>
            <span>
              <span className="font-semibold">{i.label}</span>
              <span className="sr-only">{i.done ? " (done)" : " (not done yet)"}</span>
              <span className="block text-sm text-muted">{i.detail}</span>
            </span>
          </li>
        ))}
      </ul>
      {eligible ? (
        <CertificateClaim defaultName={e.name ?? ""} />
      ) : (
        <p className="mt-6">
          <Link href="/dashboard" className="font-semibold text-link underline">Back to your dashboard</Link>
        </p>
      )}
    </div>
  );
}
