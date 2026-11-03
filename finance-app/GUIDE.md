# Rupee Routine – Money Made Simple
*Track your money. Plan your budget. Build your savings.*

One codebase (React + TypeScript + Capacitor) that runs as a **web app** and an **Android app**.
All data stays on the device. No login, no cloud, no servers.

---

## 1. Run the web app

You need **Node.js 20 or newer** (https://nodejs.org).

```bash
cd finance-app
npm install            # first time only
npm run dev            # opens http://localhost:5173 with live reload
```

To run the optimised version (this is what you would host):

```bash
npm run build          # type-checks and builds into finance-app/dist
npm run preview        # serves it at http://localhost:4173
```

* Works in Chrome, Edge, Firefox and Safari. Open it once, and it keeps working **offline** (it installs a small service worker).
* **Install it like an app:** in Chrome/Edge click the install icon in the address bar; on a phone use *Add to Home screen*.
* To put it online, upload the contents of `dist/` to any static host (Netlify, Cloudflare Pages, GitHub Pages…). Nothing server-side is needed. Remember that **each browser keeps its own data**.

### Check everything works
```bash
npm test               # 80 unit tests: budgets, alerts, goals, safe-to-spend, credit cards, trends, observations, backup, database
npm run build && npm run e2e   # 26 browser steps in real Chromium (needs Playwright): core flows + a realistic 4-month scenario
```

---

## 2. Build and install the Android APK

### Easiest: let GitHub build it for you (no Android tools needed)
1. Push this repository to GitHub (the workflow `.github/workflows/finance-app-android.yml` is already included).
2. Open the repo → **Actions** → **Rupee Routine – tests and Android APK** → the latest run.
   (Or press **Run workflow** to start one.)
3. When it turns green, scroll to **Artifacts** and download **RupeeRoutine-debug-apk**. Unzip it to get `app-debug.apk`.
4. Copy `app-debug.apk` to your phone (WhatsApp/Drive/USB) and tap it.
   Android will ask to allow *“Install unknown apps”* for the app you opened it from. Allow it once, then install.

The workflow runs all tests first, so a green run also means the calculations passed.

### Updating the app on your phone (keeps your data)
Version 1.1 is signed with a **fixed key**, so every future APK installs *over* the old one and **keeps your data**.
The very first APK you installed (v1.0) was signed with a random key, so Android will refuse to install v1.1 over it. Do this **once**:
1. In the old app: **Settings → Backup & restore → Back up now**, and save the file somewhere safe (Drive/WhatsApp).
2. Uninstall the old Rupee Routine.
3. Install the new `app-debug.apk`.
4. Open it, finish the quick setup, then **Settings → Backup & restore → Choose backup file** and restore. All your data, including custom categories, comes back.

From then on, just install new APKs on top. No backup is needed (but still make one regularly).

### Build it on your own computer
You need Node 20+, **JDK 17** and **Android Studio** (it provides the Android SDK).

```bash
cd finance-app
npm install
npm run android:apk          # builds the web app, syncs it to Android, runs Gradle
# APK: finance-app/android/app/build/outputs/apk/debug/app-debug.apk
```
or open it in Android Studio: `npm run cap:sync && npm run android:open`, then **Run ▶** on a phone or emulator.

### Publish on the Play Store later (already prepared)
The app has a proper id (`com.rupeeroutine.app`), icon, splash screen, version fields and a signing hook.

1. **Create a signing key once** (keep the file and passwords safe, you cannot recover them):
   `keytool -genkey -v -keystore rupee-routine.jks -keyalg RSA -keysize 2048 -validity 10000 -alias rupee`
2. **Sign with GitHub:** in the repo go to *Settings → Secrets → Actions* and add
   `RR_KEYSTORE_B64` (the output of `base64 -w0 rupee-routine.jks`), `RR_KEYSTORE_PASSWORD`, `RR_KEY_ALIAS`, `RR_KEY_PASSWORD`.
   The next workflow run also produces a signed **release `.aab`** (the file Google Play needs).
   *(Local build instead: create `android/keystore.properties` with the lines `storeFile=…`, `storePassword=…`, `keyAlias=…`, `keyPassword=…`, then run `cd android && ./gradlew bundleRelease`. This file is git-ignored.)*
3. Before each upload, raise `versionCode` by 1 in `android/app/build.gradle`.
4. In the Play Console you will also need a store listing, screenshots and a privacy policy. A one-line policy is true for this app: *“All data stays on your device. The app collects nothing and has no accounts.”*

---

## 3. Move your data between devices (backup & restore)

Web and Android each have their **own separate database**. An expense added on your phone will **not** appear on your laptop until you move a backup yourself.

**To copy data from device A to device B**
1. On device A: **Settings → Backup & restore → Back up now.**
   * Web: a file `RupeeRoutine-backup-YYYY-MM-DD.json` downloads.
   * Android: the share sheet opens. Save it to Drive/Files or send it to yourself on WhatsApp/email.
2. Get the file to device B.
3. On device B: **Settings → Backup & restore → Choose backup file.**
4. The app checks the file first. If it is damaged or not from this app, nothing changes.
5. A warning shows what is in the file versus what is on the device. Tap **Replace my data** to confirm. (There is a button to save a backup of the current data first.)

Restoring **replaces** everything on that device (transactions, budgets, categories, goals, settings). Always back up the device you are about to overwrite if it holds anything you want.

**Good habits**
* Back up about once a month. The app reminds you after 30 days.
* Clearing browser data, uninstalling the Android app or *Delete all data* permanently erases your data. A backup is the only copy.
* Android’s automatic Google backup is switched **off** on purpose, to keep everything local.

**Spreadsheets:** *Settings → Import / export transactions* exports CSV or Excel and imports them back (rows already in the app are skipped; new categories are created). Use *Get template* for the column layout.

---

## 4. What is in the app

| Tab | What it gives you |
|---|---|
| **Home** | *Left this month* (income − expenses − savings), health score, safe-to-spend today, income / expenses / savings / budget-left cards, alerts, budget allocation and utilisation, spending by category, biggest expenses, goals, credit cards, weekly habit. |
| **Activity** | Every transaction with search and filters. Tap to edit, delete (with Undo). |
| **Budget** | Groups, categories and limits (planned vs actual). Add, rename, move, delete. Subcategories roll up into their category. |
| **Goals** | Unlimited goals with progress, needed-per-month and on-track status. |
| **Insights** | Summary, financial health, *going well / needs attention / what to do next*, budget vs actual, category analysis, 6-month trend, savings and goals, credit card liabilities, comparison with last month. |
| **Settings** | Salary, categories & groups, **credit cards**, payment methods, recurring entries, backup & restore, CSV/Excel, display size, theme, privacy and reset. |

**Quick-add (+)** lists *every* group, category and subcategory. Tap **+ New** under a group (or **Sub of …**) to create one on the spot. It warns you before saving a possible duplicate.

**Credit cards** (*Settings → Credit cards*): add a card with its statement day, payment due day and optional limit. You see what you owe, the last bill, new purchases, the due date and a status (*Upcoming / Due soon / Overdue / Bill paid*). Use **Record a payment** to pay a bill.
* A card **purchase** is an expense on the day you swipe, in its category.
* A card **bill payment** is a transfer that settles the debt. It is never counted as spending again.

**Display size** (*Settings → Appearance*): Small / Normal / Large / Extra large, with **Reset to normal** (also shown on the Activity page when changed). Pinch-zoom is turned off so a page can never get stuck zoomed.

---

## 5. How the app thinks (so the numbers make sense)

| Term | Meaning |
|---|---|
| **Received** | Income entries in the budget month. |
| **Saved** | Money moved to savings/investments (**Save** entries). |
| **Spent** | Expenses only. Saving transfers and credit-card **bill payments are transfers**, not expenses. A card purchase counts the day you make it. |
| **Left this month** | Income − expenses − savings. Card purchases are already inside expenses, so paying the card bill later does not reduce it again. |
| **Credit card “you owe”** | Amount owed before using the app + card purchases − card bill payments. Shown separately from expenses. |
| **Safe to spend today** | Remaining flexible budget ÷ days left. Fixed bills (rent, EMI) are set aside first. The daily amount stays stable through the day. |
| **On Track / Watch Out / Overspending** | Overspending: any category or the total is over its limit. Watch Out: a category is at 80%+ (editable) or your pace will overshoot by month-end. |
| **Goal “needed each month”** | (Target − saved) ÷ months left, counting the current month. |
| **Health score** | Savings rate 30 · staying in budget 25 · goals on track 20 · needs vs wants 15 · emergency fund 10. |

Everything (salary, categories, groups, budgets, goals, payment methods, thresholds, month start day) is editable in the app. The Indian-style sample data is only applied on first run, and you can start blank.

---

## 6. For future development

* `src/core/` – pure TypeScript logic (no UI, no database). Money is integer paise.
* `src/data/` – IndexedDB (Dexie) behind small repository functions. Every record has a UUID, `createdAt`/`updatedAt`, a soft-delete flag and a `deviceId`, so cloud sync or multi-device merge can be added later without changing the data model. Add schema changes as a new `version(n)` in `src/data/db.ts`.
* `src/ui/` – screens and components, shared by web and Android.
* The backup file has `schemaVersion` so older backups can be migrated when the model grows.
