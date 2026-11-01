/** CSV / Excel import-export mapping. Pure functions; file IO lives in the UI layer. */
import type { Category, Dataset, ID, Need, Transaction, TxnType } from './types';
import { alive } from './calc';
import { base } from './factory';
import { pad } from './dates';

export const EXPORT_HEADERS = ['Date', 'Type', 'Amount', 'Category', 'Subcategory', 'Payment Method', 'Need/Want', 'Note', 'Transfer Kind', 'Goal'] as const;
export type ExportRow = Record<(typeof EXPORT_HEADERS)[number], string | number>;

export function toExportRows(data: Dataset): ExportRow[] {
  const cats = new Map(alive(data.categories).map((c) => [c.id, c]));
  const pms = new Map(alive(data.paymentMethods).map((p) => [p.id, p.name]));
  const goals = new Map(alive(data.goals).map((g) => [g.id, g.name]));
  return alive(data.transactions)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
    .map((t) => {
      const c = t.categoryId ? cats.get(t.categoryId) : undefined;
      const parent = c?.parentId ? cats.get(c.parentId) : undefined;
      return {
        Date: t.date,
        Type: t.type,
        Amount: t.amount / 100,
        Category: parent ? parent.name : c?.name ?? '',
        Subcategory: parent ? c!.name : '',
        'Payment Method': t.paymentMethodId ? pms.get(t.paymentMethodId) ?? '' : '',
        'Need/Want': t.need ?? '',
        Note: t.note ?? '',
        'Transfer Kind': t.transferKind ?? '',
        Goal: t.goalId ? goals.get(t.goalId) ?? '' : '',
      };
    });
}

/** Accepts YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY and Excel serial numbers. */
export function parseDateLoose(v: unknown): string | null {
  if (v instanceof Date && !isNaN(v.getTime())) return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  if (typeof v === 'number' && v > 20000 && v < 80000) {
    const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }
  const s = String(v ?? '').trim();
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(s);
  if (m) return valid(+m[1], +m[2], +m[3]);
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(s);
  if (m) return valid(+m[3], +m[2], +m[1]);
  return null;
}
function valid(y: number, mo: number, d: number): string | null {
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d ? `${y}-${pad(mo)}-${pad(d)}` : null;
}

const norm = (s: unknown) => String(s ?? '').trim().toLowerCase();
function pick(row: Record<string, unknown>, ...names: string[]): unknown {
  for (const k of Object.keys(row)) if (names.includes(norm(k))) return row[k];
  return undefined;
}

export interface ImportPlan {
  transactions: Transaction[];
  newCategories: Category[];
  errors: { row: number; message: string }[];
  duplicates: number;
}

const sig = (t: { date: string; amount: number; type: string; categoryId?: ID | null; note?: string }) => `${t.date}|${t.amount}|${t.type}|${t.categoryId ?? ''}|${(t.note ?? '').trim().toLowerCase()}`;

/** Maps spreadsheet rows to transactions, creating missing categories. Skips exact duplicates already in the app. */
export function planImport(rows: Record<string, unknown>[], data: Dataset, now = Date.now()): ImportPlan {
  const cats = alive(data.categories);
  const byName = (name: string, kind?: string, parentId?: ID | null) =>
    cats.find((c) => norm(c.name) === norm(name) && (!kind || c.kind === kind) && (parentId === undefined || (c.parentId ?? null) === (parentId ?? null)));
  const pms = alive(data.paymentMethods);
  const goals = alive(data.goals);
  const otherGroup = alive(data.groups).find((g) => /other/i.test(g.name)) ?? alive(data.groups)[0];
  const newCategories: Category[] = [];
  const created = new Map<string, Category>();
  const existing = new Set(alive(data.transactions).map(sig));
  const out: Transaction[] = [];
  const errors: ImportPlan['errors'] = [];
  let duplicates = 0;
  let sort = cats.length + 1000;

  const ensureCat = (name: string, kind: 'expense' | 'income', parent?: Category | null): Category => {
    const key = `${kind}|${parent?.id ?? ''}|${norm(name)}`;
    const found = byName(name, kind, parent ? parent.id : null) ?? created.get(key);
    if (found) return found;
    const c: Category = { ...base(now, data.settings.deviceId), name: name.trim(), kind, groupId: kind === 'expense' ? parent?.groupId ?? otherGroup?.id ?? null : null, parentId: parent?.id ?? null, icon: '📦', behavior: 'flexible', defaultNeed: null, goalId: null, sort: sort++ };
    created.set(key, c);
    newCategories.push(c);
    return c;
  };

  rows.forEach((row, i) => {
    const line = i + 2; // header is line 1
    if (Object.values(row).every((v) => v === '' || v == null)) return;
    const date = parseDateLoose(pick(row, 'date', 'txn date', 'transaction date'));
    if (!date) return void errors.push({ row: line, message: 'Date is missing or not understood (use YYYY-MM-DD or DD/MM/YYYY).' });
    const amtRaw = pick(row, 'amount', 'amt', 'value');
    const amtNum = typeof amtRaw === 'number' ? amtRaw : parseFloat(String(amtRaw ?? '').replace(/[₹,\s]/g, ''));
    if (!Number.isFinite(amtNum) || amtNum <= 0) return void errors.push({ row: line, message: 'Amount must be a positive number.' });
    const typeRaw = norm(pick(row, 'type', 'txn type'));
    const type: TxnType = typeRaw.startsWith('inc') || typeRaw === 'credit' ? 'income' : typeRaw.startsWith('tran') || typeRaw === 'savings' ? 'transfer' : 'expense';
    const catName = String(pick(row, 'category') ?? '').trim();
    const subName = String(pick(row, 'subcategory', 'sub category') ?? '').trim();
    const kObj = norm(pick(row, 'transfer kind'));
    const transferKind = type === 'transfer' ? (kObj.includes('card') ? 'cardBill' : 'savings') : null;

    let categoryId: ID | null = null;
    if (type === 'transfer' && transferKind === 'savings') {
      const c = catName ? cats.find((x) => norm(x.name) === norm(catName) && x.kind === 'savings') : undefined;
      categoryId = c?.id ?? null;
    } else if (type !== 'transfer' && catName) {
      const parent = ensureCat(catName, type);
      categoryId = subName ? ensureCat(subName, type, parent).id : parent.id;
    }
    const pmName = String(pick(row, 'payment method', 'payment', 'method', 'mode') ?? '').trim();
    const pm = pmName ? pms.find((p) => norm(p.name) === norm(pmName)) : undefined;
    const needRaw = norm(pick(row, 'need/want', 'need', 'need or want'));
    const need: Need | null = needRaw === 'need' ? 'need' : needRaw === 'want' ? 'want' : null;
    const goalName = String(pick(row, 'goal') ?? '').trim();
    const goal = goalName ? goals.find((g) => norm(g.name) === norm(goalName)) : undefined;
    const t: Transaction = {
      ...base(now, data.settings.deviceId), type, amount: Math.round(amtNum * 100), date, categoryId, paymentMethodId: pm?.id ?? null,
      need: type === 'expense' ? need : null, note: String(pick(row, 'note', 'notes', 'description', 'narration') ?? '').trim(), transferKind, goalId: goal?.id ?? null,
    };
    const s = sig(t);
    if (existing.has(s)) return void duplicates++;
    existing.add(s);
    out.push(t);
  });
  return { transactions: out, newCategories, errors, duplicates };
}
