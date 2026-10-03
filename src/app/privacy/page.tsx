import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro={`This policy explains what personal information ${BUSINESS.name} collects, why we collect it, and what we do with it.`}
      sections={[
        {
          heading: "1. What we collect",
          bullets: [
            "Name, email address and mobile number, which you provide when registering.",
            "Payment records — transaction ID, amount, date and status. Card and banking details are handled entirely by Razorpay and never reach our systems.",
            "Learning activity — which lessons you have completed, so we can show your progress.",
            "Basic technical information such as browser type and access times, used to keep the service secure and working.",
          ],
        },
        {
          heading: "2. Why we collect it",
          bullets: [
            "To create your account and give you access to the course you purchased.",
            "To process your payment and confirm it before unlocking content.",
            "To send you your welcome guide, receipts, and essential service messages.",
            "To track your progress through the course and show it back to you.",
            "To maintain internal records for accounting and customer support.",
          ],
        },
        {
          heading: "3. Who we share it with",
          paragraphs: [
            "We do not sell your personal information, and we do not share it for advertising purposes. We share it only with the service providers needed to run the platform:",
          ],
          bullets: [
            "Razorpay — to process payments securely.",
            "Supabase — to store your account and progress data.",
            "Resend — to deliver transactional emails such as your sign-in link and welcome guide.",
            "Google Sheets — an internal administrative record of registrations and payment status, accessible only to us.",
            "We may also disclose information where required by law.",
          ],
        },
        {
          heading: "4. How long we keep it",
          paragraphs: [
            "We keep your account and progress data for as long as your account exists. Payment and transaction records are retained for as long as required by Indian tax and accounting law.",
            "You can ask us to delete your account at any time — see 'Your rights' below.",
          ],
        },
        {
          heading: "5. How we protect it",
          bullets: [
            "All traffic to this website is encrypted over HTTPS.",
            "Passwords are not used or stored — we authenticate using single-use sign-in links sent to your email.",
            "Course access is verified on our server for every request; it cannot be granted by anything happening in your browser.",
            "Access to our administrative records is restricted to authorised personnel.",
          ],
        },
        {
          heading: "6. Cookies",
          paragraphs: [
            "We use only essential cookies needed to keep you signed in and to keep the site secure. We do not use advertising or third-party tracking cookies. Blocking essential cookies will prevent you from staying logged in.",
          ],
        },
        {
          heading: "7. Your rights",
          paragraphs: [
            `You can ask us to access, correct, or delete the personal information we hold about you. Email ${BUSINESS.supportEmail} and we will respond within ${BUSINESS.responseTimeHours} hours.`,
            "Note that deleting your account also removes your course access and progress history, and this cannot be reversed.",
          ],
        },
        {
          heading: "8. Children",
          paragraphs: [
            "This course is intended for working professionals and students aged 16 and above. We do not knowingly collect information from children under 16.",
          ],
        },
        {
          heading: "9. Changes to this policy",
          paragraphs: [
            "We may update this policy as the service evolves. The date at the top of this page shows when it was last reviewed.",
          ],
        },
      ]}
    />
  );
}
