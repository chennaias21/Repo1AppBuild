# Excel Mastery — Setup Checklist

Follow this in order. Each step tells you exactly which value to copy and where to paste it.

**You will never send these values to anyone, including in a chat.** They go into the Netlify
dashboard and nowhere else. Anyone who has them can charge cards or read your customer data.

You'll collect 13 values in total. Keep them in a private note as you go — you'll paste them all
into Netlify in Step 5.

---

## Step 1 — Supabase (your database and login system)

1. Go to [supabase.com](https://supabase.com) and sign in with **Excelmastery26@gmail.com**.
2. Click **New project**. Name it `excel-mastery`. Choose the region closest to your customers
   (Mumbai / South Asia). Set a database password and save it in your private note.
3. Wait about two minutes for the project to finish setting up.
4. Go to **Project Settings** (gear icon) → **API**. Copy these three values:

   | Copy this | Into this env var |
   |---|---|
   | Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
   | `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | `service_role` `secret` key | `SUPABASE_SERVICE_ROLE_KEY` |

   ⚠️ The `service_role` key bypasses all security rules. It goes only into Netlify — never into
   the website code, never into an email, never into a chat.

5. Go to **SQL Editor** → **New query**. Open the file `supabase/migrations/0001_init.sql` from
   this repository, copy its entire contents, paste into the editor, and click **Run**. You should
   see "Success. No rows returned." This creates your tables and the security rules that stop
   anyone unlocking the course without paying.

6. **This step is easy to miss and the login will not work without it.** Go to **Authentication**
   → **Emails** → **Magic Link** template. The default template only contains a clickable link,
   but this site asks people to type a 6-digit code. Edit the template body to include the code —
   add a line like:

   ```
   Your Excel Mastery login code is: {{ .Token }}
   ```

   Click **Save**.

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

This is the sheet where every registration and payment gets logged automatically.

1. Create a new Google Sheet in the Excelmastery26 account. Name it `Excel Mastery — Registrations`.
2. Rename the first tab (bottom-left) to exactly **Registrations** — capital R, no spaces. The code
   looks for this exact name.
3. From the sheet's web address, copy the long ID between `/d/` and `/edit` into `GOOGLE_SHEET_ID`.
   Example: `docs.google.com/spreadsheets/d/`**`1a2b3c4d5e6f7g8h`**`/edit`
4. Go to [console.cloud.google.com](https://console.cloud.google.com) and sign in.
5. Create a new project called `excel-mastery`.
6. Search for **Google Sheets API** in the top search bar, open it, and click **Enable**.
7. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **Service account**.
   Name it `sheets-writer` and click through to create it.
8. Click the service account you just created → **Keys** tab → **Add Key** → **Create new key** →
   choose **JSON** → **Create**. A `.json` file downloads.
9. Open that JSON file in Notepad. Find these two values:

   | Copy this from the JSON | Into this env var |
   |---|---|
   | `"client_email"` (ends `.iam.gserviceaccount.com`) | `GOOGLE_SERVICE_ACCOUNT_EMAIL` |
   | `"private_key"` (the long block starting `-----BEGIN PRIVATE KEY-----`) | `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` |

   Copy the private key **exactly as it appears**, including the `\n` sequences. Don't reformat it.

10. Go back to your Google Sheet, click **Share**, paste the `client_email` address, give it
    **Editor** access, and untick "Notify people". Without this the sheet stays empty and nothing
    will tell you why.

11. Set `CRON_SECRET` to any long random string you invent — for example a password-manager
    generated one. It just protects an internal maintenance URL.

---

## Step 5 — Deploy to Netlify

1. Go to [netlify.com](https://netlify.com), sign in with GitHub.
2. **Add new site** → **Import an existing project** → **GitHub** → authorise → pick the
   `Repo1AppBuild` repository.
3. Set the branch to `claude/excel-mastery-platform-y3f2ms` (or `main` once this is merged).
   Netlify detects Next.js automatically — leave the build settings alone.
4. Before deploying, click **Add environment variables** and enter all 13 values you collected:

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
   GOOGLE_SERVICE_ACCOUNT_EMAIL
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
   GOOGLE_SHEET_ID
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

---

## Step 7 — Test the whole flow end to end

Do this before showing anyone the site.

1. Open your Netlify address. Click through a free lesson — it should work with no login.
2. Click a locked lesson. It should show the lock screen, not the content.
3. Click **Unlock Full Course** → register with a real email you can check.
4. You should receive a 6-digit code by email. (No code? Step 1.6 wasn't done.)
5. Enter the code — you should land on your dashboard.
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
4. Update the Razorpay webhook URL to the new domain.

---

## If something goes wrong

| Symptom | Cause |
|---|---|
| No login code arrives | Supabase email template missing `{{ .Token }}` (Step 1.6) |
| Payment succeeds, course stays locked | Webhook not set up, or site not redeployed after adding the secret (Step 6) |
| Google Sheet stays empty | Sheet not shared with the service account email, or tab not named `Registrations` |
| Build fails on Netlify | A missing or misspelled environment variable — check the deploy log, it names the one it wants |
| Site was fine, now errors | Supabase free projects pause after 7 days of no activity. Open the Supabase dashboard and click Resume |
