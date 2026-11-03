// Realistic-scenario end-to-end test. Run: npm run build && node tests/e2e/scenario.mjs
import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright'); }
const { chromium } = pw;
const OUT = process.env.SHOTS || 'tests/e2e/shots';
mkdirSync(OUT, { recursive: true });
execSync(`npx vite-node tests/e2e/scenario.ts ${OUT}`, { stdio: 'ignore' });
const X = JSON.parse(readFileSync(`${OUT}/expected.json`, 'utf8'));
const inr = (paise) => '₹' + Math.round(paise / 100).toString().replace(/(\d)(?=(\d\d)+\d$)/g, '$1,');

const PORT = 4176;
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const url = `http://localhost:${PORT}/`;
for (let i = 0; i < 50; i++) { try { await fetch(url); break; } catch { await new Promise((r) => setTimeout(r, 200)); } }

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
let passed = 0;
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
const step = async (name, fn) => { try { await fn(); passed++; console.log('  ✓', name); } catch (e) { console.error('  ✗', name, '\n    ', e.message.split('\n').slice(0, 6).join('\n     ')); await shot('FAIL-' + name.replace(/\W+/g, '_').slice(0, 40)); throw e; } };
const norm = (s) => s.replace(/\s+/g, ' ');
const tab = async (name, h1) => { await page.locator('.tab', { hasText: name }).click(); await page.locator('h1', { hasText: h1 ?? name }).waitFor(); };
const tilesText = async () => norm(await page.locator('.tiles').innerText());
const closeSheet = () => page.locator('.overlay').waitFor({ state: 'detached' });

console.log('Rupee Routine scenario test, today =', X.today);
await page.goto(url);
await step('start app and restore a realistic 4-month backup', async () => {
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await page.getByText('Safe to spend today').waitFor();
  await page.locator('.tab', { hasText: 'Settings' }).click();
  await page.getByText('Backup & restore').click();
  await page.locator('input[type=file]').setInputFiles(`${OUT}/scenario.json`);
  await page.getByText('This will overwrite everything on this device.').waitFor();
  await page.getByRole('button', { name: 'Replace my data' }).click();
  await page.getByText('Data restored').waitFor();
  await page.locator('.tab', { hasText: 'Home' }).click();
  await page.locator('h1', { hasText: 'Overview' }).waitFor();
});

