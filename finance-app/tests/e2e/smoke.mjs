// End-to-end smoke test in real Chromium. Run: npm run build && npm run e2e
// Needs Playwright (globally installed or `npm i -D playwright`).
import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright'); }
const { chromium } = pw;

const OUT = process.env.SHOTS || 'tests/e2e/shots';
mkdirSync(OUT, { recursive: true });
const PORT = 4173;
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const url = `http://localhost:${PORT}/`;
for (let i = 0; i < 50; i++) { try { await fetch(url); break; } catch { await new Promise((r) => setTimeout(r, 200)); } }

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
const text = () => page.locator('body').innerText();
let passed = 0;
const step = async (name, fn) => { try { await fn(); passed++; console.log('  ✓', name); } catch (e) { console.error('  ✗', name, '\n    ', e.message); await shot('FAIL-' + name.replace(/\W+/g, '_')); throw e; } };

// Any network request to a non-local host is a privacy bug.
const external = [];
page.on('request', (r) => { const u = new URL(r.url()); if (!['localhost', '127.0.0.1'].includes(u.hostname) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) external.push(r.url()); });

const quickAdd = async ({ amount, category, mode, note }) => {
  await page.getByRole('button', { name: 'Add transaction' }).click();
  if (mode) await page.getByRole('tab', { name: mode }).or(page.locator('.seg button', { hasText: mode })).first().click();
  await page.getByLabel('Amount').fill(String(amount));
  if (category) await page.locator('.sheet .chip', { hasText: category }).first().click();
  if (note) await page.getByPlaceholder('e.g. Dinner with friends').fill(note);
  await page.locator('.sheet-foot .btn.primary').click();
  await page.locator('.overlay').waitFor({ state: 'detached' });
};

console.log('Rupee Routine e2e');
await page.goto(url);

