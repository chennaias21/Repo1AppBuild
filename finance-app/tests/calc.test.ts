import { describe, expect, it } from 'vitest';
import { addTxn, cat, goal, pm, R, seeded } from './helpers';
import { allGoalProgress, budgetFor, compare, goalProgress, goalSaved, healthScore, plannedFor, summarize, weekBars } from '../src/core/calc';
import { formatINR, formatCompact, parseINR, groupIndian } from '../src/core/money';
import { addMonths, monthDiff, periodKeyForDate, periodOf } from '../src/core/dates';

const TODAY = '2026-11-10';
const KEY = '2026-11';

describe('money', () => {
  it('formats Indian grouping', () => {
    expect(formatINR(R(150000))).toBe('₹1,50,000');
    expect(formatINR(R(2000000))).toBe('₹20,00,000');
    expect(formatINR(R(999))).toBe('₹999');
    expect(formatINR(12345)).toBe('₹123.45');
    expect(formatINR(-R(1250))).toBe('-₹1,250');
    expect(formatINR(0)).toBe('₹0');
    expect(groupIndian('123456789')).toBe('12,34,56,789');
  });
  it('compact', () => {
    expect(formatCompact(R(150000))).toBe('₹1.5L');
    expect(formatCompact(R(2000000))).toBe('₹20L');
    expect(formatCompact(R(25000))).toBe('₹25K');
    expect(formatCompact(R(120000000))).toBe('₹12Cr');
  });
  it('parses input', () => {
    expect(parseINR('1,250.50')).toBe(125050);
    expect(parseINR('₹ 450')).toBe(45000);
    expect(parseINR('abc')).toBeNull();
    expect(parseINR('')).toBeNull();
    expect(parseINR('1.234')).toBeNull();
  });
});

describe('periods', () => {
  it('calendar month', () => {
    const p = periodOf('2026-02', 1);
    expect(p.start).toBe('2026-02-01');
    expect(p.end).toBe('2026-02-28');
    expect(p.days).toBe(28);
  });
  it('custom start day', () => {
    const p = periodOf('2026-11', 5);
    expect(p.start).toBe('2026-11-05');
    expect(p.end).toBe('2026-12-04');
    expect(p.days).toBe(30);
    expect(periodKeyForDate('2026-12-04', 5)).toBe('2026-11');
    expect(periodKeyForDate('2026-12-05', 5)).toBe('2026-12');
    expect(periodKeyForDate('2027-01-02', 5)).toBe('2026-12');
  });
  it('month math', () => {
    expect(addMonths('2026-11', 3)).toBe('2027-02');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(monthDiff('2026-11', '2028-10')).toBe(23);
  });
});

describe('seed', () => {
  it('seeds budgets as % of salary and adds up to 100%', () => {
    const d = seeded();
    const s = summarize(d, KEY, TODAY);
    // ~70% of 86,000 for spending, ~30% for savings
    expect(s.spendBudget).toBeGreaterThan(R(59000));
    expect(s.spendBudget).toBeLessThan(R(61500));
    expect(s.savingsPlanned).toBeGreaterThan(R(25000));
    expect(s.savingsPlanned).toBeLessThan(R(26500));
    expect(s.unallocated).toBe(0); // the sample plan adds up to the salary exactly
    expect(d.goals.map((g) => g.name).sort()).toEqual(['Emergency Fund', 'Marriage Fund']);
  });
  it('goal-linked savings categories take the goal contribution', () => {
    const d = seeded();
    const em = cat(d, 'Emergency Fund');
    expect(plannedFor(em, d, KEY)).toBe(goal(d, 'Emergency Fund').monthlyContribution);
  });
});

