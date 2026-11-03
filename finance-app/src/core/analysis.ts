/** Trend, breakdown, observation and duplicate helpers used by Home and Insights. Pure functions. */
import type { Dataset, ID, Paise, Transaction } from './types';
import { alive, allGoalProgress, compare, healthScore, savingsRate, summarize, type Comparison, type Health, type MonthSummary } from './calc';
import { cardSummaries, cardTotals, type CardTotals } from './cards';
import { addDays, addMonths, dayLabel, inPeriod, monthLabel, periodOf } from './dates';
import { formatINR } from './money';
import type { NudgeAction } from './insights';

/* ---------- trend (oldest -> newest) ---------- */
export interface TrendPoint { key: string; received: Paise; spent: Paise; saved: Paise; rate: number | null }
export function monthlyTrend(data: Dataset, endKey: string, today: string, n = 6): TrendPoint[] {
  return Array.from({ length: n }, (_, i) => {
    const key = addMonths(endKey, i - (n - 1));
    const s = summarize(data, key, today);
    return { key, received: s.received, spent: s.spent, saved: s.saved, rate: savingsRate(s) };
  });
}

/** Total expenses from the start of a budget month up to its n-th day: for a fair "same point last month" comparison. */
export function spentUpTo(data: Dataset, monthKey: string, nDays: number): Paise {
  const period = periodOf(monthKey, data.settings.monthStartDay);
  const cutoff = addDays(period.start, Math.max(0, nDays) - 1);
  return alive(data.transactions).filter((t) => t.type === 'expense' && t.date >= period.start && t.date <= cutoff && t.date <= period.end).reduce((a, t) => a + t.amount, 0);
}

/* ---------- category breakdown ---------- */
export interface CategoryShare { id: ID | null; name: string; icon: string; spent: Paise; share: number; budget: Paise }
export function categoryShares(s: MonthSummary): CategoryShare[] {
  const rows: CategoryShare[] = s.expenseRows.filter((r) => r.spent > 0).map((r) => ({ id: r.category.id, name: r.category.name, icon: r.category.icon, spent: r.spent, budget: r.budget, share: s.spent ? (r.spent / s.spent) * 100 : 0 }));
  if (s.uncategorisedSpent > 0) rows.push({ id: null, name: 'Uncategorised', icon: '❔', spent: s.uncategorisedSpent, budget: 0, share: s.spent ? (s.uncategorisedSpent / s.spent) * 100 : 0 });
  return rows.sort((a, b) => b.spent - a.spent);
}

export function topExpenses(data: Dataset, s: MonthSummary, n = 5): Transaction[] {
  return alive(data.transactions).filter((t) => t.type === 'expense' && inPeriod(t.date, s.period)).sort((a, b) => b.amount - a.amount || b.date.localeCompare(a.date)).slice(0, n);
}

/** Months of normal expenses the emergency fund would cover. Uses the average of up to 3 most recent months with spending. */
export function emergencyCoverage(data: Dataset, today: string, currentKey: string): { months: number; saved: Paise; avgSpend: Paise } | null {
  const em = allGoalProgress(data, currentKey).find((g) => g.goal.isEmergency);
  if (!em) return null;
  const trend = monthlyTrend(data, currentKey, today, 4).filter((t) => t.spent > 0);
  const recent = trend.slice(-3);
  if (!recent.length) return null;
  const avg = Math.round(recent.reduce((a, t) => a + t.spent, 0) / recent.length);
  return avg > 0 ? { months: em.progress.saved / avg, saved: em.progress.saved, avgSpend: avg } : null;
}

/* ---------- duplicate guard ---------- */
export function findDuplicate(txns: Transaction[], c: Pick<Transaction, 'type' | 'amount' | 'date' | 'categoryId' | 'transferKind' | 'paymentMethodId'>, ignoreId?: ID): Transaction | undefined {
  return alive(txns).find((t) => t.id !== ignoreId && t.type === c.type && t.amount === c.amount && t.date === c.date && (t.categoryId ?? null) === (c.categoryId ?? null)
    && (t.transferKind ?? null) === (c.transferKind ?? null) && (c.type !== 'transfer' || (t.paymentMethodId ?? null) === (c.paymentMethodId ?? null)));
}

/* ---------- observations: what is going well / needs work / what to do next ---------- */
export interface Observation { id: string; text: string; action?: NudgeAction }
export interface Observations { good: Observation[]; improve: Observation[]; next: Observation[] }

