/** Plain-language nudges from real data. Simple rules, no black box. */
import type { Dataset, ID, Paise } from './types';
import { alive, allGoalProgress, spentByCategoryUpTo, type MonthSummary } from './calc';
import { dayLabel, diffDays, monthLabel } from './dates';
import { formatINR } from './money';

export type NudgeAction =
  | { kind: 'save'; amount: Paise; categoryId?: ID | null; label: string }
  | { kind: 'salary'; amount: Paise; label: string }
  | { kind: 'goto'; to: string; label: string };

export interface Nudge {
  id: string;
  level: 'alert' | 'warn' | 'info' | 'good';
  title: string;
  body: string;
  action?: NudgeAction;
}

const floorRupee = (p: number) => Math.max(0, Math.floor(p / 100) * 100);

export function buildNudges(data: Dataset, monthKey: string, today: string, cur: MonthSummary, prev: MonthSummary): Nudge[] {
  if (!cur.isCurrent) return [];
  const out: Nudge[] = [];
  const { settings } = data;
  const goals = allGoalProgress(data, monthKey);

  // 1. Salary not recorded
  if (cur.received === 0 && settings.salary > 0 && cur.elapsed >= 1) {
    out.push({ id: 'salary', level: 'info', title: 'Salary not recorded yet', body: `Add your ${formatINR(settings.salary)} salary so your budget and savings rate are accurate.`,
      action: { kind: 'salary', amount: settings.salary, label: 'Add salary' } });
  }

  // 2. Category limits
  for (const r of cur.expenseRows) {
    if (r.status === 'over') {
      out.push({ id: `over-${r.category.id}`, level: 'alert', title: `${r.category.name} is over budget`,
        body: `You've spent ${formatINR(r.spent)} against a ${formatINR(r.budget)} limit — ${formatINR(r.spent - r.budget)} over.` });
    } else if (r.status === 'watch') {
      out.push({ id: `watch-${r.category.id}`, level: 'warn', title: `${Math.round(r.pct)}% of ${r.category.name} budget used`,
        body: `${formatINR(r.remaining)} left for the next ${cur.daysLeft} day${cur.daysLeft === 1 ? '' : 's'}.` });
    }
  }

  // 3. Pace
  if (cur.elapsed >= 3 && cur.spendBudget > 0 && cur.projectedSpend > cur.spendBudget && cur.spent <= cur.spendBudget) {
    out.push({ id: 'pace', level: 'warn', title: 'On pace to overspend',
      body: `At your current pace you'll spend about ${formatINR(cur.projectedSpend)} by month-end — ${formatINR(cur.projectedSpend - cur.spendBudget)} over budget. Ease off flexible spending.` });
  }

  // 4. Up vs last month (same point in the month)
  const prevAtPoint = spentByCategoryUpTo(data, prev.period.key, cur.elapsed);
  const ups = cur.expenseRows
    .map((r) => ({ r, before: prevAtPoint.get(r.category.id) ?? 0 }))
    .filter((x) => x.before > 0 && x.r.spent >= 50000 && x.r.spent - x.before >= 30000 && x.r.spent >= x.before * 1.2)
    .sort((a, b) => (b.r.spent - b.before) - (a.r.spent - a.before))
    .slice(0, 2);
  for (const u of ups) {
    out.push({ id: `up-${u.r.category.id}`, level: 'info', title: `${u.r.category.name} is up vs last month`,
      body: `${formatINR(u.r.spent)} so far, up ${Math.round((u.r.spent / u.before - 1) * 100)}% from ${formatINR(u.before)} at this point last month.` });
  }

  // 5. Planned savings not done (Save First, Spend Later)
  if (cur.elapsed >= 3) {
    const pending = cur.savingsRows.filter((r) => r.budget > 0 && r.spent < r.budget && (r.spent === 0 || cur.elapsed >= 15))
      .sort((a, b) => (b.budget - b.spent) - (a.budget - a.spent)).slice(0, 2);
    for (const r of pending) {
      out.push({ id: `save-${r.category.id}`, level: 'warn', title: `${r.category.name}: planned saving not done`,
        body: r.spent === 0 ? `You planned ${formatINR(r.budget)} this month but haven't saved yet. Save first, spend later.` : `${formatINR(r.spent)} of ${formatINR(r.budget)} saved so far.`,
        action: { kind: 'save', amount: r.budget - r.spent, categoryId: r.category.id, label: 'Save now' } });
    }
  }

  // 6. Unused budget -> goals (last quarter of the month)
  if (cur.daysLeft > 0 && cur.daysLeft <= Math.ceil(cur.period.days * 0.25)) {
    const movable = floorRupee(Math.min(cur.unusedBudget, Math.max(0, cur.budgetRemaining)));
    const target = goals.find((g) => g.progress.status !== 'complete');
    const cat = target && alive(data.categories).find((c) => c.goalId === target.goal.id);
    if (movable >= 100000 && target) {
      out.push({ id: 'unused', level: 'good', title: `${formatINR(movable)} budget is unused`,
        body: `Move it to ${target.goal.name} instead of letting it get spent.`,
        action: { kind: 'save', amount: movable, categoryId: cat?.id ?? null, label: 'Move to goal' } });
    }
  }

  // 7. Unallocated / over-allocated salary
  if (cur.spendBudget + cur.savingsPlanned > 0) {
    if (cur.unallocated >= 100000) {
      out.push({ id: 'unalloc', level: 'info', title: `${formatINR(cur.unallocated)} of salary has no job`, body: 'Give every rupee a purpose: add it to a budget or a goal.', action: { kind: 'goto', to: '/budget', label: 'Open budget' } });
    } else if (cur.unallocated < 0) {
      out.push({ id: 'overalloc', level: 'warn', title: 'Budgets add up to more than your salary', body: `Planned spending + savings exceed your salary by ${formatINR(-cur.unallocated)}.`, action: { kind: 'goto', to: '/budget', label: 'Fix budget' } });
    }
  }

  // 8. Goals off track
  for (const g of goals.filter((x) => x.progress.status === 'offTrack' || x.progress.status === 'overdue').slice(0, 2)) {
    const p = g.progress;
    out.push({ id: `goal-${g.goal.id}`, level: 'warn', title: `${g.goal.name} is off track`,
      body: p.status === 'overdue' ? `The target date has passed with ${formatINR(p.remaining)} still to go.`
        : `Needs ${formatINR(p.requiredMonthly ?? 0)}/month to finish by ${monthLabel(g.goal.targetDate!)}; plan is ${formatINR(g.goal.monthlyContribution)}${p.projectedMonth ? ` (reaches it by ${monthLabel(p.projectedMonth)})` : ''}.`,
      action: { kind: 'goto', to: '/goals', label: 'Adjust goal' } });
  }

  // 9. Not logging
  const last = alive(data.transactions).map((t) => t.date).filter((d) => d <= today).sort().pop();
  if (cur.elapsed >= 4 && (!last || diffDays(last, today) >= 3)) {
    out.push({ id: 'quiet', level: 'info', title: 'No entries for a few days', body: last ? `Last entry was on ${dayLabel(last)}. Add what you've spent while you remember.` : 'Add your first expense to start tracking.' });
  }

  // 10. Backup
  const txCount = alive(data.transactions).length;
  const lb = settings.lastBackupAt;
  if (txCount >= 10 && (!lb || Date.now() - lb > 30 * 86400000)) {
    out.push({ id: 'backup', level: 'info', title: 'Back up your data', body: lb ? 'Your last backup is over 30 days old. Your data lives only on this device.' : "You haven't made a backup yet. Your data lives only on this device.", action: { kind: 'goto', to: '/settings/backup', label: 'Back up' } });
  }

  // 11. Good news
  if (out.every((n) => n.level === 'info' || n.level === 'good') && cur.status === 'onTrack' && cur.spendBudget > 0) {
    out.push({ id: 'ok', level: 'good', title: "You're on track", body: cur.daily ? `Safe to spend ${formatINR(cur.daily.safeLeft)} more today and stay within budget.` : 'Spending is within your plan.' });
  }

  const rank = { alert: 0, warn: 1, info: 2, good: 3 } as const;
  return out.sort((a, b) => rank[a.level] - rank[b.level]);
}
