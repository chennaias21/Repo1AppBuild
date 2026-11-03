import { describe, expect, it } from 'vitest';
import { addTxn, cat, goal, pm, R, seeded } from './helpers';
import { cardSummaries, cardSummary, cardTotals, dueDateFor, lastStatementDate } from '../src/core/cards';
import { categoryShares, emergencyCoverage, findDuplicate, monthlyTrend, observe, topExpenses } from '../src/core/analysis';
import { summarize } from '../src/core/calc';
import { addMonths } from '../src/core/dates';

/** Credit card with statement on the 15th and payment due on the 5th of the next month. */
const withCard = (today = '2026-11-20') => {
  const d = seeded(today);
  const card = pm(d, 'Credit Card');
  card.billingDay = 15; card.dueDay = 5; card.creditLimit = R(100000);
  return { d, card };
};
const spend = (d: ReturnType<typeof seeded>, amt: number, date: string, cname = 'Shopping') =>
  addTxn(d, { type: 'expense', amount: R(amt), date, categoryId: cat(d, cname).id, paymentMethodId: pm(d, 'Credit Card').id });
const pay = (d: ReturnType<typeof seeded>, amt: number, date: string) =>
  addTxn(d, { type: 'transfer', transferKind: 'cardBill', amount: R(amt), date, paymentMethodId: pm(d, 'Credit Card').id });

describe('credit card dates', () => {
  it('statement and due dates', () => {
    expect(lastStatementDate('2026-11-20', 15)).toBe('2026-11-15');
    expect(lastStatementDate('2026-11-10', 15)).toBe('2026-10-15');
    expect(lastStatementDate('2026-11-15', 15)).toBe('2026-11-15');
    expect(dueDateFor('2026-11-15', 15, 5)).toBe('2026-12-05'); // due day before billing day -> next month
    expect(dueDateFor('2026-11-05', 5, 25)).toBe('2026-11-25'); // due later in same month
    expect(dueDateFor('2026-12-15', 15, 5)).toBe('2027-01-05'); // year rollover
  });
});

describe('credit card liability', () => {
  it('splits owed money into statement (due) and not-yet-billed', () => {
    const { d, card } = withCard();
    spend(d, 10000, '2026-10-20');
    spend(d, 3000, '2026-11-18');
    const c = cardSummary(d, card, '2026-11-20');
    expect(c.outstanding).toBe(R(13000));
    expect(c.statementBalance).toBe(R(10000));
    expect(c.dueRemaining).toBe(R(10000));
    expect(c.unbilled).toBe(R(3000));
    expect(c.statementDate).toBe('2026-11-15');
    expect(c.dueDate).toBe('2026-12-05');
    expect(c.daysToDue).toBe(15);
    expect(c.status).toBe('upcoming');
    expect(c.utilisation).toBeCloseTo(13, 5);
  });
  it('payment settles the liability without becoming an expense', () => {
    const { d, card } = withCard();
    spend(d, 10000, '2026-10-20');
    spend(d, 3000, '2026-11-18');
    pay(d, 4000, '2026-11-19');
    let c = cardSummary(d, card, '2026-11-20');
    expect(c.dueRemaining).toBe(R(6000));
    expect(c.outstanding).toBe(R(9000));
    pay(d, 6000, '2026-11-19');
    c = cardSummary(d, card, '2026-11-20');
    expect(c.dueRemaining).toBe(0);
    expect(c.status).toBe('paid');
    expect(c.outstanding).toBe(R(3000)); // only the unbilled purchases remain
    // monthly expenses count the purchases once, and never the bill payments
    expect(summarize(d, '2026-11', '2026-11-20').spent).toBe(R(3000));
    expect(summarize(d, '2026-10', '2026-11-20').spent).toBe(R(10000));
    expect(summarize(d, '2026-11', '2026-11-20').cardBillPaid).toBe(R(10000));
  });
  it('due soon within 5 days and overdue after the due date', () => {
    const { d, card } = withCard();
    spend(d, 10000, '2026-11-10');
    expect(cardSummary(d, card, '2026-12-01').daysToDue).toBe(4);
    expect(cardSummary(d, card, '2026-12-01').status).toBe('dueSoon');
    expect(cardSummary(d, card, '2026-12-05').status).toBe('dueSoon'); // due today
    const late = cardSummary(d, card, '2026-12-06');
    expect(late.status).toBe('overdue'); // new statement date Dec 15 not reached yet
    expect(late.daysToDue).toBe(-1);
  });
  it('a new statement carries unpaid balance forward', () => {
    const { d, card } = withCard();
    spend(d, 10000, '2026-10-20');
    spend(d, 3000, '2026-11-18');
    const c = cardSummary(d, card, '2026-12-16'); // statement Dec 15 includes everything unpaid
    expect(c.statementBalance).toBe(R(13000));
    expect(c.dueRemaining).toBe(R(13000));
    expect(c.unbilled).toBe(0);
    expect(c.dueDate).toBe('2027-01-05');
  });
  it('opening outstanding counts; overpayment becomes a credit balance (clear)', () => {
    const { d, card } = withCard();
    card.openingOutstanding = R(5000);
    expect(cardSummary(d, card, '2026-11-20').outstanding).toBe(R(5000));
    pay(d, 7000, '2026-11-19');
    const c = cardSummary(d, card, '2026-11-20');
    expect(c.outstanding).toBe(-R(2000));
    expect(c.status).toBe('clear');
    expect(c.dueRemaining).toBe(0);
  });
  it('card without a schedule still tracks outstanding', () => {
    const d = seeded();
    spend(d, 2500, '2026-11-02');
    const c = cardSummaries(d, '2026-11-20')[0];
    expect(c.hasSchedule).toBe(false);
    expect(c.outstanding).toBe(R(2500));
    expect(c.dueDate).toBeNull();
    expect(c.status).toBe('upcoming');
  });
  it('totals and next due date across cards', () => {
    const { d } = withCard();
    spend(d, 10000, '2026-10-20');
    spend(d, 3000, '2026-11-18');
    const t = cardTotals(cardSummaries(d, '2026-11-20'));
    expect(t.outstanding).toBe(R(13000));
    expect(t.dueRemaining).toBe(R(10000));
    expect(t.nextDue).toMatchObject({ date: '2026-12-05', card: 'Credit Card', amount: R(10000) });
  });
  it('only credit cards count as cards; UPI/cash spends are never liabilities', () => {
    const { d } = withCard();
    addTxn(d, { type: 'expense', amount: R(500), date: '2026-11-02', categoryId: cat(d, 'Groceries').id, paymentMethodId: pm(d, 'UPI').id });
    expect(cardSummaries(d, '2026-11-20')).toHaveLength(1);
    expect(cardSummaries(d, '2026-11-20')[0].outstanding).toBe(0);
  });
});

