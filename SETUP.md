# Excel Mastery — Setup Checklist

Follow this in order. Each step tells you exactly which value to copy and where to paste it.

**You will never send these values to anyone, including in a chat.** They go into the Netlify
dashboard and nowhere else. Anyone who has them can charge cards or read your customer data.

You'll collect 12 values in total. Keep them in a private note as you go — you'll paste them all
into Netlify in Step 5.

---

## Step 1 — Supabase (your database and login system)

Supabase stores your customers, their payments, and their progress. This is the longest step —
about 15 minutes. Take it slowly; nothing here can break anything.

### 1a. Create your account

1. Open [supabase.com](https://supabase.com) in your browser.
2. Click **Start your project** (top right).
3. Click **Continue with GitHub** if you have a GitHub account, or **Continue with Email**
   and use **Excelmastery26@gmail.com**.
4. If you used email, Supabase sends you a confirmation email. Open it and click the link. You
   must do this before you can create anything.

### 1b. Create an organisation

The first time you sign in, Supabase asks you to create an *organisation* before a project.
If it takes you straight to project creation instead, skip to 1c.

1. **Name**: `Excel Mastery`
2. **Type**: Personal
3. **Plan**: **Free** — make sure this is selected. It won't ask for a card.
4. Click **Create organisation**.

### 1c. Create the project

1. Click **New project**.
2. **Name**: `excel-mastery`
3. **Database Password**: click **Generate a password**, then copy it into your private note.
   You won't need it for this setup, but it cannot be recovered later — only reset.
4. **Region**: choose **South Asia (Mumbai)** — closest to your customers, so the site feels faster.
5. **Pricing plan**: Free.
6. Click **Create new project**.
7. Wait. Provisioning takes 2–3 minutes and the screen shows a progress indicator. Don't close
   the tab. When it's done you'll land on the project dashboard.

### 1d. Copy your three keys

⚠️ **Supabase changed the names of these keys recently, and different projects show different
labels.** Both namings are listed below — you'll see one set or the other.

1. In the left sidebar, click the **gear icon** (Project Settings) at the bottom.
2. Click **API Keys** (older projects: **API**).
3. You're looking for three values:

   | What you need | Older label | Newer label | Goes into |
   |---|---|---|---|
   | Your project's web address | **Project URL** | **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` |
   | The safe, public key | **anon** / **public** | **publishable** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | The powerful, private key | **service_role** / **secret** | **secret** | `SUPABASE_SERVICE_ROLE_KEY` |

4. The Project URL looks like `https://abcdefghijkl.supabase.co`. If you can't see it under API
   Keys, look under **Project Settings → General → Project URL**, or **Data API**.
5. The two keys are long strings. Click the copy icon beside each. The private one is hidden
   behind a **Reveal** button — that's the right one.

   ⚠️ The private key bypasses every security rule on your database. It goes only into Netlify in
   Step 5 — never into the website code, never into an email, never into a chat with anyone
   (including me).

**Check before moving on:** you should now have three values saved in your private note — one
starting `https://`, and two long keys.

### 1e. Create your tables

This creates the tables that hold customers and payments, plus the security rules that stop
anyone unlocking the course without paying.

1. In the left sidebar, click **SQL Editor** (icon looks like a database or terminal).
2. Click **New query** (or the **+** at the top).
3. Open this file in another tab:
   [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql)
4. Click the **Copy raw file** button on GitHub (or select all the text and copy it). You need the
   **entire** file — every line from `create extension` at the top to the last line.
5. Paste it into the big empty box in the Supabase SQL Editor.
6. Click **Run** (bottom right, or press Ctrl+Enter).

**What success looks like:** a green message saying *"Success. No rows returned"*. That is
correct — this command creates tables rather than returning data, so "no rows" is expected.

**If you see a red error:**

| Error mentions | What it means | Fix |
|---|---|---|
| `already exists` | You ran it twice | Harmless — your tables are fine, carry on |
| `syntax error at or near` | Only part of the file was pasted | Clear the box, copy the whole file again, re-run |
| `permission denied` | You're in the wrong editor | Make sure you're in **SQL Editor**, not Table Editor |

**Check before moving on:** click **Table Editor** in the sidebar. You should see five tables
listed: `profiles`, `payments`, `lesson_progress`, `achievements`, `sheets_sync_log`. If they're
there, Step 1 is done.

> **Note:** there is no email template to edit. The sign-in email Supabase sends by default works
> as-is — your customers get a "click here to sign in" link. There is one more Supabase setting
> (telling it your website address), but that needs your live URL, so it's in Step 6.

---

## Step 2 — Razorpay (payments)

Your KYC is approved, so both Test and Live modes are available. **Use Test mode for now.**
You'll switch to Live in Step 8, once you've confirmed the whole flow works — that way your first
real transaction isn't also your first test.

There's a Test/Live toggle at the top of the Razorpay dashboard. Everything is separate between
the two modes: different API keys, different webhooks, different transaction history. Nothing you
do in Test mode touches real money or appears in your live records.

1. Go to [razorpay.com](https://razorpay.com), sign in, and switch the toggle to **Test Mode**.
2. Go to **Account & Settings** → **API Keys** → **Generate Test Key**.
3. Copy both values (the secret is shown only once — copy it now):

   | Copy this | Into this env var |
   |---|---|
   | Key Id (starts `rzp_test_`) | `RAZORPAY_KEY_ID` |
   | Key Secret | `RAZORPAY_KEY_SECRET` |

4. **The webhook comes later** (Step 6), because it needs your live website address, which you
   won't have until after deployment. For now, put any placeholder text in
   `RAZORPAY_WEBHOOK_SECRET` so the site builds.

5. Set `COURSE_PRICE_INR` to `299`.

6. While you're here, switch to **Live Mode** briefly and check **Account & Settings** →
   **Configuration** → **Payment Methods**. Make sure **UPI** is enabled — for a ₹299 purchase in
   India, UPI is how most people will want to pay, and leaving it off will cost you sales. Cards
   and netbanking should be on too. Then switch back to Test Mode.

---

## Step 3 — Resend (emails)

1. Go to [resend.com](https://resend.com) and sign in.
2. Go to **API Keys** → **Create API Key**. Name it `excel-mastery`, permission **Sending access**.
3. Copy the key (shown once) into `RESEND_API_KEY`.
4. Set `EMAIL_FROM` to `Excel Mastery <onboarding@resend.dev>` for now. This is Resend's shared
   test sender and works immediately. Once you own a domain, verify it in Resend and change this
   to your own address — emails will land in inboxes far more reliably.

---

## Step 4 — Google Sheets (your admin tracking sheet)

Every registration, payment and refund gets written to a Google Sheet you own, so you always have
a plain-English record of who bought what. No Google Cloud account needed — the Sheet does the
work itself using a small script.

### 4a. Make the Sheet

1. Go to [sheets.google.com](https://sheets.google.com), signed in as **Excelmastery26@gmail.com**,
   and click **Blank spreadsheet**.
2. Name it `Excel Mastery — Registrations` (click "Untitled spreadsheet" at the top left).

You don't need to add any column headings — the script creates them for you on the first
registration.

### 4b. Invent your secret

Think of a long random phrase — for example `excel-mastery-sheet-7734-kappa-river`. It doesn't
need to be memorable, just hard to guess. Write it in your private note as
`SHEETS_WEBHOOK_SECRET`. You'll paste it in two places, and they must match exactly.

### 4c. Add the script

1. In your new Sheet, click **Extensions** → **Apps Script**. A new tab opens with a code editor.
2. It contains a few lines of sample code (`function myFunction() {}`). Select all of it and
   delete it, so the editor is empty.
3. Open [`google-sheet-script/Code.gs`](./google-sheet-script/Code.gs) from this repository, copy
   the **entire** file, and paste it into the empty editor.
4. Find line 15, which reads:

   ```
   const SHARED_SECRET = 'PASTE_YOUR_SECRET_HERE';
   ```

   Replace `PASTE_YOUR_SECRET_HERE` with your secret from 4b, keeping the quote marks:

   ```
   const SHARED_SECRET = 'excel-mastery-sheet-7734-kappa-river';
   ```

5. Click the **save icon** (💾) or press Ctrl+S.

### 4d. Publish the script

1. Click **Deploy** (blue button, top right) → **New deployment**.
2. Click the **gear icon** beside "Select type" and choose **Web app**.
3. Fill in:
   - **Description**: `Excel Mastery receiver`
   - **Execute as**: **Me (Excelmastery26@gmail.com)**
   - **Who has access**: **Anyone** ← this must be "Anyone", not "Anyone with Google account".
     It doesn't make your Sheet public; the script only accepts requests carrying your secret.
4. Click **Deploy**.
5. Google asks you to authorise it. Click **Authorize access** → choose your account → you'll see
   a warning screen saying "Google hasn't verified this app". That's expected, because you wrote
   the script yourself a minute ago. Click **Advanced** → **Go to Excel Mastery — Registrations
   (unsafe)** → **Allow**.
6. Copy the **Web app URL** it shows you. It looks like
   `https://script.google.com/macros/s/AKfy.../exec`. Save it in your note as
   `SHEETS_WEBHOOK_URL`.

### 4e. Check it works

Paste that Web app URL into a new browser tab and press Enter. You should see:

```
{"ok":true,"message":"Excel Mastery sheet receiver is running."}
```

If you see that, Step 4 is done. If you get an error page instead, the most common cause is
**Who has access** not being set to **Anyone** — go back to Deploy → Manage deployments, edit it,
and fix that setting.

### 4f. One last value

Set `CRON_SECRET` to any other long random string you invent. It just protects an internal
maintenance URL and you'll never type it again.

---

## Step 5 — Deploy to Netlify

1. Go to [netlify.com](https://netlify.com), sign in with GitHub.
2. **Add new site** → **Import an existing project** → **GitHub** → authorise → pick the
   `Repo1AppBuild` repository.
3. Set the branch to `claude/excel-mastery-platform-y3f2ms` (or `main` once this is merged).
   Netlify detects Next.js automatically — leave the build settings alone.
4. Before deploying, click **Add environment variables** and enter all 12 values you collected:

   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   RAZORPAY_KEY_ID
   RAZORPAY_KEY_SECRET
   RAZORPAY_WEBHOOK_SECRET
   COURSE_PRICE_INR
   RESEND_API_KEY
   EMAIL_FROM
   SHEETS_WEBHOOK_URL
   SHEETS_WEBHOOK_SECRET
   CRON_SECRET
   ```

5. Click **Deploy**. It takes 2–4 minutes. You'll get an address like
   `https://excel-mastery-abc123.netlify.app`. Write it down — you need it in the next step.

---

## Step 6 — Connect the payment webhook

This is the step that actually unlocks the course after someone pays. Skip it and payments will
succeed but nobody will get access.

⚠️ Test and Live modes have **completely separate webhooks**. Setting one up here does not create
the other. You'll create the Live webhook in Step 8 — forgetting it is the single most common way
a launch goes wrong, because payments then succeed while nobody gets access.

1. In Razorpay (still Test Mode), go to **Account & Settings** → **Webhooks** → **Add New Webhook**.
2. **Webhook URL**: your Netlify address followed by `/api/payment/webhook` — for example
   `https://excel-mastery-abc123.netlify.app/api/payment/webhook`
3. **Secret**: invent a long random string. Copy it.
4. **Active Events**: tick `payment.captured`, `order.paid`, and `refund.processed`. Leave
   everything else unticked. (`refund.processed` is what automatically removes course access when
   you refund someone.)
5. Click **Create Webhook**.
6. Go back to Netlify → **Site configuration** → **Environment variables**, and replace the
   placeholder `RAZORPAY_WEBHOOK_SECRET` with the secret from step 3.
7. Go to **Deploys** → **Trigger deploy** → **Clear cache and deploy site**. Environment variable
   changes only take effect on a fresh deploy.

### Now tell Supabase your website address

Without this, the sign-in link in your customers' email will send them to the wrong place and
nobody will be able to log in.

8. Go back to Supabase → your project → **Authentication** (sidebar) → **URL Configuration**.
9. **Site URL**: your Netlify address with no trailing slash, e.g.
   `https://excel-mastery-abc123.netlify.app`
10. **Redirect URLs**: click **Add URL** and enter your address followed by `/**`, e.g.
    `https://excel-mastery-abc123.netlify.app/**`
    (Those two asterisks matter — they permit every page on your site.)
11. Click **Save**.

---

## Step 7 — Test the whole flow end to end

Do this before showing anyone the site.

1. Open your Netlify address. Click through a free lesson — it should work with no login.
2. Click a locked lesson. It should show the lock screen, not the content.
3. Click **Unlock Full Course** → register with your name, mobile, and a real email you can check.
4. You should receive an email with a sign-in link within a minute. (Nothing? Check spam first.
   Still nothing — see the troubleshooting table at the bottom.)
5. Click the link **on the same device you registered on**. You should land on your dashboard,
   already signed in, with your name shown at the top.
6. Click **Pay and Unlock**. Razorpay's test checkout opens. Use test card
   `4111 1111 1111 1111`, any future expiry date, any CVV, and OTP `1234` if prompted.
7. Within a few seconds the page should redirect and the whole course should be unlocked.
8. Check three things:
   - Your Google Sheet has a new row with name, email, mobile, payment ID and status `paid`
   - You received the welcome email
   - Opening a previously locked lesson now shows the full content

If the payment succeeds but nothing unlocks, the webhook is the cause — recheck Step 6, especially
that you redeployed after changing the secret.

---

## Step 8 — Go live

Do this only after Step 7 passed completely in Test mode. Your KYC is already approved, so there's
nothing to wait for.

1. **Fill in your business details first.** Open `src/lib/business.ts` and replace every value
   marked `TO BE FILLED` — your legal business name (exactly as registered with Razorpay), your
   registered address, and a support phone number. These appear on your Terms, Privacy, Refund and
   Contact pages. Commit and push the change, and Netlify will redeploy automatically.

2. **Generate live API keys.** In Razorpay, switch the toggle to **Live Mode**, then
   **Account & Settings** → **API Keys** → **Generate Live Key**. The Key Id now starts
   `rzp_live_` instead of `rzp_test_`. Copy both values — the secret is shown only once.

3. **Create the live webhook.** Still in Live Mode, go to **Account & Settings** → **Webhooks** →
   **Add New Webhook**. This is a *new* webhook, not an edit of your test one:
   - URL: the same `https://your-site/api/payment/webhook`
   - Secret: invent a new long random string (it can differ from the test one)
   - Active Events: `payment.captured`, `order.paid`, and `refund.processed`

4. **Update Netlify.** Site configuration → Environment variables. Replace all three:
   `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` — with the live values from
   steps 2 and 3. Then **Deploys** → **Trigger deploy** → **Clear cache and deploy site**.
   Environment changes only take effect on a fresh deploy.

5. **Do one real transaction.** Register with a different email than your admin one, pay the real
   ₹299 (UPI is quickest), and confirm: the course unlocks, the welcome email arrives, and a row
   appears in your Google Sheet with status `paid`.

6. **Refund that transaction** from the Razorpay dashboard → Transactions → find it → Refund.
   Note that Razorpay's fee on the original transaction is typically not returned — treat the
   couple of rupees as the cost of knowing your payment flow genuinely works.

7. **Confirm the refund revoked access.** Within a few seconds of the refund completing, that test
   account should lose course access automatically, and the Google Sheet row should change to
   `refunded`. This is handled by the `refund.processed` webhook event — if access doesn't drop,
   check you ticked that event when creating the webhook.

---

## Optional — a custom domain

The `.netlify.app` address works fine and costs nothing. When you want your own domain:

1. Buy one (₹500–1,500/year) from any registrar.
2. Netlify → **Domain management** → **Add a domain** → follow the DNS instructions.
3. Verify the domain in Resend and change `EMAIL_FROM` to your own address.
4. Update the Razorpay webhook URL to the new domain (both test and live webhooks).
5. Update Supabase → **Authentication** → **URL Configuration** with the new Site URL and
   Redirect URL, or logins will break on the new domain.

---

## If something goes wrong

| Symptom | Cause and fix |
|---|---|
| No sign-in email arrives | Check spam first. Supabase's built-in email is rate-limited to a few per hour on the free plan — wait, or connect Resend as a custom SMTP provider under Authentication → Emails |
| Sign-in link says "expired or already used" | Links are single-use and last about an hour. Request a fresh one. Note that some corporate email scanners "click" links automatically, which uses them up |
| Sign-in link goes to localhost or a wrong page | Site URL and Redirect URLs not set in Supabase → Authentication → URL Configuration (Step 6.8–6.11) |
| Payment succeeds, course stays locked | Webhook not set up, or site not redeployed after adding the secret (Step 6) |
| Refund doesn't remove access | `refund.processed` wasn't ticked when creating the webhook |
| Google Sheet stays empty | `SHEETS_WEBHOOK_SECRET` in Netlify doesn't exactly match `SHARED_SECRET` in the Apps Script, or the deployment's access isn't set to "Anyone" |
| Build fails on Netlify | A missing or misspelled environment variable — check the deploy log, it names the one it wants |
| Site was fine, now errors | Supabase free projects pause after 7 days of no activity. Open the Supabase dashboard and click Resume |
