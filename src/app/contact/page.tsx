import type { Metadata } from "next";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Contact Us",
};

export default function ContactPage() {
  return (
    <div className="container-page py-12 max-w-2xl">
      <h1 className="text-3xl font-bold text-heading">Contact Us</h1>
      <p className="mt-3 text-ink">
        Questions about the course, trouble with access, or a billing issue — reach us directly
        and a real person will reply.
      </p>

      <div className="mt-8 space-y-4">
        <div className="rounded-lg border border-line p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">Email</p>
          <a
            href={`mailto:${BUSINESS.supportEmail}`}
            className="mt-1 block text-lg font-semibold text-link hover:underline"
          >
            {BUSINESS.supportEmail}
          </a>
          <p className="mt-1 text-sm text-muted">
            Best for access problems and refund requests — include your payment ID.
          </p>
        </div>

        <div className="rounded-lg border border-line p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">Phone</p>
          <p className="mt-1 text-lg font-semibold text-heading">{BUSINESS.supportPhone}</p>
          <p className="mt-1 text-sm text-muted">{BUSINESS.supportHours}</p>
        </div>

        <div className="rounded-lg border border-line p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">
            Registered address
          </p>
          <p className="mt-1 text-heading">{BUSINESS.legalName}</p>
          <p className="mt-1 text-ink">{BUSINESS.address}</p>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-line bg-tint p-5">
        <p className="font-semibold text-link">Response time</p>
        <p className="mt-2 text-sm text-link">
          We reply to every message within {BUSINESS.responseTimeHours} hours during{" "}
          {BUSINESS.supportHours}. If your course didn&apos;t unlock after payment, email us with
          your payment ID and we&apos;ll fix it — do not pay a second time.
        </p>
      </div>
    </div>
  );
}