export function observe(data: Dataset, monthKey: string, today: string, cur: MonthSummary, prev: MonthSummary): Observations & { health: Health; comparison: Comparison; cards: CardTotals } {
  const goals = allGoalProgress(data, monthKey);
  const health = healthScore(cur, goals, data.settings);
  const comparison = compare(cur, prev);
  const cards = cardTotals(cardSummaries(data, today));
  const good: Observation[] = [], improve: Observation[] = [], next: Observation[] = [];
  const target = data.settings.targetSavingsRate;
  const rate = savingsRate(cur);
  const has = cur.received > 0 || cur.spent > 0 || cur.saved > 0;
  const over = cur.expenseRows.filter((r) => r.status === 'over').sort((a, b) => (b.spent - b.budget) - (a.spent - a.budget));
  const budgeted = cur.expenseRows.filter((r) => r.budget > 0);
  const savePending = cur.savingsRows.filter((r) => r.budget > 0 && r.spent < r.budget);

  // ----- going well
  if (rate !== null && rate >= target) good.push({ id: 'rate', text: `You saved ${Math.round(rate)}% of your income. That beats your ${target}% target.` });
  if (budgeted.length > 0 && over.length === 0) good.push({ id: 'budget', text: `All ${budgeted.length} budgeted categories are within their limits.` });
  if (prev.spent > 0 && cur.spent > 0 && cur.spent <= prev.spent * 0.95 && (cur.isCurrent ? cur.elapsed >= prev.period.days * 0.9 : true)) good.push({ id: 'down', text: `Spending is ${Math.round((1 - cur.spent / prev.spent) * 100)}% lower than last month.` });
  if (cur.savingsPlanned > 0 && savePending.length === 0) good.push({ id: 'saveplan', text: 'You completed every planned saving this month.' });
  const onTrack = goals.filter((g) => g.progress.status === 'onTrack' || g.progress.status === 'complete');
  if (goals.length > 0 && onTrack.length === goals.length) good.push({ id: 'goals', text: `All ${goals.length} goal${goals.length === 1 ? ' is' : 's are'} on track.` });
  else if (onTrack.length > 0) good.push({ id: 'goals', text: `${onTrack.length} of ${goals.length} goals are on track.` });
  if (cards.outstanding > 0 && cards.overdue === 0 && cards.dueSoon === 0) good.push({ id: 'cards', text: 'No credit card payment is overdue or due soon.' });
  const cov = emergencyCoverage(data, today, monthKey);
  if (cov && cov.months >= 3) good.push({ id: 'cover', text: `Your emergency fund covers about ${cov.months.toFixed(1)} months of expenses.` });

  // ----- needs improvement
  if (has && cur.received > 0 && rate !== null && rate < target) improve.push({ id: 'rate', text: `You saved ${Math.round(rate)}% of your income. Your target is ${target}%.` });
  if (over.length > 0) improve.push({ id: 'over', text: `${over.length === 1 ? '1 category is' : `${over.length} categories are`} over budget: ${over.slice(0, 3).map((r) => `${r.category.name} (+${formatINR(r.spent - r.budget)})`).join(', ')}.` });
  if (prev.spent > 0 && cur.spent >= prev.spent * 1.1 && cur.spent - prev.spent >= 100000) improve.push({ id: 'up', text: `Spending is ${Math.round((cur.spent / prev.spent - 1) * 100)}% higher than last month (${formatINR(cur.spent - prev.spent)} more).` });
  if (cur.isCurrent && cur.elapsed >= 3 && cur.spendBudget > 0 && cur.spent <= cur.spendBudget && cur.projectedSpend > cur.spendBudget) improve.push({ id: 'pace', text: `At this pace you'll spend about ${formatINR(cur.projectedSpend)}, which is ${formatINR(cur.projectedSpend - cur.spendBudget)} over your budget.` });
  const tagged = cur.needSpent + cur.wantSpent;
  if (tagged > 0 && cur.wantSpent / tagged > 0.4) improve.push({ id: 'wants', text: `Wants are ${Math.round((cur.wantSpent / tagged) * 100)}% of your tagged spending. Aim for under 30–40%.` });
  if (cards.overdue > 0) improve.push({ id: 'cardover', text: `${cards.overdue} credit card bill${cards.overdue === 1 ? ' is' : 's are'} overdue. Late fees and interest add up fast.` });
  else if (cards.dueSoon > 0) improve.push({ id: 'carddue', text: `${cards.dueSoon} credit card bill${cards.dueSoon === 1 ? ' is' : 's are'} due within 5 days.` });
  for (const g of goals.filter((x) => x.progress.status === 'offTrack' || x.progress.status === 'overdue').slice(0, 2)) improve.push({ id: `goal-${g.goal.id}`, text: `${g.goal.name} is ${g.progress.status === 'overdue' ? 'past its target date' : 'off track'}.` });
  if (cur.isCurrent && cur.received === 0 && data.settings.salary > 0) improve.push({ id: 'noinc', text: 'No income is recorded this month yet.' });
  if (cur.unallocated < 0 && cur.spendBudget + cur.savingsPlanned > 0) improve.push({ id: 'overalloc', text: `Your plan is ${formatINR(-cur.unallocated)} more than your salary.` });
  if (cov && cov.months < 3 && cov.avgSpend > 0) improve.push({ id: 'cover', text: `Your emergency fund covers ${cov.months.toFixed(1)} months of expenses. Aim for 3 to 6.` });

  // ----- what to do next (specific, with a one-tap action where possible)
  if (cur.isCurrent && cur.received === 0 && data.settings.salary > 0) next.push({ id: 'salary', text: `Record your ${formatINR(data.settings.salary)} salary.`, action: { kind: 'salary', amount: data.settings.salary, label: 'Add salary' } });
  for (const r of savePending.slice(0, 2)) next.push({ id: `save-${r.category.id}`, text: `Save ${formatINR(r.budget - r.spent)} to ${r.category.name} to complete this month's plan.`, action: { kind: 'save', amount: r.budget - r.spent, categoryId: r.category.id, label: 'Save now' } });
  if (cards.nextDue && (cards.overdue > 0 || cards.dueSoon > 0)) next.push({ id: 'pay', text: `Pay ${formatINR(cards.nextDue.amount)} on ${cards.nextDue.card} by ${dayLabel(cards.nextDue.date)}.`, action: { kind: 'goto', to: '/cards', label: 'Open cards' } });
  if (over[0]) next.push({ id: 'trim', text: `Hold ${over[0].category.name} spending for the rest of the month. You're ${formatINR(over[0].spent - over[0].budget)} over.`, action: { kind: 'goto', to: '/budget', label: 'See budget' } });
  const worstGoal = goals.find((g) => (g.progress.status === 'offTrack' || g.progress.status === 'behind') && g.progress.gapMonthly > 0);
  if (worstGoal) next.push({ id: 'goalfix', text: `${worstGoal.goal.name}: save ${formatINR(worstGoal.progress.gapMonthly)} more each month${worstGoal.progress.projectedMonth ? `, or move the target date to ${monthLabel(worstGoal.progress.projectedMonth)}` : ''}.`, action: { kind: 'goto', to: '/goals', label: 'Adjust goal' } });
  const topUp = comparison.categories.find((c) => c.delta >= 50000 && c.prev > 0 && c.cur >= c.prev * 1.25);
  if (topUp) next.push({ id: 'topup', text: `${topUp.name} rose by ${formatINR(topUp.delta)}. Check if every entry was needed.` });
  if (cur.daysLeft > 0 && cur.daysLeft <= Math.ceil(cur.period.days * 0.25) && cur.unusedBudget >= 100000) {
    const g = goals.find((x) => x.progress.status !== 'complete');
    const amt = Math.floor(Math.min(cur.unusedBudget, Math.max(0, cur.budgetRemaining)) / 100) * 100;
    if (g && amt >= 100000) next.push({ id: 'move', text: `Move ${formatINR(amt)} of unused budget into ${g.goal.name}.`, action: { kind: 'save', amount: amt, categoryId: alive(data.categories).find((c) => c.goalId === g.goal.id)?.id ?? null, label: 'Move to goal' } });
  }
  if (cur.unallocated >= 100000) next.push({ id: 'alloc', text: `${formatINR(cur.unallocated)} of your salary is not planned. Give it a job (a goal or a budget).`, action: { kind: 'goto', to: '/budget', label: 'Plan it' } });
  if (!has) next.push({ id: 'start', text: 'Add your first income and expense to see real insights here.' });
  if (!next.length && has) next.push({ id: 'keep', text: 'Keep logging every expense the same day. It takes seconds and keeps these numbers honest.' });

  return { good, improve, next, health, comparison, cards };
}
