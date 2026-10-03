import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Verify a certificate", robots: { index: false } };

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clean = id.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);
  const { data } = await createAdminClient().from("certificates").select("holder_name, issued_at").eq("id", clean).maybeSingle();

  return (
    <div className="container-page max-w-xl py-16 text-center">
      {data ? (
        <>
          <p className="text-5xl" aria-hidden="true">✓</p>
          <h1 className="mt-3 text-3xl font-bold text-heading">Genuine certificate</h1>
          <p className="mt-6 text-lg">
            <strong>{data.holder_name}</strong> completed the SkillSopan Excel course on{" "}
            {new Date(data.issued_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.
          </p>
          <p className="mt-3 text-sm text-muted">Certificate ID {clean}</p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold text-heading">No certificate found</h1>
          <p className="mt-4">We have no certificate with the ID <span className="font-mono">{clean || "you entered"}</span>. Check the ID and try again.</p>
        </>
      )}
      <p className="mt-8"><Link href="/" className="font-semibold text-link underline">SkillSopan home</Link></p>
    </div>
  );
}