await step('previous month: Home shows the exact income / expenses / savings (independent arithmetic)', async () => {
  await page.getByRole('button', { name: 'Previous month' }).click();
  await page.waitForTimeout(300);
  const t = await tilesText();
  assert.ok(t.includes(`Income ${inr(X.prev.income)}`), `income ${inr(X.prev.income)} in: ${t}`);
  assert.ok(t.includes(`Expenses ${inr(X.prev.expenses)}`), `expenses ${inr(X.prev.expenses)} in: ${t}`);
  assert.ok(t.includes(`Savings ${inr(X.prev.savings)}`), `savings ${inr(X.prev.savings)} in: ${t}`);
  const left = X.prev.income - X.prev.expenses - X.prev.savings;
  assert.ok(norm(await page.locator('.hero').innerText()).includes(`Left this month ${inr(left)}`), 'left this month');
  await shot('20-home-prev-month');
});
await step('previous month: Insights and Budget agree with Home (one source of truth)', async () => {
  await tab('Insights');
  const t = norm(await page.locator('main').innerText());
  assert.ok(t.includes(inr(X.prev.income)) && t.includes(inr(X.prev.expenses)) && t.includes(inr(X.prev.savings)), 'insights figures');
  assert.ok(t.includes('Budget vs actual') && t.includes('Where your money goes') && t.includes('Last 6 months') && t.includes('Going well') && t.includes('Needs attention') && t.includes('What to do next'));
  assert.ok(await page.locator('svg[aria-label^="Income, expenses"]').isVisible(), 'trend chart');
  // category analysis total equals expenses
  assert.ok(t.includes(`Where your money goes ${inr(X.prev.expenses)}`), 'category analysis total');
  await shot('21-insights-prev-month');
  await tab('Budget');
  const b = norm(await page.locator('main').innerText());
  assert.ok(b.includes('Monthly salary ₹86,000'));
  await tab('Activity', 'Transactions');
  const a = norm(await page.locator('main').innerText());
  assert.ok(a.includes(`In ${inr(X.prev.income)}`) && a.includes(`Spent ${inr(X.prev.expenses)}`) && a.includes(`Saved ${inr(X.prev.savings)}`), 'activity totals');
});
await step('credit card: purchases are in expenses; outstanding, due date and status are tracked', async () => {
  await page.locator('.tab', { hasText: 'Settings' }).click();
  await page.getByText('Credit cards').first().click();
  await page.locator('h1', { hasText: 'Credit cards' }).waitFor();
  const t = norm(await page.locator('main').innerText());
  assert.ok(t.includes(`You owe ${inr(X.cardOutstanding)}`), `outstanding ${inr(X.cardOutstanding)} in ${t.slice(0, 400)}`);
  assert.ok(t.includes('Due soon') || t.includes('Overdue') || t.includes('Upcoming'), 'status label');
  assert.ok(t.includes('Due 5 Nov') || t.includes('Was due'), 'due date text');
  assert.ok(t.includes('already counted') || t.includes('not counted as spending again') || t.includes('is not counted as spending again') || t.includes('It is not counted'), 'classification note');
  await shot('22-cards');
});
await step('paying the card bill reduces the liability and never changes expenses', async () => {
  await page.locator('.tab', { hasText: 'Home' }).click();
  await page.locator('h1', { hasText: 'Overview' }).waitFor();
  const before = await tilesText();
  await page.locator('.tab', { hasText: 'Settings' }).click();
  await page.getByText('Credit cards').first().click();
  await page.getByRole('button', { name: 'Record a payment' }).click();
  const prefilled = await page.getByLabel('Amount').inputValue();
  assert.equal(Number(prefilled) * 100, X.cardDueRemaining, 'payment prefilled with the amount due');
  await page.locator('.sheet-foot .btn.primary').click();
  await closeSheet();
  await page.waitForTimeout(300);
  const t = norm(await page.locator('main').innerText());
  assert.ok(t.includes(`You owe ${inr(X.cardOutstanding - X.cardDueRemaining)}`), 'outstanding reduced by the payment');
  assert.ok(t.includes('Bill paid') || t.includes('Statement paid'), 'status now paid');
  await page.locator('.tab', { hasText: 'Home' }).click();
  await page.locator('h1', { hasText: 'Overview' }).waitFor();
  assert.equal(await tilesText(), before, 'Home tiles are identical: the bill payment was not counted as an expense');
});
await step('quick-add shows EVERY group and category; custom category + subcategory can be added inline', async () => {
  await page.getByTitle('Jump to current month').click(); // back from the previous month we were reviewing
  await page.getByRole('button', { name: 'Add transaction' }).click();
  await page.getByLabel('Amount').fill('800');
  for (const g of X.groups) if (!/Savings/.test(g)) await page.locator('.sheet .lbl-s', { hasText: g }).first().waitFor();
  for (const c of X.expenseCategories) await page.locator('.sheet .chip', { hasText: c }).first().waitFor();
  // add a new category in Lifestyle & Personal, then a subcategory of it
  const grp = page.locator('.sheet [data-group="Lifestyle & Personal"]');
  await grp.locator('.chip.add', { hasText: 'New' }).click();
  await page.getByLabel('New category in Lifestyle & Personal').fill('Pets');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('.sheet .chip.on', { hasText: 'Pets' }).waitFor();
  await page.locator('.sheet .chip.add', { hasText: 'Sub of Pets' }).click();
  await page.getByLabel('New subcategory of Pets').fill('Vet');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('.sheet .chip.on', { hasText: 'Vet' }).waitFor();
  await shot('23-category-picker');
  await page.locator('.sheet-foot .btn.primary').click();
  await closeSheet();
  await page.locator('.tab', { hasText: 'Activity' }).click();
  await page.locator('h1', { hasText: 'Transactions' }).waitFor();
  await page.locator('.item', { hasText: 'Pets › Vet' }).first().waitFor();
});
await step('duplicate guard asks before adding the same entry twice', async () => {
  await page.getByRole('button', { name: 'Add transaction' }).click();
  await page.getByLabel('Amount').fill('800');
  await page.getByLabel('Search categories').fill('Vet');
  await page.locator('.sheet .chip', { hasText: 'Vet' }).first().click();
  await page.locator('.sheet-foot .btn.primary').click();
  await page.getByText('Possible duplicate').waitFor();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByText('Possible duplicate').waitFor({ state: 'detached' });
  await page.locator('.sheet-foot .btn.primary').click();
  await page.getByRole('button', { name: 'Add anyway' }).click();
  await closeSheet();
  assert.equal(await page.locator('.item', { hasText: 'Pets › Vet' }).count(), 2);
});
await step('custom category appears in Insights category analysis and Budget', async () => {
  await tab('Insights');
  assert.ok(norm(await page.locator('main').innerText()).includes('Pets'));
  await tab('Budget');
  assert.ok(norm(await page.locator('main').innerText()).includes('Pets'));
});

