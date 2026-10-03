# Excel Mastery

**From Basics to Business-Ready Excel.** A Next.js course platform with free preview
lessons, a paywalled full curriculum, Razorpay payments verified server-side, and a
Google Sheet kept in sync for admin reporting (never used to control access).

Everything in this build runs on free tiers — see [Costs](#costs-all-free-tiers-to-start) below.

## Stack

- **Frontend/Backend:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4 — deployed as one app.
- **Database/Auth:** Supabase (Postgres + passwordless email sign-in links).
- **Payments:** Razorpay (order creation + webhook verification).
- **Email:** Resend (transactional).
- **Admin reporting:** a Google Apps Script Web App bound to your tracking Sheet (write-only logging, not access control).
- **Hosting:** Netlify (chosen over Vercel — Vercel's free Hobby tier disallows commercial use; Netlify's does not).

## How access control works

Postgres is the single source of truth. A user's `profiles.access_status` column
(`free` / `pending` / `paid`) can **only** be changed by the backend using the Supabase
service-role key — a database trigger (`protect_access_columns`, in
`supabase/migrations/0001_init.sql`) silently reverts any attempt to change it from a
normal user session, so the Supabase client SDK, browser devtools, or a raw REST call
with the anon key cannot grant access. Every page and API route that serves paid
content re-checks this column server-side on every request — nothing relies on a
client-side flag.

Payment confirmation only ever happens from the Razorpay **webhook**
(`src/app/api/payment/webhook/route.ts`), verified by HMAC signature. The frontend's
"payment success" popup is cosmetic — it just triggers a short polling screen while
the webhook does the actual verification and unlock.

## Setting it up

**→ Follow [SETUP.md](./SETUP.md).** It's a step-by-step checklist that tells you exactly which
value to copy from each dashboard into which setting, in the right order, including the steps that
are easy to miss (the Supabase URL configuration and the Razorpay webhook).

The reference below covers the same ground in less detail.

## One-time setup (all free tiers)

### 1. Supabase (database + auth)

1. Create a free project at [supabase.com](https://supabase.com).
2. Project Settings → API Keys: copy the **Project URL**, the **anon/publishable key**, and
   the **service_role/secret key** into your `.env.local` (copy `.env.example` first).
3. SQL Editor → paste the contents of `supabase/migrations/0001_init.sql` and run it, then do the same
   with `supabase/migrations/0002_tiers_progress.sql` (plans, lesson progress, quiz attempts), then `0003_certificates.sql`.
4. Authentication → URL Configuration: set **Site URL** to your deployed address and add
   `<your-address>/**` to **Redirect URLs**. Sign-in links won't work without this.
   No email template editing is needed — the flow uses Supabase's default email.
5. Free tier note: a Supabase project **pauses after 7 days with zero API activity**.
   Harmless once you have regular visitors; if the site sits untouched for a week
   before your first users arrive, just click "Resume" in the Supabase dashboard.

### 2. Razorpay (payments)

1. Sign up at [razorpay.com](https://razorpay.com) (Indian business/PAN required for
   live payments; test mode works immediately without one).
2. Settings → API Keys → generate keys → copy `Key Id` / `Key Secret` into `.env.local`.
3. Settings → Webhooks → Add a webhook:
   - URL: `https://<your-site>/api/payment/webhook`
   - Active events: `payment.captured`, `order.paid`, `refund.processed`
   - Copy the generated **webhook secret** into `.env.local`.
4. Set `COURSE_PRICE_INR` in `.env.local` to your price (whole rupees).
5. No monthly fee — Razorpay only takes a percentage of each successful transaction.

### 3. Resend (email)

1. Sign up at [resend.com](https://resend.com) (free: 3,000 emails/month).
2. API Keys → create one → copy into `RESEND_API_KEY`.
3. For now, `EMAIL_FROM` can stay as the default `onboarding@resend.dev` shared sender.
   Once you have your own domain, verify it in Resend and switch `EMAIL_FROM` to
   `Excel Mastery <hello@yourdomain.com>` for better deliverability.

### 4. Google Sheets (admin reporting)

No Google Cloud project or service account needed — the Sheet receives writes itself via a
bound Apps Script.

1. Create a Google Sheet for tracking.
2. Extensions → Apps Script, replace the sample code with `google-sheet-script/Code.gs`, and set
   `SHARED_SECRET` at the top to a long random string.
3. Deploy → New deployment → Web app, **Execute as: Me**, **Who has access: Anyone**. Authorise it.
4. Copy the Web app URL into `SHEETS_WEBHOOK_URL`, and the same secret into
   `SHEETS_WEBHOOK_SECRET`.

### 5. Deploy to Netlify (free)

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. In [Netlify](https://netlify.com), "Add new site" → "Import an existing project" →
   pick this repo and branch. Netlify auto-detects Next.js.
3. Site settings → Environment variables → add every variable from `.env.example`
   with your real values.
4. Deploy. You'll get a free `https://your-site.netlify.app` URL — good enough to launch
   on with zero domain cost. Add a custom domain later under Domain settings whenever
   you're ready to pay for one (~₹500–1,500/year).
5. Update the Razorpay webhook URL (step 2.3 above) to point at your live Netlify URL.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run dev
```

## Curriculum content

Each module is a separate file in `src/content/` (`01-basics.ts` through
`10-automation.ts`), assembled by `src/lib/curriculum.ts` in the required order:
Basics → Formatting → Data Cleaning → Formulas/Functions → Analysis → PivotTables →
Reports/Dashboards → Advanced Excel → Power Query/Power Pivot → Automation.

All 32 items are written with real training content — workplace scenarios, step-by-step
instructions, tips, exercises with solutions, interactive quizzes, shortcut tables and
cheat sheets. Edit any module file directly to change wording; the shape of each content
type is defined in `src/lib/content-types.ts`.

To attach a video to a lesson, add `videoId: "abc123"` (the id from an unlisted YouTube
URL) to that lesson object. The player only renders when a video id is present, so
lessons work as text-only until you record them.

Lessons marked `isFree: true` are readable without payment — currently the first three
in Module 1. Change the flag to move the paywall.

## Reconciliation job (optional, for later)

`GET /api/cron/reconcile-sheets` retries any Google Sheets writes that failed (e.g. a
brief Sheets API outage) — it never affects user access. Wire it to a scheduled job
(Netlify Scheduled Functions, or any external cron hitting the URL) with header
`Authorization: Bearer <CRON_SECRET>`. Not required for launch; the site works
correctly without it, this just keeps the admin sheet fully caught up.

## Costs (all free tiers to start)

| Item | Free tier | Upgrade later when |
|---|---|---|
| Hosting (Netlify) | Yes, unrestricted for commercial use | Traffic/build-minutes exceed the free tier |
| Database (Supabase) | Yes (500MB, 50k MAU) | You need more storage/no auto-pause |
| Email (Resend) | Yes (3,000/month) | You exceed that volume |
| Video (YouTube Unlisted) | Yes | You want real download/embed protection (e.g. Bunny.net) |
| Payments (Razorpay) | No fixed fee, ~2%+GST per transaction | N/A — scales with revenue automatically |
| Domain | Not free (~₹500–1,500/year) | Whenever you want a custom domain instead of `*.netlify.app` |