describe('no double counting', () => {
  it('savings transfers and card bill payments are not expenses; card spend counts when made', () => {
    const d = seeded();
    const credit = pm(d, 'Credit Card');
    addTxn(d, { type: 'income', amount: R(86000), date: '2026-11-01', categoryId: cat(d, 'Salary').id });
    addTxn(d, { type: 'expense', amount: R(5000), date: '2026-11-03', categoryId: cat(d, 'Shopping').id, paymentMethodId: credit.id, need: 'want' });
    addTxn(d, { type: 'transfer', transferKind: 'cardBill', amount: R(5000), date: '2026-11-05', paymentMethodId: credit.id });
    addTxn(d, { type: 'transfer', transferKind: 'savings', amount: R(10000), date: '2026-11-02', categoryId: cat(d, 'Marriage Fund').id, goalId: goal(d, 'Marriage Fund').id });
    const s = summarize(d, KEY, TODAY);
    expect(s.spent).toBe(R(5000)); // only the card swipe
    expect(s.cardSpend).toBe(R(5000));
    expect(s.cardBillPaid).toBe(R(5000));
    expect(s.saved).toBe(R(10000));
    expect(s.received).toBe(R(86000));
    expect(s.savingsRows.find((r) => r.category.name === 'Marriage Fund')!.spent).toBe(R(10000));
  });
  it('sub-category spend rolls up to the parent budget', () => {
    const d = seeded();
    const eat = cat(d, 'Eating Out');
    const sub = { ...eat, id: 'sub1', name: 'Cafes', parentId: eat.id, sort: 99 };
    d.categories.push(sub);
    addTxn(d, { type: 'expense', amount: R(300), date: '2026-11-04', categoryId: sub.id });
    addTxn(d, { type: 'expense', amount: R(200), date: '2026-11-05', categoryId: eat.id });
    const s = summarize(d, KEY, TODAY);
    const row = s.expenseRows.find((r) => r.category.id === eat.id)!;
    expect(row.spent).toBe(R(500));
    expect(s.expenseRows.some((r) => r.category.id === 'sub1')).toBe(false);
  });
  it('deleted transactions are ignored', () => {
    const d = seeded();
    const t = addTxn(d, { type: 'expense', amount: R(999), date: '2026-11-04', categoryId: cat(d, 'Fuel').id });
    t.deletedAt = 5;
    expect(summarize(d, KEY, TODAY).spent).toBe(0);
  });
});

describe('budgets & alerts', () => {
  it('versions budgets by month', () => {
    const d = seeded();
    const shop = cat(d, 'Shopping');
    const orig = budgetFor(d.budgets, shop.id, '2026-11');
    d.budgets.push({ id: 'b2', createdAt: 2, updatedAt: 2, categoryId: shop.id, effectiveFrom: '2027-01', amount: R(9000) });
    expect(budgetFor(d.budgets, shop.id, '2026-12')).toBe(orig);
    expect(budgetFor(d.budgets, shop.id, '2027-01')).toBe(R(9000));
    expect(budgetFor(d.budgets, shop.id, '2027-05')).toBe(R(9000));
    expect(budgetFor(d.budgets, shop.id, '2026-10')).toBe(0);
  });
  it('category statuses at 79%, 80%, 100%, 101%', () => {
    const d = seeded();
    const shop = cat(d, 'Shopping');
    const limit = budgetFor(d.budgets, shop.id, KEY);
    const status = (amt: number) => {
      const dd = structuredClone(d);
      addTxn(dd, { type: 'expense', amount: amt, date: '2026-11-04', categoryId: shop.id });
      return summarize(dd, KEY, TODAY).expenseRows.find((r) => r.category.id === shop.id)!.status;
    };
    expect(status(Math.floor(limit * 0.79))).toBe('onTrack');
    expect(status(Math.ceil(limit * 0.8))).toBe('watch');
    expect(status(limit)).toBe('watch');
    expect(status(limit + 1)).toBe('over');
  });
  it('overall status: on track / watch (projection) / over', () => {
    const d = seeded();
    expect(summarize(d, KEY, TODAY).status).toBe('onTrack');
    // heavy flexible spending early -> projection beats budget
    const dd = structuredClone(d);
    addTxn(dd, { type: 'expense', amount: R(30000), date: '2026-11-08', categoryId: cat(dd, 'Groceries').id });
    // groceries 6,000 budget -> that category is over -> over
    expect(summarize(dd, KEY, TODAY).status).toBe('over');
    const d3 = structuredClone(d);
    for (const c of d3.categories.filter((x) => x.kind === 'expense' && x.behavior === 'flexible')) {
      const b = budgetFor(d3.budgets, c.id, KEY);
      if (b > 0) addTxn(d3, { type: 'expense', amount: Math.floor(b * 0.5), date: '2026-11-09', categoryId: c.id });
    }
    // 50% of every flexible budget gone by day 10 of 30 -> pace is 150% of flexible budget -> watch
    const s3 = summarize(d3, KEY, TODAY);
    expect(s3.expenseRows.every((r) => r.status !== 'over')).toBe(true);
    expect(s3.projectedSpend).toBeGreaterThan(s3.spendBudget);
    expect(s3.status).toBe('watch');
  });
  it('budget remaining & unused budget', () => {
    const d = seeded();
    addTxn(d, { type: 'expense', amount: R(1000), date: '2026-11-04', categoryId: cat(d, 'Groceries').id });
    const s = summarize(d, KEY, TODAY);
    expect(s.budgetRemaining).toBe(s.spendBudget - R(1000));
    expect(s.unusedBudget).toBe(s.spendBudget - R(1000));
  });
  it('uncategorised spend counts in total', () => {
    const d = seeded();
    addTxn(d, { type: 'expense', amount: R(250), date: '2026-11-04' });
    const s = summarize(d, KEY, TODAY);
    expect(s.spent).toBe(R(250));
    expect(s.uncategorisedSpent).toBe(R(250));
  });
});

