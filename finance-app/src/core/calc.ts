/**
 * Pure calculation engine. No UI, no database: everything takes plain data and
 * returns plain numbers (paise). Shared unchanged by web and Android.
 */
import type {
  Budget, Category, Dataset, Goal, GoalStatus, Group, ID, Paise, PaymentMethod, Settings, Status, Transaction,
} from './types';
import { addDays, addMonths, diffDays, inPeriod, monthDiff, parseDate, periodKeyForDate, periodOf, type Period } from './dates';
import { pct } from './money';

export const alive = <T extends { deletedAt?: number | null }>(a: T[]): T[] => a.filter((x) => !x.deletedAt);

/* ---------- budgets & categories ---------- */

/** Budget for a category in a month = latest record effective on/before that month. */
export function budgetFor(budgets: Budget[], categoryId: ID, monthKey: string): Paise {
  let best: Budget | undefined;
  for (const b of budgets) {
    if (b.deletedAt || b.categoryId !== categoryId || b.effectiveFrom > monthKey) continue;
    if (!best || b.effectiveFrom > best.effectiveFrom || (b.effectiveFrom === best.effectiveFrom && b.updatedAt > best.updatedAt)) best = b;
  }
  return best ? best.amount : 0;
}

/** Planned amount: goal-linked savings categories use the goal's monthly contribution. */
export function plannedFor(cat: Category, data: Pick<Dataset, 'budgets' | 'goals'>, monthKey: string): Paise {
  if (cat.kind === 'savings' && cat.goalId) {
    const g = data.goals.find((x) => x.id === cat.goalId && !x.deletedAt);
    if (g) return g.monthlyContribution;
  }
  return budgetFor(data.budgets, cat.id, monthKey);
}

/** Top-level category id for a (sub)category id. */
export function rootIdOf(catMap: Map<ID, Category>, id: ID | null | undefined): ID | null {
  if (!id) return null;
  const c = catMap.get(id);
  if (!c) return null;
  return c.parentId && catMap.has(c.parentId) ? c.parentId : c.id;
}

/* ---------- month summary ---------- */

export interface CategoryRow {
  category: Category;
  budget: Paise;
  spent: Paise; // for savings categories: amount saved
  remaining: Paise; // budget - spent (may be negative)
  pct: number;
  status: Status | 'none';
}
export interface GroupRow { group: Group; budget: Paise; spent: Paise }

export interface MonthSummary {
  period: Period;
  elapsed: number; // days elapsed in period (0 = not started, = days when finished)
  daysLeft: number; // incl. today; 0 if period over / not started
  isCurrent: boolean;
  received: Paise;
  saved: Paise;
  spent: Paise;
  cardSpend: Paise;
  cardBillPaid: Paise;
  needSpent: Paise;
  wantSpent: Paise;
  untaggedSpent: Paise;
  uncategorisedSpent: Paise;
  spendBudget: Paise;
  savingsPlanned: Paise;
  budgetRemaining: Paise;
  unallocated: Paise; // expected income - spend budget - savings planned
  unusedBudget: Paise; // sum over expense categories of max(0, budget-spent)
  expenseRows: CategoryRow[];
  savingsRows: CategoryRow[];
  groupRows: GroupRow[];
  projectedSpend: Paise;
  status: Status;
  daily: { limit: Paise; spentToday: Paise; safeLeft: Paise; pool: Paise } | null;
}

const floorRupee = (p: number) => Math.max(0, Math.floor(p / 100) * 100);

