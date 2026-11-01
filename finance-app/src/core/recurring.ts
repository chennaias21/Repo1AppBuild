import type { Dataset, Recurring } from './types';
import { addMonths, pad, periodOf } from './dates';

/** Actual calendar date for "day N of the budget month" (clamped to the period). */
export function dayOfPeriod(periodKey: string, startDay: number, dayOfMonth: number): string {
  const p = periodOf(periodKey, startDay);
  const [y, m] = periodKey.split('-').map(Number);
  const sd = Math.min(Math.max(1, startDay), 28);
  // Days on/after the start day fall in the first calendar month of the period, earlier days in the next one.
  const key = dayOfMonth >= sd ? periodKey : addMonths(periodKey, 1);
  const [ky, km] = key.split('-').map(Number);
  const last = new Date(ky, km, 0).getDate();
  let date = `${ky}-${pad(km)}-${pad(Math.min(dayOfMonth, last))}`;
  void y; void m;
  if (date < p.start) date = p.start;
  if (date > p.end) date = p.end;
  return date;
}

/** Recurring items due (date reached) and not yet added/skipped in this budget month. */
export function dueRecurring(data: Dataset, periodKey: string, today: string): { item: Recurring; date: string }[] {
  const startDay = data.settings.monthStartDay;
  return data.recurring
    .filter((r) => r.active && !r.deletedAt && r.lastHandledPeriod !== periodKey)
    .map((item) => ({ item, date: dayOfPeriod(periodKey, startDay, item.dayOfMonth) }))
    .filter((x) => x.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}