describe('safe to spend', () => {
  it('flexible pool / days left (hand computed)', () => {
    const d = seeded(); // today Nov 10 => daysLeft = 21
    const s0 = summarize(d, KEY, TODAY);
    const flexBudget = s0.expenseRows.filter((r) => r.category.behavior !== 'fixed').reduce((a, r) => a + r.budget, 0);
    expect(s0.daysLeft).toBe(21);
    expect(s0.daily!.limit).toBe(Math.floor(flexBudget / 21 / 100) * 100);
    // spend 6,000 on flexible earlier: pool shrinks
    addTxn(d, { type: 'expense', amount: R(6000), date: '2026-11-05', categoryId: cat(d, 'Groceries').id });
    const s1 = summarize(d, KEY, TODAY);
    expect(s1.daily!.pool).toBe(flexBudget - R(6000));
    expect(s1.daily!.limit).toBe(Math.floor((flexBudget - R(6000)) / 21 / 100) * 100);
  });
  it("today's spend reduces what is left today but not tomorrow's base", () => {
    const d = seeded();
    const before = summarize(d, KEY, TODAY).daily!;
    addTxn(d, { type: 'expense', amount: R(500), date: TODAY, categoryId: cat(d, 'Eating Out').id });
    const after = summarize(d, KEY, TODAY).daily!;
    expect(after.limit).toBe(before.limit); // daily allowance is stable through the day
    expect(after.safeLeft).toBe(before.limit - R(500));
  });
  it('fixed expenses do not eat the flexible allowance', () => {
    const d = seeded();
    const before = summarize(d, KEY, TODAY).daily!.limit;
    const rent = cat(d, 'Rent');
    addTxn(d, { type: 'expense', amount: budgetFor(d.budgets, rent.id, KEY), date: '2026-11-01', categoryId: rent.id });
    expect(summarize(d, KEY, TODAY).daily!.limit).toBe(before);
  });
  it('never negative when flexible budget is blown', () => {
    const d = seeded();
    addTxn(d, { type: 'expense', amount: R(80000), date: '2026-11-04', categoryId: cat(d, 'Shopping').id });
    const dl = summarize(d, KEY, TODAY).daily!;
    expect(dl.limit).toBe(0);
    expect(dl.safeLeft).toBe(0);
  });
  it('null for a past month', () => {
    expect(summarize(seeded(), '2026-09', TODAY).daily).toBeNull();
  });
  it('last day divides by 1', () => {
    const d = seeded('2026-11-30');
    expect(summarize(d, KEY, '2026-11-30').daysLeft).toBe(1);
  });
});

describe('goals', () => {
  it('marriage fund sample: required monthly and off-track', () => {
    const d = seeded();
    const g = goal(d, 'Marriage Fund');
    const p = goalProgress(g, goalSaved(g, d.transactions), KEY);
    expect(p.saved).toBe(R(400000));
    expect(p.remaining).toBe(R(1600000));
    expect(p.pct).toBe(20);
    expect(p.monthsLeft).toBe(24);
    expect(p.requiredMonthly).toBe(Math.ceil(R(1600000) / 24 / 100) * 100); // 66,666.67 -> ₹66,667
    expect(p.requiredMonthly).toBe(R(66667));
    expect(p.status).toBe('offTrack');
    expect(p.gapMonthly).toBe(p.requiredMonthly! - g.monthlyContribution);
  });
  it('on track / behind boundaries', () => {
    const base = seeded();
    const g = { ...goal(base, 'Marriage Fund') };
    const req = R(66667);
    expect(goalProgress({ ...g, monthlyContribution: req }, R(400000), KEY).status).toBe('onTrack');
    expect(goalProgress({ ...g, monthlyContribution: req - 100 }, R(400000), KEY).status).toBe('behind');
    expect(goalProgress({ ...g, monthlyContribution: Math.floor(req * 0.75) - 1 }, R(400000), KEY).status).toBe('offTrack');
  });
  it('complete, overdue and no-date goals', () => {
    const g = { ...goal(seeded(), 'Marriage Fund') };
    expect(goalProgress(g, R(2000000), KEY).status).toBe('complete');
    expect(goalProgress({ ...g, targetDate: '2026-09' }, R(100), KEY).status).toBe('overdue');
    const em = { ...goal(seeded(), 'Emergency Fund') };
    const p = goalProgress(em, 0, KEY);
    expect(p.requiredMonthly).toBeNull();
    expect(p.status).toBe('onTrack');
    expect(p.projectedMonth).toBe(addMonths(KEY, Math.ceil(R(150000) / em.monthlyContribution) - 1));
    expect(goalProgress({ ...em, monthlyContribution: 0 }, 0, KEY).status).toBe('behind');
  });
  it('contributions via savings transfers add to saved', () => {
    const d = seeded();
    const g = goal(d, 'Emergency Fund');
    addTxn(d, { type: 'transfer', transferKind: 'savings', amount: R(6000), date: '2026-11-02', categoryId: cat(d, 'Emergency Fund').id, goalId: g.id });
    expect(goalSaved(g, d.transactions)).toBe(R(6000));
    expect(allGoalProgress(d, KEY).find((x) => x.goal.id === g.id)!.progress.pct).toBe(4);
  });
  it('this-month target date still needs the whole remainder', () => {
    const g = { ...goal(seeded(), 'Marriage Fund'), targetDate: KEY };
    const p = goalProgress(g, R(1000000), KEY);
    expect(p.monthsLeft).toBe(1);
    expect(p.requiredMonthly).toBe(R(1000000));
  });
});

