/** All dates are local calendar dates as 'YYYY-MM-DD'; months as 'YYYY-MM'. */
export const pad = (n: number) => String(n).padStart(2, '0');

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export const todayStr = () => toDateStr(new Date());

export function addDays(s: string, n: number): string {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}
export function diffDays(a: string, b: string): number {
  // b - a in whole days (DST safe)
  const da = parseDate(a);
  const db = parseDate(b);
  return Math.round((Date.UTC(db.getFullYear(), db.getMonth(), db.getDate()) - Date.UTC(da.getFullYear(), da.getMonth(), da.getDate())) / 86400000);
}

export function monthKeyOf(dateStr: string): string {
  return dateStr.slice(0, 7);
}
export function addMonths(key: string, n: number): string {
  const [y, m] = key.split('-').map(Number);
  const idx = y * 12 + (m - 1) + n;
  return `${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}`;
}
export function monthDiff(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
}
const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();

export interface Period {
  key: string; // budget month key, 'YYYY-MM' of the month the period STARTS in
  start: string;
  end: string; // inclusive
  days: number;
}

/**
 * Budget month for `key`. With startDay=1 it is the calendar month.
 * With startDay=d (2..28) it runs d of that month to d-1 of the next.
 */
export function periodOf(key: string, startDay = 1): Period {
  const [y, m] = key.split('-').map(Number);
  const sd = Math.min(Math.max(1, Math.floor(startDay)), 28);
  const start = `${y}-${pad(m)}-${pad(sd)}`;
  let end: string;
  if (sd === 1) end = `${y}-${pad(m)}-${pad(daysInMonth(y, m))}`;
  else end = addDays(`${addMonths(key, 1)}-${pad(sd)}`, -1);
  return { key, start, end, days: diffDays(start, end) + 1 };
}

/** Which budget-month key does a date belong to? */
export function periodKeyForDate(dateStr: string, startDay = 1): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const key = `${y}-${pad(m)}`;
  return d >= Math.min(Math.max(1, startDay), 28) ? key : addMonths(key, -1);
}

export function inPeriod(dateStr: string, p: Period): boolean {
  return dateStr >= p.start && dateStr <= p.end;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function monthLabel(key: string, long = true): string {
  const [y, m] = key.split('-').map(Number);
  return `${(long ? MONTHS_LONG : MONTHS)[m - 1]} ${y}`;
}
export function dayLabel(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
export function dayHeading(dateStr: string, today: string): string {
  if (dateStr === today) return 'Today';
  if (dateStr === addDays(today, -1)) return 'Yesterday';
  const d = parseDate(dateStr);
  return `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