const TABS = [['Home', 'Overview'], ['Activity', 'Transactions'], ['Budget', 'Budget'], ['Goals', 'Goals'], ['Insights', 'Insights'], ['Settings', 'Settings']];
const overflow = () => page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, bw: document.body.scrollWidth }));
await step('no sideways overflow on any tab or sheet at 320 / 360 / 390 / 412 px (the zoom-out bug)', async () => {
  for (const w of [320, 360, 390, 412]) {
    await page.setViewportSize({ width: w, height: 800 });
    for (const [t, h] of TABS) {
      await page.locator('.tab', { hasText: t }).click();
      await page.locator('h1', { hasText: h }).waitFor();
      await page.waitForTimeout(120);
      const o = await overflow();
      assert.ok(o.sw <= o.iw && o.bw <= o.iw, `${t} @${w}px overflows: ${JSON.stringify(o)}`);
    }
    await page.goto(url + '#/cards'); await page.locator('h1', { hasText: 'Credit cards' }).waitFor();
    let o = await overflow(); assert.ok(o.sw <= o.iw, `Cards @${w}px overflows ${JSON.stringify(o)}`);
    await page.goto(url + '#/home'); await page.locator('h1', { hasText: 'Overview' }).waitFor();
    await page.getByRole('button', { name: 'Add transaction' }).click();
    await page.waitForTimeout(150);
    o = await overflow(); assert.ok(o.sw <= o.iw, `Quick-add @${w}px overflows ${JSON.stringify(o)}`);
    const sw = await page.locator('.sheet').evaluate((e) => e.getBoundingClientRect().width);
    assert.ok(sw <= w, `sheet wider than screen ${sw}>${w}`);
    await page.keyboard.press('Escape'); await closeSheet();
  }
});
await step('display size: Large and Extra large still fit; Reset to normal restores', async () => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.locator('.tab', { hasText: 'Settings' }).click();
  await page.getByRole('button', { name: 'Extra large' }).click();
  await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue('--ui-scale').trim() === '1.25');
  for (const [t, h] of TABS) {
    await page.locator('.tab', { hasText: t }).click();
    await page.locator('h1', { hasText: h }).waitFor();
    await page.waitForTimeout(120);
    const o = await overflow();
    assert.ok(o.sw <= o.iw + 1, `${t} at Extra large overflows ${JSON.stringify(o)}`);
  }
  await page.locator('.tab', { hasText: 'Activity' }).click();
  await page.getByRole('button', { name: 'Reset size' }).click();
  await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue('--ui-scale').trim() === '1');
  assert.equal(await page.getByRole('button', { name: 'Reset size' }).count(), 0);
});
await step('pinch-zoom is disabled so pages cannot get stuck zoomed', async () => {
  const meta = await page.locator('meta[name=viewport]').getAttribute('content');
  assert.match(meta, /user-scalable=no/);
  assert.match(meta, /maximum-scale=1/);
});
await step('no network requests and no console errors during the whole run', async () => { assert.deepEqual(errors, []); });

// screenshots for visual review
await page.setViewportSize({ width: 390, height: 844 });
await page.locator('.tab', { hasText: 'Home' }).click();
await page.locator('h1', { hasText: 'Overview' }).waitFor();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/30-home-mobile-full.png`, fullPage: true });
await page.locator('.tab', { hasText: 'Insights' }).click();
await page.locator('h1', { hasText: 'Insights' }).waitFor();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/31-insights-mobile-full.png`, fullPage: true });
await page.setViewportSize({ width: 1366, height: 900 });
await page.locator('.side-item', { hasText: 'Home' }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/32-home-desktop-full.png`, fullPage: true });
await page.locator('.side-item', { hasText: 'Insights' }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/33-insights-desktop-full.png`, fullPage: true });
await browser.close();
server.kill();
console.log(`\n${passed} steps passed`);
process.exit(errors.length ? 1 : 0);