describe('weekly tracker, need/want', () => {
  it('7 bars Monday to Sunday', () => {
    const d = seeded(); // 2026-11-10 is a Tuesday
    addTxn(d, { type: 'expense', amount: R(100), date: '2026-11-09', categoryId: cat(d, 'Fuel').id });
    addTxn(d, { type: 'expense', amount: R(200), date: '2026-11-10', categoryId: cat(d, 'Fuel').id });
    const bars = weekBars(d.transactions, periodOf(KEY), TODAY);
    expect(bars.map((b) => b.date)[0]).toBe('2026-11-09');
    expect(bars[6].date).toBe('2026-11-15');
    expect(bars[0].spent).toBe(R(100));
    expect(bars[1].isToday).toBe(true);
    expect(bars[1].spent).toBe(R(200));
  });
  it('need/want split', () => {
    const d = seeded();
    addTxn(d, { type: 'expense', amount: R(700), date: '2026-11-04', need: 'need', categoryId: cat(d, 'Groceries').id });
    addTxn(d, { type: 'expense', amount: R(300), date: '2026-11-04', need: 'want', categoryId: cat(d, 'Shopping').id });
    addTxn(d, { type: 'expense', amount: R(50), date: '2026-11-04', categoryId: cat(d, 'Fuel').id });
    const s = summarize(d, KEY, TODAY);
    expect([s.needSpent, s.wantSpent, s.untaggedSpent]).toEqual([R(700), R(300), R(50)]);
  });
});

describe('monthly comparison & health', () => {
  it('compares with last month', () => {
    const d = seeded();
    addTxn(d, { type: 'income', amount: R(86000), date: '2026-10-01', categoryId: cat(d, 'Salary').id });
    addTxn(d, { type: 'expense', amount: R(2000), date: '2026-10-12', categoryId: cat(d, 'Eating Out').id });
    addTxn(d, { type: 'income', amount: R(90000), date: '2026-11-01', categoryId: cat(d, 'Salary').id });
    addTxn(d, { type: 'expense', amount: R(3000), date: '2026-11-04', categoryId: cat(d, 'Eating Out').id });
    addTxn(d, { type: 'transfer', transferKind: 'savings', amount: R(18000), date: '2026-11-02', categoryId: cat(d, 'Marriage Fund').id, goalId: goal(d, 'Marriage Fund').id });
    const cur = summarize(d, KEY, TODAY);
    const prev = summarize(d, '2026-10', TODAY);
    const c = compare(cur, prev);
    expect(c.received).toEqual({ cur: R(90000), prev: R(86000) });
    expect(c.spent.cur - c.spent.prev).toBe(R(1000));
    expect(c.rate.cur).toBeCloseTo(20, 5);
    expect(c.rate.prev).toBe(0);
    expect(c.categories[0]).toMatchObject({ name: 'Eating Out', cur: R(3000), prev: R(2000), delta: R(1000) });
  });
  it('savings rate null without income', () => {
    expect(compare(summarize(seeded(), KEY, TODAY), summarize(seeded(), '2026-10', TODAY)).rate.cur).toBeNull();
  });
  it('health score is bounded and responds to behaviour', () => {
    const d = seeded();
    const settings = d.settings;
    const goals = () => allGoalProgress(d, KEY);
    const empty = healthScore(summarize(d, KEY, TODAY), goals(), settings);
    expect(empty.score).toBeGreaterThanOrEqual(0);
    expect(empty.score).toBeLessThanOrEqual(100);
    addTxn(d, { type: 'income', amount: R(86000), date: '2026-11-01', categoryId: cat(d, 'Salary').id });
    addTxn(d, { type: 'transfer', transferKind: 'savings', amount: R(25800), date: '2026-11-02', categoryId: cat(d, 'Personal Savings').id });
    const good = healthScore(summarize(d, KEY, TODAY), goals(), settings);
    expect(good.score).toBeGreaterThan(empty.score);
    expect(good.parts.find((p) => p.key === 'savings')!.score).toBe(30); // 30% >= 20% target
    expect(good.parts.reduce((a, p) => a + p.max, 0)).toBe(100);
  });
});