export function summarize(data: Dataset, monthKey: string, today: string): MonthSummary {
  const { settings } = data;
  const period = periodOf(monthKey, settings.monthStartDay);
  const cats = alive(data.categories);
  const catMap = new Map(cats.map((c) => [c.id, c]));
  const pmMap = new Map<ID, PaymentMethod>(alive(data.paymentMethods).map((p) => [p.id, p]));
  const txns = alive(data.transactions).filter((t) => inPeriod(t.date, period));

  const isCurrent = today >= period.start && today <= period.end;
  const elapsed = today < period.start ? 0 : today > period.end ? period.days : diffDays(period.start, today) + 1;
  const daysLeft = isCurrent ? diffDays(today, period.end) + 1 : 0;

  let received = 0, saved = 0, spent = 0, cardSpend = 0, cardBillPaid = 0, needSpent = 0, wantSpent = 0, untaggedSpent = 0, uncategorisedSpent = 0;
  const spentByRoot = new Map<ID, number>();
  const savedByRoot = new Map<ID, number>();
  const savingsByGoal = new Map<ID, ID>(); // goalId -> savings category id
  for (const c of cats) if (c.kind === 'savings' && c.goalId && !c.parentId) savingsByGoal.set(c.goalId, c.id);

  for (const t of txns) {
    if (t.type === 'income') received += t.amount;
    else if (t.type === 'expense') {
      spent += t.amount;
      if (t.paymentMethodId && pmMap.get(t.paymentMethodId)?.type === 'credit') cardSpend += t.amount;
      if (t.need === 'need') needSpent += t.amount;
      else if (t.need === 'want') wantSpent += t.amount;
      else untaggedSpent += t.amount;
      const root = rootIdOf(catMap, t.categoryId);
      if (root) spentByRoot.set(root, (spentByRoot.get(root) ?? 0) + t.amount);
      else uncategorisedSpent += t.amount;
    } else if (t.type === 'transfer') {
      if (t.transferKind === 'savings') {
        saved += t.amount;
        const root = rootIdOf(catMap, t.categoryId) ?? (t.goalId ? savingsByGoal.get(t.goalId) ?? null : null);
        if (root) savedByRoot.set(root, (savedByRoot.get(root) ?? 0) + t.amount);
      } else if (t.transferKind === 'cardBill') cardBillPaid += t.amount;
      // Transfers are NEVER counted as expenses (no double counting).
    }
  }

  const mkRow = (c: Category, actual: number, savings: boolean): CategoryRow => {
    const budget = plannedFor(c, data, monthKey);
    const p = pct(actual, budget);
    let status: Status | 'none' = 'none';
    if (!savings && budget > 0) status = actual > budget ? 'over' : p >= settings.watchPct ? 'watch' : 'onTrack';
    return { category: c, budget, spent: actual, remaining: budget - actual, pct: p, status };
  };

  const roots = (kind: 'expense' | 'savings') => cats.filter((c) => c.kind === kind && !c.parentId).sort((a, b) => a.sort - b.sort);
  const expenseRows = roots('expense').map((c) => mkRow(c, spentByRoot.get(c.id) ?? 0, false));
  const savingsRows = roots('savings').map((c) => mkRow(c, savedByRoot.get(c.id) ?? 0, true));

  const spendBudget = expenseRows.reduce((s, r) => s + r.budget, 0);
  const savingsPlanned = savingsRows.reduce((s, r) => s + r.budget, 0);
  const unusedBudget = expenseRows.reduce((s, r) => s + Math.max(0, r.budget - r.spent), 0);

  const groups = alive(data.groups).sort((a, b) => a.sort - b.sort);
  const groupRows: GroupRow[] = groups
    .map((g) => {
      const rows = expenseRows.filter((r) => r.category.groupId === g.id);
      return { group: g, budget: rows.reduce((s, r) => s + r.budget, 0), spent: rows.reduce((s, r) => s + r.spent, 0) };
    })
    .filter((g) => g.budget > 0 || g.spent > 0);

  // ----- projection & safe-to-spend -----
  const fixedRows = expenseRows.filter((r) => r.category.behavior === 'fixed');
  const flexRows = expenseRows.filter((r) => r.category.behavior !== 'fixed');
  const fixedSpent = fixedRows.reduce((s, r) => s + r.spent, 0);
  const flexSpentAll = spent - fixedSpent; // includes uncategorised
  const flexBudget = flexRows.reduce((s, r) => s + r.budget, 0);
  const fixedOver = fixedRows.reduce((s, r) => s + Math.max(0, r.spent - r.budget), 0);

  let projectedSpend = spent;
  if (isCurrent) {
    const fixedProjected = fixedRows.reduce((s, r) => s + Math.max(r.spent, r.budget), 0);
    const flexProjected = elapsed >= 3 ? (flexSpentAll / elapsed) * period.days : flexSpentAll;
    projectedSpend = Math.round(fixedProjected + flexProjected);
  }

  let daily: MonthSummary['daily'] = null;
  if (isCurrent && daysLeft > 0) {
    const spentToday = alive(data.transactions)
      .filter((t) => t.type === 'expense' && t.date === today)
      .filter((t) => {
        const root = rootIdOf(catMap, t.categoryId);
        return !(root && catMap.get(root)?.behavior === 'fixed');
      })
      .reduce((s, t) => s + t.amount, 0);
    const pool = flexBudget - flexSpentAll - fixedOver;
    const limit = floorRupee((pool + spentToday) / daysLeft);
    daily = { limit, spentToday, safeLeft: Math.max(0, limit - spentToday), pool };
  }

  let status: Status = 'onTrack';
  const anyOver = expenseRows.some((r) => r.status === 'over') || (spendBudget > 0 && spent > spendBudget);
  const anyWatch = expenseRows.some((r) => r.status === 'watch') || (isCurrent && spendBudget > 0 && projectedSpend > spendBudget);
  if (anyOver) status = 'over';
  else if (anyWatch) status = 'watch';

  return {
    period, elapsed, daysLeft, isCurrent, received, saved, spent, cardSpend, cardBillPaid, needSpent, wantSpent, untaggedSpent,
    uncategorisedSpent, spendBudget, savingsPlanned, budgetRemaining: spendBudget - spent,
    unallocated: settings.salary - spendBudget - savingsPlanned, unusedBudget,
    expenseRows, savingsRows, groupRows, projectedSpend, status, daily,
  };
}

