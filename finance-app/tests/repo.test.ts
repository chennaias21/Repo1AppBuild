import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/data/db';
import { confirmRecurring, countTxnsForCategory, deleteCategory, deleteGoal, deleteGroup, loadAll, replaceAll, resetAll, saveGoal, setBudget, softDelete, restore, save, newRecord } from '../src/data/repo';
import { budgetFor, summarize } from '../src/core/calc';
import { buildBackup, validateBackupText } from '../src/core/backup';
import { addTxn, cat, goal, R, seeded } from './helpers';
import type { Goal, Recurring } from '../src/core/types';

const KEY = '2026-11';
const load = async () => (await loadAll())!;

beforeEach(async () => {
  await resetAll();
  const d = seeded();
  await replaceAll(d);
});

describe('database layer', () => {
  it('seeds and loads', async () => {
    const d = await load();
    expect(d.settings.salary).toBe(R(86000));
    expect(d.groups.length).toBe(7);
    expect(d.goals).toHaveLength(2);
  });
  it('setBudget applies from a month onward and removes later overrides', async () => {
    const d0 = await load();
    const shop = cat(d0, 'Shopping');
    const orig = budgetFor(d0.budgets, shop.id, '2026-11');
    await setBudget(shop.id, '2027-02', R(7000));
    expect(budgetFor((await load()).budgets, shop.id, '2027-03')).toBe(R(7000));
    expect(budgetFor((await load()).budgets, shop.id, '2026-12')).toBe(orig);
    await setBudget(shop.id, '2026-12', R(3000)); // earlier change wipes the later override
    const d = await load();
    expect(budgetFor(d.budgets, shop.id, '2026-11')).toBe(orig);
    expect(budgetFor(d.budgets, shop.id, '2026-12')).toBe(R(3000));
    expect(budgetFor(d.budgets, shop.id, '2027-03')).toBe(R(3000));
    await setBudget(shop.id, '2026-12', R(3500)); // same month updates in place
    expect(budgetFor((await load()).budgets, shop.id, '2026-12')).toBe(R(3500));
  });
  it('soft delete hides, restore (undo) brings it back', async () => {
    const d0 = await load();
    const t = addTxn(d0, { type: 'expense', amount: R(99), date: '2026-11-03', categoryId: cat(d0, 'Fuel').id });
    await db.transactions.put(t);
    await softDelete('transactions', t.id);
    expect((await load()).transactions).toHaveLength(0);
    await restore('transactions', t.id);
    expect((await load()).transactions).toHaveLength(1);
  });
  it('deleting a category moves its transactions (or leaves them uncategorised) and keeps totals', async () => {
    const d0 = await load();
    const shop = cat(d0, 'Shopping');
    const sub = { ...newRecord(), name: 'Shoes', kind: 'expense' as const, groupId: shop.groupId, parentId: shop.id, icon: '👟', behavior: 'flexible' as const, defaultNeed: null, goalId: null, sort: 99 };
    await db.categories.put(sub);
    for (const [cid, amt] of [[shop.id, 100], [sub.id, 200]] as const) await db.transactions.put(addTxn(d0, { type: 'expense', amount: R(amt), date: '2026-11-03', categoryId: cid }));
    expect(await countTxnsForCategory(shop.id)).toBe(2);
    await deleteCategory(shop.id, cat(d0, 'Gifts').id);
    const d = await load();
    expect(d.categories.some((c) => c.id === shop.id || c.id === sub.id)).toBe(false);
    expect(d.transactions.every((t) => t.categoryId === cat(d0, 'Gifts').id)).toBe(true);
    const s = summarize(d, KEY, '2026-11-10');
    expect(s.spent).toBe(R(300));
    expect(s.expenseRows.find((r) => r.category.name === 'Gifts')!.spent).toBe(R(300));
    await deleteCategory(cat(d0, 'Gifts').id, null);
    expect(summarize(await load(), KEY, '2026-11-10').uncategorisedSpent).toBe(R(300));
  });
  it('deleting a group moves its categories', async () => {
    const d0 = await load();
    const other = d0.groups.find((g) => g.name === 'Other')!;
    const life = d0.groups.find((g) => g.name === 'Lifestyle & Personal')!;
    await deleteGroup(life.id, other.id);
    const d = await load();
    expect(d.groups.some((g) => g.id === life.id)).toBe(false);
    expect(cat(d, 'Shopping').groupId).toBe(other.id);
  });
  it('creating a goal creates a linked savings category; deleting removes both', async () => {
    const g: Goal = { ...newRecord(), name: 'Goa Trip', icon: '🏖️', target: R(60000), initialSaved: 0, targetDate: '2027-06', monthlyContribution: R(5000), priority: 'medium', description: '', isEmergency: false } as Goal;
    await saveGoal(g, true);
    let d = await load();
    const linked = d.categories.find((c) => c.goalId === g.id)!;
    expect(linked).toMatchObject({ name: 'Goa Trip', kind: 'savings' });
    expect(d.groups.find((x) => x.id === linked.groupId)!.name).toBe('Savings & Investments');
    await saveGoal({ ...g, name: 'Goa Trip 2027' }, false); // rename flows to the category
    d = await load();
    expect(d.categories.find((c) => c.goalId === g.id)!.name).toBe('Goa Trip 2027');
    expect(summarize(d, KEY, '2026-11-10').savingsPlanned).toBeGreaterThan(R(25800));
    await deleteGoal(g.id);
    d = await load();
    expect(d.goals.some((x) => x.id === g.id)).toBe(false);
    expect(d.categories.some((c) => c.goalId === g.id)).toBe(false);
  });
  it('confirming a recurring item adds a transaction once and marks the month handled', async () => {
    const d0 = await load();
    const r: Recurring = { ...newRecord(), type: 'expense', amount: R(15500), categoryId: cat(d0, 'Rent').id, dayOfMonth: 1, active: true, lastHandledPeriod: null, note: 'Rent' } as Recurring;
    await db.recurring.put(r);
    await confirmRecurring(r, KEY, 1);
    const d = await load();
    expect(d.transactions).toHaveLength(1);
    expect(d.transactions[0]).toMatchObject({ date: '2026-11-01', amount: R(15500), type: 'expense' });
    expect(d.recurring[0].lastHandledPeriod).toBe(KEY);
  });
  it('restore replaces everything, keeps this device id, and survives a JSON round trip', async () => {
    const src = seeded();
    addTxn(src, { type: 'income', amount: R(1234), date: '2026-11-02', categoryId: cat(src, 'Bonus').id });
    src.settings.salary = R(95000);
    const v = validateBackupText(JSON.stringify(buildBackup(src)));
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    const here = (await load()).settings.deviceId;
    await replaceAll({ ...v.backup.data, settings: { ...v.backup.data.settings, deviceId: here } });
    const d = await load();
    expect(d.settings.salary).toBe(R(95000));
    expect(d.settings.deviceId).toBe(here);
    expect(d.transactions).toHaveLength(1);
    expect(d.transactions[0].amount).toBe(R(1234));
  });
  it('reset deletes everything', async () => {
    await resetAll();
    expect(await loadAll()).toBeNull();
    expect(await db.transactions.count()).toBe(0);
    expect(await db.categories.count()).toBe(0);
  });
  it('save() stamps updatedAt and goal progress uses transfers', async () => {
    const d0 = await load();
    const g = goal(d0, 'Emergency Fund');
    const t0 = g.updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    await save('goals', { ...g, name: 'Rainy Day' });
    expect((await load()).goals.find((x) => x.id === g.id)!.updatedAt).toBeGreaterThan(t0);
  });
});
