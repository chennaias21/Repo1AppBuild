import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendWelcomeEmail(to: string, name: string) {
  const resend = getResend();
  const fromAddress = process.env.EMAIL_FROM ?? "Excel Mastery <onboarding@resend.dev>";

  await resend.emails.send({
    from: fromAddress,
    to,
    subject: "You're in — welcome to Excel Mastery",
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: auto; color: #0f172a;">
        <h1 style="color:#158755;">Welcome to Excel Mastery, ${name.split(" ")[0] || "there"}!</h1>
        <p>Your payment is confirmed and your full course is now unlocked — every module,
        exercise, quiz, project, shortcut challenge, and cheat sheet from Basics to
        Business-Ready Excel.</p>
        <h2 style="font-size:16px;">Getting started</h2>
        <ol>
          <li>Log back in at any time with the same email you registered with.</li>
          <li>Your dashboard picks up exactly where you left off.</li>
          <li>Work through the modules in order — each one builds on the last.</li>
          <li>Use the shortcut challenges and cheat sheets as quick revision whenever you need a refresher.</li>
        </ol>
        <p>If anything doesn't unlock as expected, just reply to this email.</p>
        <p style="margin-top:32px;">— The Excel Mastery Team</p>
      </div>
    `,
  });
}

export async function sendRegistrationEmail(to: string, name: string) {
  const resend = getResend();
  const fromAddress = process.env.EMAIL_FROM ?? "Excel Mastery <onboarding@resend.dev>";

  await resend.emails.send({
    from: fromAddress,
    to,
    subject: "You're registered — Excel Mastery",
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: auto; color: #0f172a;">
        <h1 style="color:#158755;">Thanks for registering, ${name.split(" ")[0] || "there"}!</h1>
        <p>You're one step away from full access to Excel Mastery — From Basics to
        Business-Ready Excel. Complete your payment to unlock every module,
        exercise, and project.</p>
      </div>
    `,
  });
}