export const savingsRate = (s: Pick<MonthSummary, 'saved' | 'received'>): number | null => (s.received > 0 ? (s.saved / s.received) * 100 : null);

/** Spend per top-level category up to (and including) the n-th day of a period; used for "same point last month". */
export function spentByCategoryUpTo(data: Dataset, monthKey: string, nDays: number): Map<ID, number> {
  const period = periodOf(monthKey, data.settings.monthStartDay);
  const cutoff = addDays(period.start, Math.max(0, nDays) - 1);
  const catMap = new Map(alive(data.categories).map((c) => [c.id, c]));
  const out = new Map<ID, number>();
  for (const t of alive(data.transactions)) {
    if (t.type !== 'expense' || t.date < period.start || t.date > cutoff || t.date > period.end) continue;
    const root = rootIdOf(catMap, t.categoryId);
    if (root) out.set(root, (out.get(root) ?? 0) + t.amount);
  }
  return out;
}

/* ---------- weekly tracker ---------- */
export interface DayBar { date: string; spent: Paise; isToday: boolean }
export function weekBars(txns: Transaction[], period: Period, today: string): DayBar[] {
  const anchor = today >= period.start && today <= period.end ? today : period.end;
  const dow = (parseDate(anchor).getDay() + 6) % 7; // Monday = 0
  const monday = addDays(anchor, -dow);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const spent = txns.filter((t) => !t.deletedAt && t.type === 'expense' && t.date === date).reduce((s, t) => s + t.amount, 0);
    return { date, spent, isToday: date === today };
  });
}

/* ---------- goals ---------- */
export function goalSaved(goal: Goal, txns: Transaction[]): Paise {
  let s = goal.initialSaved;
  for (const t of txns) if (!t.deletedAt && t.type === 'transfer' && t.transferKind === 'savings' && t.goalId === goal.id) s += t.amount;
  return s;
}

export interface GoalProgress {
  saved: Paise;
  target: Paise;
  remaining: Paise;
  pct: number;
  monthsLeft: number | null; // months left including the current one; null when no target date
  requiredMonthly: Paise | null;
  gapMonthly: Paise; // extra needed per month beyond the planned contribution (>=0)
  status: GoalStatus;
  projectedMonth: string | null; // when the goal completes at the planned contribution
}

export function goalProgress(goal: Goal, saved: Paise, nowKey: string): GoalProgress {
  const remaining = Math.max(0, goal.target - saved);
  const p = Math.min(100, pct(saved, goal.target));
  const monthsLeft = goal.targetDate ? Math.max(0, monthDiff(nowKey, goal.targetDate) + 1) : null;
  // whole rupees, rounded up, so the amount shown is always enough
  const requiredMonthly = monthsLeft === null ? null : monthsLeft > 0 ? Math.ceil(remaining / monthsLeft / 100) * 100 : remaining;
  const c = goal.monthlyContribution;
  let status: GoalStatus;
  if (goal.target > 0 && saved >= goal.target) status = 'complete';
  else if (monthsLeft === 0) status = 'overdue';
  else if (requiredMonthly === null) status = c > 0 ? 'onTrack' : 'behind';
  else if (c >= requiredMonthly) status = 'onTrack';
  else if (c >= requiredMonthly * 0.75) status = 'behind';
  else status = 'offTrack';
  const projectedMonth = remaining === 0 ? nowKey : c > 0 ? addMonths(nowKey, Math.ceil(remaining / c) - 1) : null;
  const gapMonthly = requiredMonthly === null ? 0 : Math.max(0, requiredMonthly - c);
  return { saved, target: goal.target, remaining, pct: p, monthsLeft, requiredMonthly, gapMonthly, status, projectedMonth };
}

export function allGoalProgress(data: Dataset, nowKey: string): { goal: Goal; progress: GoalProgress }[] {
  const order = { high: 0, medium: 1, low: 2 } as const;
  return alive(data.goals)
    .map((goal) => ({ goal, progress: goalProgress(goal, goalSaved(goal, data.transactions), nowKey) }))
    .sort((a, b) => order[a.goal.priority] - order[b.goal.priority] || a.goal.name.localeCompare(b.goal.name));
}

