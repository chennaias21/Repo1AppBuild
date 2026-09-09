import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Refund and Cancellation Policy — Excel Mastery",
};

export default function RefundPolicyPage() {
  return (
    <PolicyPage
      title="Refund and Cancellation Policy"
      intro={`We want you to be confident before you buy, which is why several lessons are free to try without paying anything. This policy explains when a refund is available and how to request one.`}
      sections={[
        {
          heading: "1. Try before you buy",
          paragraphs: [
            "Several introductory lessons are available free of charge, with no payment or card details required. We strongly encourage you to work through these first so you know exactly what you are purchasing.",
          ],
        },
        {
          heading: "2. Refund window",
          paragraphs: [
            `You may request a full refund within ${BUSINESS.refundWindowDays} days of your purchase if the course has not met your expectations.`,
            "Requests made after this window cannot be accepted, because course access is granted immediately and in full on payment.",
          ],
        },
        {
          heading: "3. How to request a refund",
          bullets: [
            `Email ${BUSINESS.supportEmail} from the email address you registered with.`,
            "Include your payment ID (shown on your payment confirmation email) and the date of purchase.",
            "Tell us briefly what didn't work for you — this is not a condition of the refund, but it genuinely helps us improve the course.",
          ],
        },
        {
          heading: "4. How refunds are processed",
          paragraphs: [
            `We acknowledge every request within ${BUSINESS.responseTimeHours} hours. Approved refunds are processed back through Razorpay to the original payment method — we cannot refund to a different account or method.`,
            "Once processed, banks typically take 5–7 working days to credit the amount, though the exact timing is determined by your bank, not by us.",
            "Your course access is revoked when a refund is issued.",
          ],
        },
        {
          heading: "5. Cancellation",
          paragraphs: [
            "This is a one-time purchase, not a subscription. There is no recurring billing to cancel, and no further amount will ever be charged automatically.",
            "You may stop using the course at any time. If you are within the refund window and want your money back, follow the request process above.",
          ],
        },
        {
          heading: "6. When a refund may be declined",
          bullets: [
            `Requests made more than ${BUSINESS.refundWindowDays} days after purchase.`,
            "Evidence of account sharing, bulk downloading, or redistribution of course materials.",
            "Requests from an email address other than the registered one, where we cannot verify ownership of the purchase.",
          ],
        },
        {
          heading: "7. Failed or duplicate payments",
          paragraphs: [
            `If money was debited but your course did not unlock, do not pay again. Email ${BUSINESS.supportEmail} with your payment ID and we will either unlock your access or refund the amount in full.`,
            "Duplicate payments for the same account are refunded in full, and the refund window does not apply to them.",
          ],
        },
      ]}
    />
  );
}
