# Daily Planner

A simple, professional to-do app for planning your day, tracking what's done, and automatically carrying unfinished tasks forward. Works on mobile and laptop, installs like a native app, and needs no server or account.

## Use it starting today

**Option A — Open it directly.** Double-click `index.html` (or open it from a file:// URL in your browser). Everything works immediately; your tasks are saved to that browser only.

**Option B — Put it online (recommended, so you can open it from your phone too).**
1. In this repository on GitHub, go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to this branch (already done) or click **Run workflow** on the "Deploy Daily Planner to GitHub Pages" workflow under the **Actions** tab.
4. GitHub gives you a URL like `https://<your-username>.github.io/<repo-name>/`. Open that on your phone and laptop.

Any static host works the same way (Netlify, Vercel, Cloudflare Pages, your own server) — there's no build step, just upload the files.

## Installing it as an app

- **iPhone/iPad (Safari):** open the site, tap **Share**, then **Add to Home Screen**.
- **Android (Chrome):** open the site, tap the menu, then **Install app** (or use the **Install app** button in the sidebar/bottom bar).
- **Laptop (Chrome/Edge):** open the site, click the **Install app** button in the sidebar, or the install icon in the address bar.

Once installed it opens in its own window with its own icon, and keeps working offline.

## Letting other people use it

Share the link (or this repository) with anyone. Each person who opens it — on their own phone, laptop, or browser — gets **their own private Daily Planner**. There are no accounts and no shared server: every device stores its own tasks locally (in the browser's storage), so nobody sees anyone else's list.

Because data lives on-device, keep in mind:
- Clearing browser data/cache on a device erases that device's tasks.
- Tasks don't sync between two different devices for the same person — each install is independent.
- There's no cloud backup. If that becomes a problem later, the natural next step is adding a small backend with real accounts.

## What it does

- Add tasks for today, tomorrow, or any specific date, with Low/Medium/High priority and an optional due time + reminder notification.
- Tick a task to move it from Pending to Completed (and back).
- Edit, delete, or reschedule any task to a different day.
- Automatic carry-forward: unfinished tasks roll into the next day on their own — even across multiple days if you don't open the app for a while — and are flagged **Carried forward** with priority automatically raised to High.
- A bell icon shows an end-of-day check-in with what's still pending and a one-tap "Carry forward now".
- Dashboard with today's date, total/pending/completed/high-priority/carried-forward counts, and a completion-percentage ring.
- Responsive layout: a sidebar on laptop, a bottom tab bar with a one-tap add button on mobile.

## Notes on reminders

Due-time reminders use the browser's Notification API. They fire while the app (or its installed window) is open in the background, but — like any web app — cannot wake up a fully closed browser. Grant notification permission when prompted (toggling "Due time & reminder" on a task asks for it).

## Files

- `index.html`, `styles.css`, `app.js` — the app itself (no build step, no dependencies).
- `manifest.webmanifest`, `service-worker.js` — make it installable and usable offline.
- `icons/` — the app logo and icons.
- `.github/workflows/deploy-pages.yml` — deploys to GitHub Pages automatically on push.