/* ---------- comparisons ---------- */
export interface Comparison {
  received: { cur: Paise; prev: Paise };
  saved: { cur: Paise; prev: Paise };
  spent: { cur: Paise; prev: Paise };
  rate: { cur: number | null; prev: number | null };
  categories: { id: ID; name: string; cur: Paise; prev: Paise; delta: Paise }[];
}
export function compare(cur: MonthSummary, prev: MonthSummary): Comparison {
  const ids = new Map<ID, { name: string; cur: number; prev: number }>();
  for (const r of cur.expenseRows) ids.set(r.category.id, { name: r.category.name, cur: r.spent, prev: 0 });
  for (const r of prev.expenseRows) {
    const e = ids.get(r.category.id);
    if (e) e.prev = r.spent;
    else ids.set(r.category.id, { name: r.category.name, cur: 0, prev: r.spent });
  }
  const categories = [...ids.entries()]
    .map(([id, v]) => ({ id, name: v.name, cur: v.cur, prev: v.prev, delta: v.cur - v.prev }))
    .filter((c) => c.cur || c.prev)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return {
    received: { cur: cur.received, prev: prev.received },
    saved: { cur: cur.saved, prev: prev.saved },
    spent: { cur: cur.spent, prev: prev.spent },
    rate: { cur: savingsRate(cur), prev: savingsRate(prev) },
    categories,
  };
}

/* ---------- health score ---------- */
export interface HealthPart { key: string; label: string; score: number; max: number; tip: string | null }
export interface Health { score: number; label: string; parts: HealthPart[] }

export function healthScore(
  s: MonthSummary,
  goals: { goal: Goal; progress: GoalProgress }[],
  settings: Pick<Settings, 'targetSavingsRate'>,
): Health {
  const parts: HealthPart[] = [];
  const clamp = (n: number) => Math.min(1, Math.max(0, n));

  const rate = savingsRate(s);
  const target = Math.max(1, settings.targetSavingsRate);
  const f1 = rate === null ? 0 : clamp(rate / target);
  parts.push({ key: 'savings', label: 'Savings rate', max: 30, score: f1 * 30,
    tip: f1 < 1 ? `Aim to save ${target}% of what you receive${rate !== null ? ` (now ${Math.round(rate)}%)` : ''}. Move money to savings as soon as salary arrives.` : null });

  const budgeted = s.expenseRows.filter((r) => r.budget > 0);
  const within = budgeted.filter((r) => r.spent <= r.budget).length;
  const f2 = budgeted.length ? within / budgeted.length : 0.5;
  parts.push({ key: 'budget', label: 'Staying in budget', max: 25, score: f2 * 25,
    tip: f2 < 1 ? `${budgeted.length - within} categor${budgeted.length - within === 1 ? 'y is' : 'ies are'} over limit. Trim the biggest one first.` : null });

  const gScore = goals.length
    ? goals.reduce((a, g) => a + (g.progress.status === 'onTrack' || g.progress.status === 'complete' ? 1 : g.progress.status === 'behind' ? 0.5 : 0), 0) / goals.length
    : 0.5;
  parts.push({ key: 'goals', label: 'Goals on track', max: 20, score: gScore * 20,
    tip: gScore < 1 ? 'Some goals need a higher monthly saving or a later date. Check the Goals tab.' : null });

  const tagged = s.needSpent + s.wantSpent;
  const wantShare = tagged > 0 ? s.wantSpent / tagged : 0.3;
  const f4 = clamp((0.6 - wantShare) / 0.3); // <=30% wants = full, >=60% = zero
  parts.push({ key: 'needwant', label: 'Needs vs wants', max: 15, score: f4 * 15,
    tip: f4 < 1 ? `Wants are ${Math.round(wantShare * 100)}% of tagged spending. Try keeping them under 30%.` : null });

  const em = goals.find((g) => g.goal.isEmergency);
  const f5 = em ? clamp(em.progress.pct / 100) : 0.5;
  parts.push({ key: 'emergency', label: 'Emergency fund', max: 10, score: f5 * 10,
    tip: f5 < 1 ? (em ? `Emergency fund is ${Math.round(em.progress.pct)}% funded. Build it before other goals.` : 'Add an Emergency goal (3–6 months of expenses).') : null });

  const score = Math.round(parts.reduce((a, p) => a + p.score, 0));
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Needs work' : 'At risk';
  return { score, label, parts: parts.map((p) => ({ ...p, score: Math.round(p.score * 10) / 10 })) };
}

/* ---------- helpers used by UI ---------- */
export const currentKey = (settings: Settings, today: string) => periodKeyForDate(today, settings.monthStartDay);
