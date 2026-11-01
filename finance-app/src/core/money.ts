import type { Paise } from './types';

/** Indian digit grouping: 1234567 -> 12,34,567 */
export function groupIndian(intStr: string): string {
  if (intStr.length <= 3) return intStr;
  const last3 = intStr.slice(-3);
  const rest = intStr.slice(0, -3);
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
}

/** Format paise as ₹1,50,000 (decimals only when needed). */
export function formatINR(paise: Paise, opts: { decimals?: boolean; sign?: boolean } = {}): string {
  const neg = paise < 0;
  const abs = Math.abs(Math.round(paise));
  const rupees = Math.floor(abs / 100);
  const p = abs % 100;
  let s = groupIndian(String(rupees));
  if (p !== 0 || opts.decimals) s += '.' + String(p).padStart(2, '0');
  const sign = neg ? '-' : opts.sign && paise > 0 ? '+' : '';
  return `${sign}₹${s}`;
}

/** Compact: ₹1.5L, ₹20L, ₹2.4Cr, ₹45K */
export function formatCompact(paise: Paise): string {
  const r = Math.abs(paise) / 100;
  const sign = paise < 0 ? '-' : '';
  const trim = (n: number) => String(Math.round(n * 10) / 10);
  if (r >= 1e7) return `${sign}₹${trim(r / 1e7)}Cr`;
  if (r >= 1e5) return `${sign}₹${trim(r / 1e5)}L`;
  if (r >= 1e4) return `${sign}₹${trim(r / 1e3)}K`;
  return `${sign}₹${groupIndian(String(Math.round(r)))}`;
}

/** Parse user input like "1,250.50" or "₹ 450" into paise. Returns null if invalid. */
export function parseINR(input: string): Paise | null {
  const cleaned = input.replace(/[₹,\s]/g, '');
  if (cleaned === '' || !/^\d*\.?\d{0,2}$/.test(cleaned) || cleaned === '.') return null;
  const n = Math.round(parseFloat(cleaned) * 100);
  return Number.isFinite(n) ? n : null;
}

/** Paise to a plain editable string ("1250" or "1250.5"). */
export function paiseToInput(paise: Paise): string {
  if (!paise) return '';
  const r = paise / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/0+$/, '');
}

export const pct = (part: number, whole: number): number => (whole > 0 ? (part / whole) * 100 : 0);
