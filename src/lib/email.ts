import { Resend } from "resend";
import { SITE } from "@/lib/site";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = () => process.env.EMAIL_FROM ?? "SkillSopan <onboarding@resend.dev>";
const SITE_URL = () => process.env.NEXT_PUBLIC_SITE_URL ?? "https://skillsopan.netlify.app";

/** Names come from a sign-up form, so they are escaped before going into HTML. */
function esc(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

function firstName(name: string): string {
  return esc(name.trim().split(/\s+/)[0] || "there");
}

function layout(body: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; color: #1b2733; line-height: 1.6;">
      <p style="font-size: 22px; font-weight: bold; margin: 0 0 16px;">
        <span style="color:#004080;">Skill</span><span style="color:#f06808;">Sopan</span>
      </p>
      ${body}
      <p style="margin-top: 32px; color:#5b6b7b; font-size: 14px;">
        ${esc(SITE.tagline)}<br />
        Questions? Reply to this email or write to ${esc(SITE.supportEmail)}.
      </p>
    </div>`;
}

export async function sendWelcomeEmail(to: string, name: string) {
  await getResend().emails.send({
    from: FROM(),
    to,
    subject: "Your full SkillSopan course is unlocked",
    html: layout(`
      <h1 style="color:#004080; font-size: 22px;">Welcome, ${firstName(name)}!</h1>
      <p>Your payment is confirmed and the full course is now yours for life: all 56 lessons, the quizzes and module
      assessments, the practice files, the three capstone projects with step-by-step solutions, and your certificate
      when you finish.</p>
      <p><a href="${SITE_URL()}/dashboard" style="display:inline-block; background:#c94f00; color:#ffffff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:bold;">Go to my dashboard</a></p>
      <p>Sign in any time with your email and password. Your dashboard shows where you left off.</p>
      <p>If anything doesn't unlock as expected, just reply to this email.</p>
    `),
  });
}

export async function sendRegistrationEmail(to: string, name: string) {
  await getResend().emails.send({
    from: FROM(),
    to,
    subject: "Welcome to SkillSopan",
    html: layout(`
      <h1 style="color:#004080; font-size: 22px;">Thanks for registering, ${firstName(name)}!</h1>
      <p>Your account is ready. The first 12 lessons are free, so you can start climbing right now.</p>
      <p><a href="${SITE_URL()}/dashboard" style="display:inline-block; background:#c94f00; color:#ffffff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:bold;">Start learning</a></p>
      <p>When you want the rest of the course, the projects and the certificate, you can unlock everything from the Pricing page. There is a 14-day refund, no questions asked.</p>
    `),
  });
}
