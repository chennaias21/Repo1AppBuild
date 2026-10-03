import { BUSINESS } from "@/lib/business";

/** Answers use only facts that are settled. Anything still undecided is left out rather than guessed. */
export const FAQ: { q: string; a: string }[] = [
  {
    q: "Do I need any Excel experience?",
    a: "No. The course starts with opening a blank workbook and building from there, one step at a time.",
  },
  {
    q: "Can I try before I pay?",
    a: "Yes. Modules 1 and 2 (12 lessons) are free to read with no sign-up. Sign in free if you want your progress saved and your quiz scores recorded.",
  },
  {
    q: "Which version of Excel do I need?",
    a: "Most lessons work in any recent desktop version of Excel. A few lessons use newer functions, and those carry a badge showing the version they need.",
  },
  {
    q: "What is the difference between the plans?",
    a: "Essentials gives you all lessons, quizzes and practice files for one year, with project briefs. Complete adds lifetime access, full project walkthroughs, a certificate and email support. Complete + Review adds written feedback from the instructor on two of your projects.",
  },
  {
    q: "How long does the course take?",
    a: "The lessons add up to about 11 hours, and the three capstone projects about 10 more. Most people take a few weeks working an hour or so a day.",
  },
  {
    q: "What is your refund policy?",
    a: `You can ask for a refund within ${BUSINESS.refundWindowDays} days of purchase, no questions asked. Access ends when the refund is processed.`,
  },
  {
    q: "How do I pay?",
    a: "Payments are handled by Razorpay, so you can use UPI, cards or net banking. We never see or store your card details.",
  },
  {
    q: "How do I get help if I am stuck?",
    a: `Complete and Complete + Review include email support at ${BUSINESS.supportEmail}. We reply within ${BUSINESS.responseTimeHours} hours on working days.`,
  },
];