await step('first run shows onboarding with brand', async () => {
  await page.getByText('Money Made Simple').first().waitFor();
  assert.ok((await text()).includes('Track your money. Plan your budget. Build your savings.'));
  await shot('01-welcome');
});
await step('onboarding completes with sample data', async () => {
  await page.getByRole('button', { name: 'Get started' }).click();
  assert.equal(await page.getByLabel('Monthly salary').inputValue(), '86000');
  await page.getByRole('button', { name: 'Next' }).click();
  await shot('02-start');
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await page.getByText('Safe to spend today').waitFor();
});
await step('home: empty month, nothing spent, budgets present', async () => {
  const t = await text();
  assert.ok(t.includes('On Track'));
  assert.ok(t.includes('₹0'));
  await shot('03-home-empty');
});
await step('quick-add expense under 5 seconds', async () => {
  const t0 = Date.now();
  await quickAdd({ amount: 450, category: 'Groceries' });
  const dt = Date.now() - t0;
  console.log('    quick-add took', dt, 'ms');
  assert.ok(dt < 5000);
  assert.ok((await text()).includes('₹450'));
});
await step('income, savings transfer and credit-card spend + bill (no double count)', async () => {
  await quickAdd({ amount: 86000, mode: 'Income', category: 'Salary' });
  await quickAdd({ amount: 10000, mode: 'Save', category: 'Marriage Fund' });
  // card spend
  await page.getByRole('button', { name: 'Add transaction' }).click();
  await page.getByLabel('Amount').fill('5000');
  await page.locator('.sheet .chip', { hasText: 'Shopping' }).first().click();
  await page.locator('.sheet .chip', { hasText: 'Credit Card' }).first().click();
  await page.locator('.sheet-foot .btn.primary').click();
  await page.locator('.overlay').waitFor({ state: 'detached' });
  // pay the bill
  await quickAdd({ amount: 5000, mode: 'Card bill' });
  await page.waitForTimeout(300);
  const tiles = await page.locator('.tiles').innerText();
  const norm = tiles.replace(/\s+/g, ' ');
  assert.match(norm, /Received ₹86,000/);
  assert.match(norm, /Saved ₹10,000/);
  assert.match(norm, /Spent ₹5,450/); // 450 + 5,000 card spend; bill and savings excluded
  await shot('04-home-active');
});
await step('transactions list, edit, delete and undo', async () => {
  await page.locator('.tab', { hasText: 'Activity' }).click();
  await page.locator('.item', { hasText: 'Groceries' }).first().waitFor();
  await page.locator('.item', { hasText: 'Groceries' }).first().click();
  await page.getByLabel('Amount').fill('500');
  await page.locator('.sheet-foot .btn.primary').click();
  await page.locator('.overlay').waitFor({ state: 'detached' });
  assert.ok((await text()).includes('₹500'));
  await page.locator('.item', { hasText: 'Groceries' }).first().click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.locator('.overlay').waitFor({ state: 'detached' });
  assert.ok(!(await page.locator('.list').first().innerText()).includes('Groceries'));
  await page.getByRole('button', { name: 'Undo' }).click();
  await page.locator('.item', { hasText: 'Groceries' }).first().waitFor();
  await shot('05-transactions');
});
await step('budget: edit a category budget and add a category + subcategory', async () => {
  await page.locator('.tab', { hasText: 'Budget' }).click();
  await page.locator('.item', { hasText: 'Shopping' }).first().click();
  await page.locator('.sheet input.input[inputmode="decimal"]').fill('1000');
  await page.locator('.sheet-foot .btn.primary').click();
  await page.locator('.overlay').waitFor({ state: 'detached' });
  await page.getByText('over limit').first().waitFor(); // 5,000 spent vs 1,000 limit
  await shot('06-budget');
  await page.getByRole('button', { name: /^Category$/ }).or(page.locator('button', { hasText: 'Category' }).first()).first().click();
  await page.getByPlaceholder('e.g. Groceries').fill('Pets');
  await page.locator('.sheet-foot .btn.primary').click();
  await page.locator('.overlay').waitFor({ state: 'detached' });
  await page.getByText('Pets').first().waitFor();
});
await step('goals: marriage fund shows off-track with required monthly', async () => {
  await page.locator('.tab', { hasText: 'Goals' }).click();
  await page.locator('h1', { hasText: 'Goals' }).waitFor();
  const t = (await text()).replace(/\s+/g, ' ');
  assert.match(t, /Marriage Fund/);
  assert.match(t, /Off track/);
  assert.match(t, /₹4,10,000 of ₹20,00,000/); // 4,00,000 + 10,000 saved
  assert.match(t, /Needed each month/);
  await shot('07-goals');
});
await step('goals: create a new goal', async () => {
  await page.getByRole('button', { name: /New goal/ }).click();
  await page.getByPlaceholder('e.g. Travel, Vehicle, Home').fill('Goa Trip');
  await page.getByPlaceholder('2000000').fill('60000');
  await page.getByPlaceholder('10000').fill('5000');
  await page.locator('.sheet-foot .btn.primary').click();
  await page.locator('.overlay').waitFor({ state: 'detached' });
  await page.getByText('Goa Trip').first().waitFor();
});
await step('insights: health score and monthly review', async () => {
  await page.locator('.tab', { hasText: 'Insights' }).click();
  await page.getByText('Financial health').waitFor();
  assert.ok((await text()).includes('Monthly review'));
  await shot('08-insights');
});
await step('backup downloads a valid file; reset wipes; restore brings data back', async () => {
  await page.locator('.tab', { hasText: 'Settings' }).click();
  await page.getByText('Backup & restore').click();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Back up now' }).click()]);
  const path = `${OUT}/backup.json`;
  await dl.saveAs(path);
  const j = JSON.parse(readFileSync(path, 'utf8'));
  assert.equal(j.app, 'rupee-routine');
  assert.ok(j.data.transactions.length >= 4);
  // invalid file is rejected without changing data
  writeFileSync(`${OUT}/bad.json`, '{"hello":"world"}');
  await page.locator('input[type=file]').setInputFiles(`${OUT}/bad.json`);
  await page.getByText('not created by Rupee Routine').waitFor();
  // reset
  await page.locator('button.back-btn').click();
  await page.getByText('Privacy, about & reset').click();
  await page.getByRole('button', { name: 'Delete all my data' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('DELETE').fill('DELETE');
  await page.getByRole('button', { name: 'Delete everything' }).click();
  await page.getByText('Money Made Simple').first().waitFor(); // back to onboarding
  // finish onboarding minimal, then restore
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await page.getByText('Safe to spend today').waitFor();
  await page.locator('.tab', { hasText: 'Settings' }).click();
  await page.getByText('Backup & restore').click();
  await page.locator('input[type=file]').setInputFiles(path);
  await page.getByText('This will overwrite everything on this device.').waitFor();
  await shot('09-restore-warning');
  await page.getByRole('button', { name: 'Replace my data' }).click();
  await page.getByText('Data restored').waitFor();
  await page.locator('.tab', { hasText: 'Home' }).click();
  await page.getByText('Safe to spend today').waitFor();
  assert.match((await page.locator('.tiles').innerText()).replace(/\s+/g, ' '), /Spent ₹5,450|Spent ₹5,500/);
});
await step('csv export then import skips duplicates', async () => {
  await page.locator('.tab', { hasText: 'Settings' }).click();
  await page.getByText('Import / export transactions').click();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'CSV' }).click()]);
  const path = `${OUT}/tx.csv`;
  await dl.saveAs(path);
  const csv = readFileSync(path, 'utf8');
  assert.ok(csv.includes('Date,Type,Amount,Category'));
  writeFileSync(`${OUT}/import.csv`, csv.trimEnd() + '\n2026-11-02,expense,120,Chai Snacks,,Cash,want,evening tea,,\n');
  await page.locator('input[type=file]').setInputFiles(`${OUT}/import.csv`);
  await page.getByText('Review import').waitFor();
  const t = (await text()).replace(/\s+/g, ' ');
  assert.match(t, /Ready to import 1/);
  assert.match(t, /New categories to create 1/);
  await shot('10-import-review');
  await page.getByRole('button', { name: 'Import 1' }).click();
  await page.getByText('Imported 1 transactions').waitFor();
});
await step('dark theme switch persists', async () => {
  await page.locator('button.back-btn').click();
  await page.getByRole('button', { name: 'Dark' }).click();
  await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'dark');
  await page.locator('.tab', { hasText: 'Home' }).click();
  await shot('11-home-dark');
});
await step('no network requests left the device', async () => { assert.deepEqual(external, []); });

// responsive screenshots
await ctx.close();
for (const [name, w, h] of [['tablet', 820, 1100], ['desktop', 1366, 860]]) {
  const c = await browser.newContext({ viewport: { width: w, height: h } });
  const p = await c.newPage();
  await p.goto(url);
  await p.getByRole('button', { name: 'Get started' }).click();
  await p.getByRole('button', { name: 'Next' }).click();
  await p.getByRole('button', { name: 'Start using the app' }).click();
  await p.getByText('Safe to spend today').waitFor();
  await p.screenshot({ path: `${OUT}/12-${name}-home.png` });
  await p.locator('.side-item', { hasText: 'Budget' }).click();
  await p.waitForTimeout(200);
  await p.screenshot({ path: `${OUT}/13-${name}-budget.png` });
  await c.close();
}
await browser.close();
server.kill();
console.log(errors.length ? `\nConsole/page errors:\n${errors.join('\n')}` : '\nNo console errors.');
console.log(`\n${passed} steps passed`);
process.exit(errors.length ? 1 : 0);
