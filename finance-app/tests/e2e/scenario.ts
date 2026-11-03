/**
 * Builds a realistic 4-month dataset (relative to today's date) as a Rupee Routine backup file, plus EXPECTED figures
 * computed with plain arithmetic (independent of the app's calculation code). Run: npx vite-node tests/e2e/scenario.ts <outDir>
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { buildSeed } from '../../src/core/seed';
import { buildBackup } from '../../src/core/backup';
import { base } from '../../src/core/factory';
import { addMonths, pad, periodKeyForDate, todayStr } from '../../src/core/dates';
import { cardSummary } from '../../src/core/cards';
import type { Transaction } from '../../src/core/types';

const out = process.argv[2] ?? 'tests/e2e/shots';
mkdirSync(out, { recursive: true });
const R = (n: number) => Math.round(n * 100);
const today = todayStr();
const key = periodKeyForDate(today, 1);
const d = buildSeed({ salary: R(86000), userName: 'Sai', useDefaultCategories: true, emergencyGoal: true, marriageGoal: true, today, now: Date.now(), deviceId: 'scenario' });
for (const b of d.budgets) b.effectiveFrom = addMonths(key, -4); // budgets existed for the whole history
const card = d.paymentMethods.find((p) => p.name === 'Credit Card')!;
card.billingDay = 15; card.dueDay = 5; card.creditLimit = R(100000);
const cat = (n: string) => d.categories.find((c) => c.name === n)!;
const pm = (n: string) => d.paymentMethods.find((p) => p.name === n)!;
const goal = (n: string) => d.goals.find((g) => g.name === n)!;

const add = (t: Partial<Transaction> & Pick<Transaction, 'type' | 'amount' | 'date'>) => {
  if (t.date > today) return; // never in the future
  d.transactions.push({ ...base(Date.now(), 'scenario'), categoryId: null, paymentMethodId: null, need: null, note: '', transferKind: null, goalId: null, ...t });
};
for (let off = -3; off <= 0; off++) {
  const m = addMonths(key, off);
  const dt = (day: number) => `${m}-${pad(day)}`;
  const heavy = off === -2 ? 2 : 1;
  add({ type: 'income', amount: R(86000), date: dt(1), categoryId: cat('Salary').id, note: 'Salary' });
  add({ type: 'expense', amount: R(15500), date: dt(2), categoryId: cat('Rent').id, paymentMethodId: pm('UPI').id, need: 'need' });
  add({ type: 'expense', amount: R(2400 + off * 50), date: dt(6), categoryId: cat('Electricity').id, paymentMethodId: pm('UPI').id, need: 'need' });
  add({ type: 'expense', amount: R(1800), date: dt(5), categoryId: cat('Groceries').id, paymentMethodId: pm('UPI').id, need: 'need' });
  add({ type: 'expense', amount: R(2200), date: dt(12), categoryId: cat('Groceries').id, paymentMethodId: pm('UPI').id, need: 'need' });
  add({ type: 'expense', amount: R(1600), date: dt(20), categoryId: cat('Groceries').id, paymentMethodId: pm('Cash').id, need: 'need' });
  add({ type: 'expense', amount: R(1200 + off * 100), date: dt(8), categoryId: cat('Eating Out').id, paymentMethodId: pm('Cash').id, need: 'want' });
  add({ type: 'expense', amount: R(1900), date: dt(16), categoryId: cat('Eating Out').id, paymentMethodId: card.id, need: 'want', note: 'Dinner' });
  add({ type: 'expense', amount: R(4500 * heavy), date: dt(10), categoryId: cat('Shopping').id, paymentMethodId: card.id, need: 'want', note: 'Clothes' });
  add({ type: 'expense', amount: R(1500), date: dt(14), categoryId: cat('Fuel').id, paymentMethodId: pm('UPI').id, need: 'need' });
  add({ type: 'transfer', transferKind: 'savings', amount: goal('Emergency Fund').monthlyContribution, date: dt(2), categoryId: cat('Emergency Fund').id, goalId: goal('Emergency Fund').id });
  add({ type: 'transfer', transferKind: 'savings', amount: goal('Marriage Fund').monthlyContribution, date: dt(2), categoryId: cat('Marriage Fund').id, goalId: goal('Marriage Fund').id });
  add({ type: 'transfer', transferKind: 'savings', amount: R(4300), date: dt(3), categoryId: cat('Mutual Fund / SIP').id });
}
// Card bills: the two oldest months were paid in full; last month's purchases are still unpaid.
for (const off of [-3, -2]) {
  const m = addMonths(key, off);
  const spent = d.transactions.filter((t) => t.type === 'expense' && t.paymentMethodId === card.id && t.date.startsWith(m)).reduce((a, t) => a + t.amount, 0);
  add({ type: 'transfer', transferKind: 'cardBill', amount: spent, date: `${addMonths(key, off + 1)}-${pad(3)}`, paymentMethodId: card.id });
}

// ---- EXPECTED values by plain arithmetic (not via app code)
const inMonth = (m: string) => d.transactions.filter((t) => t.date.startsWith(m));
const sum = (a: Transaction[]) => a.reduce((s, t) => s + t.amount, 0);
const month = (m: string) => {
  const t = inMonth(m);
  return {
    income: sum(t.filter((x) => x.type === 'income')),
    expenses: sum(t.filter((x) => x.type === 'expense')),
    savings: sum(t.filter((x) => x.type === 'transfer' && x.transferKind === 'savings')),
    cardSpend: sum(t.filter((x) => x.type === 'expense' && x.paymentMethodId === card.id)),
    cardBills: sum(t.filter((x) => x.type === 'transfer' && x.transferKind === 'cardBill')),
  };
};
const allCardSpend = sum(d.transactions.filter((t) => t.type === 'expense' && t.paymentMethodId === card.id));
const allCardPaid = sum(d.transactions.filter((t) => t.type === 'transfer' && t.transferKind === 'cardBill'));
const cs = cardSummary(d, card, today);
const expected = {
  today, key, prevKey: addMonths(key, -1),
  cur: month(key), prev: month(addMonths(key, -1)),
  cardOutstanding: allCardSpend - allCardPaid,
  cardDueRemaining: cs.dueRemaining, cardStatus: cs.status,
  expenseCategories: d.categories.filter((c) => c.kind === 'expense' && !c.parentId).map((c) => c.name),
  groups: d.groups.map((g) => g.name),
  txnCount: d.transactions.length,
};
writeFileSync(`${out}/scenario.json`, JSON.stringify(buildBackup(d)));
writeFileSync(`${out}/expected.json`, JSON.stringify(expected, null, 1));
console.log('scenario written:', expected.txnCount, 'transactions; prev month', expected.prevKey, expected.prev, 'card outstanding', expected.cardOutstanding / 100, expected.cardStatus);
