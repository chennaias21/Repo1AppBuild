import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Terms and Conditions",
};

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms and Conditions"
      intro={`These terms govern your use of ${BUSINESS.name} and any purchase you make on this website. By registering for an account or purchasing the course, you agree to them.`}
      sections={[
        {
          heading: "1. About us",
          paragraphs: [
            `${BUSINESS.name} is operated by ${BUSINESS.legalName}, registered at ${BUSINESS.address}. You can contact us at ${BUSINESS.supportEmail} or ${BUSINESS.supportPhone}.`,
          ],
        },
        {
          heading: "2. What you are buying",
          paragraphs: [
            `The ${BUSINESS.name} course is a self-paced online Excel training programme delivered through this website. What you can access depends on the plan you buy: Essentials gives one year of access to all lessons, quizzes and practice files with project briefs; the Complete plans give lifetime access, full projects and a certificate. The Pricing page lists what each plan includes.`,
            "Access is granted to the individual who registered and paid. It is personal and non-transferable.",
          ],
        },
        {
          heading: "3. Registration and your account",
          bullets: [
            "You must provide accurate details — name, email address and mobile number — when registering.",
            "You are responsible for keeping access to your registered email secure, as it is used to log in.",
            "You may not share your account, login codes, or course materials with anyone else.",
            "We may suspend or terminate accounts that share access, attempt to bypass payment, or misuse the platform.",
          ],
        },
        {
          heading: "4. Pricing and payment",
          paragraphs: [
            `SkillSopan is sold in three plans (Essentials, Complete and Complete + Review). The price of each plan is shown on the Pricing page and at checkout, inclusive of applicable taxes. Payments are processed by Razorpay, and we do not store your card or banking details at any point.`,
            "Full course access is granted only after payment is confirmed by the payment gateway. We reserve the right to change pricing at any time; changes do not affect purchases already completed.",
          ],
        },
        {
          heading: "5. Intellectual property",
          paragraphs: [
            `All course content — text, videos, exercises, templates and downloadable materials — is the intellectual property of ${BUSINESS.legalName} and is protected by copyright.`,
            "You may use the materials for your own learning. You may not copy, redistribute, resell, publish, or use them to deliver training to others without our written permission.",
          ],
        },
        {
          heading: "6. Acceptable use",
          bullets: [
            "Do not attempt to gain unauthorised access to any part of the platform or another user's account.",
            "Do not download, scrape, record, or redistribute course content.",
            "Do not use the platform for any unlawful purpose.",
          ],
        },
        {
          heading: "7. Availability",
          paragraphs: [
            "We aim to keep the platform available at all times but do not guarantee uninterrupted access. Access may be temporarily unavailable for maintenance, updates, or reasons beyond our control.",
            "Course content may be updated, improved, or reorganised over time. We will not reduce the substance of what you purchased.",
          ],
        },
        {
          heading: "8. Limitation of liability",
          paragraphs: [
            "The course is educational material provided in good faith. We do not guarantee any specific employment, business, or financial outcome from completing it.",
            `To the extent permitted by law, our total liability in connection with the course is limited to the amount you paid for it.`,
          ],
        },
        {
          heading: "9. Changes to these terms",
          paragraphs: [
            "We may update these terms from time to time. The version published on this page at the time of your purchase applies to that purchase. Material changes will be noted by updating the date at the top of this page.",
          ],
        },
        {
          heading: "10. Governing law",
          paragraphs: [
            "These terms are governed by the laws of India, and any disputes will be subject to the exclusive jurisdiction of the courts in the city stated in our registered address.",
          ],
        },
      ]}
    />
  );
}
