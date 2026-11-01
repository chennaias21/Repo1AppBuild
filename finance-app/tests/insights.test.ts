import { describe, expect, it } from 'vitest';
import { addTxn, cat, goal, R, seeded } from './helpers';
import { budgetFor, summarize } from '../src/core/calc';
import { buildNudges } from '../src/core/insights';
import { addMonths } from '../src/core/dates';

const nudgesFor = (d: ReturnType<typeof seeded>, today: string) => {
  const key = today.slice(0, 7);
  return buildNudges(d, key, today, summarize(d, key, today), summarize(d, addMonths(key, -1), today));
};
const ids = (n: { id: string }[]) => n.map((x) => x.id);

describe('smart assistant nudges', () => {
  it('flags a category at 80% of budget with the amount left', () => {
    const d = seeded('2026-11-10');
    const shop = cat(d, 'Shopping');
    addTxn(d, { type: 'expense', amount: Math.ceil(budgetFor(d.budgets, shop.id, '2026-11') * 0.82), date: '2026-11-05', categoryId: shop.id });
    const n = nudgesFor(d, '2026-11-10').find((x) => x.id === `watch-${shop.id}`)!;
    expect(n.title).toBe('82% of Shopping budget used');
    expect(n.body).toMatch(/left for the next 21 days/);
    expect(n.level).toBe('warn');
  });
  it('flags an overspent category as an alert', () => {
    const d = seeded('2026-11-10');
    const f = cat(d, 'Fuel');
    addTxn(d, { type: 'expense', amount: budgetFor(d.budgets, f.id, '2026-11') + R(100), date: '2026-11-05', categoryId: f.id });
    const n = nudgesFor(d, '2026-11-10');
    expect(n.find((x) => x.id === `over-${f.id}`)?.level).toBe('alert');
    expect(n[0].level).toBe('alert'); // alerts sort first
  });
  it('says eating out is up vs the same point last month', () => {
    const d = seeded('2026-11-10');
    const e = cat(d, 'Eating Out');
    addTxn(d, { type: 'expense', amount: R(1000), date: '2026-10-05', categoryId: e.id });
    addTxn(d, { type: 'expense', amount: R(2000), date: '2026-10-25', categoryId: e.id }); // later in Oct: must NOT count
    addTxn(d, { type: 'expense', amount: R(1500), date: '2026-11-05', categoryId: e.id });
    const n = nudgesFor(d, '2026-11-10').find((x) => x.id === `up-${e.id}`)!;
    expect(n.title).toBe('Eating Out is up vs last month');
    expect(n.body).toMatch(/up 50% from ₹1,000/);
  });
  it('reminds you when planned savings are not done (save first, spend later)', () => {
    const d = seeded('2026-11-10');
    const n = nudgesFor(d, '2026-11-10').find((x) => x.id === `save-${cat(d, 'Marriage Fund').id}`)!;
    expect(n.title).toMatch(/planned saving not done/);
    expect(n.action).toMatchObject({ kind: 'save', amount: goal(d, 'Marriage Fund').monthlyContribution });
    // once saved, it goes away
    addTxn(d, { type: 'transfer', transferKind: 'savings', amount: goal(d, 'Marriage Fund').monthlyContribution, date: '2026-11-02', categoryId: cat(d, 'Marriage Fund').id, goalId: goal(d, 'Marriage Fund').id });
    expect(ids(nudgesFor(d, '2026-11-10'))).not.toContain(`save-${cat(d, 'Marriage Fund').id}`);
  });
  it('does not nag about savings in the first days of the month', () => {
    expect(ids(nudgesFor(seeded('2026-11-02'), '2026-11-02')).some((i) => i.startsWith('save-'))).toBe(false);
  });
  it('suggests moving unused budget to a goal near month end', () => {
    const d = seeded('2026-11-26');
    const n = nudgesFor(d, '2026-11-26').find((x) => x.id === 'unused')!;
    expect(n).toBeDefined();
    expect(n.action).toMatchObject({ kind: 'save' });
    expect(nudgesFor(seeded('2026-11-10'), '2026-11-10').find((x) => x.id === 'unused')).toBeUndefined();
  });
  it('warns about the month-end pace before any category is over', () => {
    const d = seeded('2026-11-10');
    for (const c of d.categories.filter((x) => x.kind === 'expense' && x.behavior === 'flexible')) {
      const b = budgetFor(d.budgets, c.id, '2026-11');
      if (b > 0) addTxn(d, { type: 'expense', amount: Math.floor(b * 0.5), date: '2026-11-09', categoryId: c.id });
    }
    const n = nudgesFor(d, '2026-11-10');
    expect(n.find((x) => x.id === 'pace')?.title).toBe('On pace to overspend');
  });
  it('asks for salary when none is recorded, and not afterwards', () => {
    const d = seeded('2026-11-10');
    expect(nudgesFor(d, '2026-11-10').find((x) => x.id === 'salary')?.action).toMatchObject({ kind: 'salary', amount: R(86000) });
    addTxn(d, { type: 'income', amount: R(86000), date: '2026-11-01', categoryId: cat(d, 'Salary').id });
    expect(ids(nudgesFor(d, '2026-11-10'))).not.toContain('salary');
  });
  it('flags the off-track Marriage Fund and over-planned budgets', () => {
    const d = seeded('2026-11-10');
    expect(ids(nudgesFor(d, '2026-11-10'))).toContain(`goal-${goal(d, 'Marriage Fund').id}`);
    d.settings.salary = R(50000);
    expect(ids(nudgesFor(d, '2026-11-10'))).toContain('overalloc');
  });
  it('shows nothing for past months and a good-news card when on track', () => {
    const d = seeded('2026-11-10');
    expect(buildNudges(d, '2026-09', '2026-11-10', summarize(d, '2026-09', '2026-11-10'), summarize(d, '2026-08', '2026-11-10'))).toEqual([]);
    addTxn(d, { type: 'income', amount: R(86000), date: '2026-11-01', categoryId: cat(d, 'Salary').id });
    for (const g of ['Emergency Fund', 'Marriage Fund']) addTxn(d, { type: 'transfer', transferKind: 'savings', amount: goal(d, g).monthlyContribution, date: '2026-11-02', categoryId: cat(d, g).id, goalId: goal(d, g).id });
    for (const n of ['Mutual Fund / SIP', 'Personal Savings']) addTxn(d, { type: 'transfer', transferKind: 'savings', amount: budgetFor(d.budgets, cat(d, n).id, '2026-11'), date: '2026-11-02', categoryId: cat(d, n).id });
    d.goals.find((g) => g.name === 'Marriage Fund')!.targetDate = '2040-01'; // make it achievable
    expect(ids(nudgesFor(d, '2026-11-10'))).toContain('ok');
  });
  it('nudges a backup only when there is real data and no recent backup', () => {
    const d = seeded('2026-11-10');
    expect(ids(nudgesFor(d, '2026-11-10'))).not.toContain('backup');
    for (let i = 0; i < 10; i++) addTxn(d, { type: 'expense', amount: R(10), date: '2026-11-09', categoryId: cat(d, 'Fuel').id });
    expect(ids(nudgesFor(d, '2026-11-10'))).toContain('backup');
    d.settings.lastBackupAt = Date.now();
    expect(ids(nudgesFor(d, '2026-11-10'))).not.toContain('backup');
  });
});