describe('analysis helpers', () => {
  const build = () => {
    const d = seeded('2026-11-20');
    for (const [m, inc, exp, sav] of [['2026-08', 86000, 40000, 20000], ['2026-09', 86000, 52000, 18000], ['2026-10', 86000, 47000, 22000], ['2026-11', 86000, 61000, 5000]] as const) {
      addTxn(d, { type: 'income', amount: R(inc), date: `${m}-01`, categoryId: cat(d, 'Salary').id });
      addTxn(d, { type: 'expense', amount: R(exp), date: `${m}-10`, categoryId: cat(d, 'Groceries').id, need: 'need' });
      addTxn(d, { type: 'transfer', transferKind: 'savings', amount: R(sav), date: `${m}-02`, categoryId: cat(d, 'Emergency Fund').id, goalId: goal(d, 'Emergency Fund').id });
    }
    return d;
  };
  it('monthly trend is ordered oldest to newest with matching totals', () => {
    const d = build();
    const t = monthlyTrend(d, '2026-11', '2026-11-20', 4);
    expect(t.map((x) => x.key)).toEqual(['2026-08', '2026-09', '2026-10', '2026-11']);
    expect(t.map((x) => x.spent)).toEqual([R(40000), R(52000), R(47000), R(61000)]);
    expect(t[3].saved).toBe(R(5000));
    expect(t[0].rate).toBeCloseTo((20000 / 86000) * 100, 5);
    expect(monthlyTrend(d, '2026-11', '2026-11-20', 6)[0].key).toBe(addMonths('2026-11', -5));
    // trend equals the single-month summary (one source of truth)
    expect(t[3].spent).toBe(summarize(d, '2026-11', '2026-11-20').spent);
  });
  it('category shares add up to 100% of spending, largest first', () => {
    const d = build();
    addTxn(d, { type: 'expense', amount: R(1000), date: '2026-11-11', categoryId: cat(d, 'Fuel').id });
    addTxn(d, { type: 'expense', amount: R(500), date: '2026-11-11' });
    const s = summarize(d, '2026-11', '2026-11-20');
    const sh = categoryShares(s);
    expect(sh[0].name).toBe('Groceries');
    expect(sh.reduce((a, r) => a + r.spent, 0)).toBe(s.spent);
    expect(sh.reduce((a, r) => a + r.share, 0)).toBeCloseTo(100, 5);
    expect(sh.at(-1)!.name).toBe('Uncategorised');
    expect(topExpenses(d, s, 2).map((t) => t.amount)).toEqual([R(61000), R(1000)]);
  });
  it('emergency fund coverage in months', () => {
    const d = build();
    const c = emergencyCoverage(d, '2026-11-20', '2026-11')!;
    const saved = R(20000 + 18000 + 22000 + 5000);
    expect(c.saved).toBe(saved);
    expect(c.avgSpend).toBe(Math.round(R(52000 + 47000 + 61000) / 3));
    expect(c.months).toBeCloseTo(saved / c.avgSpend, 5);
    expect(emergencyCoverage(seeded(), '2026-11-20', '2026-11')).toBeNull(); // no spending history
  });
  it('duplicate guard matches same type, amount, date and category only', () => {
    const d = build();
    const g = cat(d, 'Groceries');
    expect(findDuplicate(d.transactions, { type: 'expense', amount: R(61000), date: '2026-11-10', categoryId: g.id })).toBeDefined();
    expect(findDuplicate(d.transactions, { type: 'expense', amount: R(61001), date: '2026-11-10', categoryId: g.id })).toBeUndefined();
    expect(findDuplicate(d.transactions, { type: 'expense', amount: R(61000), date: '2026-11-11', categoryId: g.id })).toBeUndefined();
    expect(findDuplicate(d.transactions, { type: 'expense', amount: R(61000), date: '2026-11-10', categoryId: cat(d, 'Fuel').id })).toBeUndefined();
    const t = d.transactions.find((x) => x.amount === R(61000))!;
    expect(findDuplicate(d.transactions, { type: 'expense', amount: R(61000), date: '2026-11-10', categoryId: g.id }, t.id)).toBeUndefined(); // editing itself
    t.deletedAt = 1;
    expect(findDuplicate(d.transactions, { type: 'expense', amount: R(61000), date: '2026-11-10', categoryId: g.id })).toBeUndefined();
  });
  it('observations: positive, negative and next steps reflect the data', () => {
    const d = build(); // Nov: income 86k, spent 61k on Groceries (budget ~6k => over), saved 5k (5.8%)
    const o = observe(d, '2026-11', '2026-11-20', summarize(d, '2026-11', '2026-11-20'), summarize(d, '2026-10', '2026-11-20'));
    expect(o.improve.map((x) => x.id)).toEqual(expect.arrayContaining(['rate', 'over', 'up']));
    const gBudget = d.budgets.find((b) => b.categoryId === cat(d, 'Groceries').id)!.amount;
    const over = R(61000) - gBudget;
    expect(o.improve.find((x) => x.id === 'over')!.text).toContain(`Groceries (+${(over / 100).toLocaleString('en-IN').replace(/^/, '₹')})`);
    expect(o.improve.find((x) => x.id === 'up')!.text).toMatch(/30% higher than last month \(₹14,000 more\)/);
    expect(o.good.map((x) => x.id)).not.toContain('budget');
    expect(o.next.some((x) => x.id === 'trim')).toBe(true);
    expect(o.next.find((x) => x.id.startsWith('save-'))?.action).toMatchObject({ kind: 'save' });
    expect(o.health.score).toBeGreaterThanOrEqual(0);
  });
  it('observations: a healthy month is recognised', () => {
    const d = seeded('2026-11-28');
    addTxn(d, { type: 'income', amount: R(86000), date: '2026-11-01', categoryId: cat(d, 'Salary').id });
    addTxn(d, { type: 'expense', amount: R(3000), date: '2026-11-05', categoryId: cat(d, 'Groceries').id, need: 'need' });
    for (const n of ['Emergency Fund', 'Marriage Fund']) addTxn(d, { type: 'transfer', transferKind: 'savings', amount: goal(d, n).monthlyContribution, date: '2026-11-02', categoryId: cat(d, n).id, goalId: goal(d, n).id });
    for (const n of ['Mutual Fund / SIP', 'Personal Savings']) addTxn(d, { type: 'transfer', transferKind: 'savings', amount: R(4300), date: '2026-11-02', categoryId: cat(d, n).id });
    const o = observe(d, '2026-11', '2026-11-28', summarize(d, '2026-11', '2026-11-28'), summarize(d, '2026-10', '2026-11-28'));
    expect(o.good.map((x) => x.id)).toEqual(expect.arrayContaining(['rate', 'budget', 'saveplan']));
    expect(o.improve.find((x) => x.id === 'over')).toBeUndefined();
  });
  it('card observations flag overdue and due-soon bills', () => {
    const { d } = withCard('2026-12-06');
    spend(d, 10000, '2026-11-10');
    const o = observe(d, '2026-12', '2026-12-06', summarize(d, '2026-12', '2026-12-06'), summarize(d, '2026-11', '2026-12-06'));
    expect(o.improve.map((x) => x.id)).toContain('cardover');
    expect(o.next.find((x) => x.id === 'pay')!.text).toMatch(/Pay ₹10,000 on Credit Card by 5 Dec/);
  });
});
