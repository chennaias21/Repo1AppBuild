import { z } from 'zod';
import type { Dataset } from './types';
import { SCHEMA_VERSION } from './types';

export const APP_ID = 'rupee-routine';

const base = { id: z.string().min(1), createdAt: z.number(), updatedAt: z.number(), deletedAt: z.number().nullable().optional(), deviceId: z.string().optional() };
const paise = z.number().int().finite();
const need = z.enum(['need', 'want']).nullable().optional();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const month = z.string().regex(/^\d{4}-\d{2}$/);

const groupS = z.object({ ...base, name: z.string(), icon: z.string(), sort: z.number() }).passthrough();
const categoryS = z.object({
  ...base, name: z.string(), kind: z.enum(['expense', 'income', 'savings']), groupId: z.string().nullable().optional(), parentId: z.string().nullable().optional(),
  icon: z.string(), behavior: z.enum(['fixed', 'flexible']), defaultNeed: need, goalId: z.string().nullable().optional(), sort: z.number(),
}).passthrough();
const budgetS = z.object({ ...base, categoryId: z.string(), effectiveFrom: month, amount: paise.nonnegative() }).passthrough();
const txnS = z.object({
  ...base, type: z.enum(['expense', 'income', 'transfer']), amount: paise.nonnegative(), date, categoryId: z.string().nullable().optional(),
  paymentMethodId: z.string().nullable().optional(), need, note: z.string().optional(), transferKind: z.enum(['savings', 'cardBill']).nullable().optional(), goalId: z.string().nullable().optional(),
}).passthrough();
const goalS = z.object({
  ...base, name: z.string(), icon: z.string(), target: paise.nonnegative(), initialSaved: paise.nonnegative(), targetDate: month.nullable().optional(),
  monthlyContribution: paise.nonnegative(), priority: z.enum(['high', 'medium', 'low']), description: z.string().optional(), isEmergency: z.boolean().optional(),
}).passthrough();
const pmS = z.object({ ...base, name: z.string(), type: z.enum(['cash', 'upi', 'debit', 'credit', 'other']), sort: z.number() }).passthrough();
const recS = z.object({
  ...base, type: z.enum(['expense', 'income', 'transfer']), transferKind: z.enum(['savings', 'cardBill']).nullable().optional(), amount: paise.nonnegative(),
  categoryId: z.string().nullable().optional(), paymentMethodId: z.string().nullable().optional(), need, note: z.string().optional(),
  dayOfMonth: z.number().int().min(1).max(31), active: z.boolean(), lastHandledPeriod: z.string().nullable().optional(),
}).passthrough();
const settingsS = z.object({
  id: z.literal('main'), schemaVersion: z.number(), deviceId: z.string(), userName: z.string(), salary: paise.nonnegative(), currency: z.literal('INR'),
  monthStartDay: z.number().int().min(1).max(28), theme: z.enum(['system', 'light', 'dark']), watchPct: z.number(), targetSavingsRate: z.number(), onboarded: z.boolean(),
  lastBackupAt: z.number().nullable().optional(), updatedAt: z.number(),
}).passthrough();

export const backupSchema = z.object({
  app: z.literal(APP_ID),
  schemaVersion: z.number().int().min(1),
  exportedAt: z.number(),
  data: z.object({
    settings: settingsS, groups: z.array(groupS), categories: z.array(categoryS), budgets: z.array(budgetS), transactions: z.array(txnS),
    goals: z.array(goalS), paymentMethods: z.array(pmS), recurring: z.array(recS),
  }),
});

export interface BackupFile { app: typeof APP_ID; schemaVersion: number; exportedAt: number; data: Dataset }

export function buildBackup(data: Dataset, now = Date.now()): BackupFile {
  return { app: APP_ID, schemaVersion: SCHEMA_VERSION, exportedAt: now, data };
}

export interface Counts { transactions: number; categories: number; groups: number; goals: number; budgets: number; paymentMethods: number; recurring: number }
export const countsOf = (d: Dataset): Counts => ({
  transactions: d.transactions.filter((x) => !x.deletedAt).length, categories: d.categories.filter((x) => !x.deletedAt).length,
  groups: d.groups.filter((x) => !x.deletedAt).length, goals: d.goals.filter((x) => !x.deletedAt).length, budgets: d.budgets.filter((x) => !x.deletedAt).length,
  paymentMethods: d.paymentMethods.filter((x) => !x.deletedAt).length, recurring: d.recurring.filter((x) => !x.deletedAt).length,
});

export type ValidateResult = { ok: true; backup: BackupFile } | { ok: false; errors: string[] };

/** Validates raw text from a backup file. Never throws. Nothing is written to the database here. */
export function validateBackupText(text: string): ValidateResult {
  let json: unknown;
  try { json = JSON.parse(text); } catch { return { ok: false, errors: ['This file is not a valid backup (it is not readable JSON).'] }; }
  if (!json || typeof json !== 'object' || (json as { app?: unknown }).app !== APP_ID) {
    return { ok: false, errors: ['This file was not created by Rupee Routine.'] };
  }
  const v = (json as { schemaVersion?: unknown }).schemaVersion;
  if (typeof v === 'number' && v > SCHEMA_VERSION) {
    return { ok: false, errors: [`This backup is from a newer version of the app (v${v}). Please update the app first.`] };
  }
  const parsed = backupSchema.safeParse(json);
  if (!parsed.success) {
    const errs = parsed.error.issues.slice(0, 5).map((i) => `${i.path.join('.') || 'file'}: ${i.message}`);
    return { ok: false, errors: ['The backup file is damaged or incomplete.', ...errs] };
  }
  // Referential sanity: every txn/budget category must exist (or be empty).
  const d = parsed.data.data;
  const ids = new Set(d.categories.map((c) => c.id));
  const bad = d.transactions.filter((t) => t.categoryId && !ids.has(t.categoryId)).length + d.budgets.filter((b) => !ids.has(b.categoryId)).length;
  if (bad > 0) return { ok: false, errors: [`The backup refers to ${bad} categories that are missing from the file.`] };
  return { ok: true, backup: parsed.data as unknown as BackupFile };
}
