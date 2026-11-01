import { describe, expect, it } from 'vitest';
import { addTxn, cat, goal, pm, R, seeded } from './helpers';
import { APP_ID, buildBackup, countsOf, validateBackupText } from '../src/core/backup';
import { parseDateLoose, planImport, toExportRows } from '../src/core/csv';
import { dayOfPeriod, dueRecurring } from '../src/core/recurring';
import { base } from '../src/core/factory';
import type { Recurring } from '../src/core/types';

const withData = () => {
  const d = seeded();
  addTxn(d, { type: 'income', amount: R(86000), date: '2026-11-01', categoryId: cat(d, 'Salary').id, note: 'Nov salary' });
  addTxn(d, { type: 'expense', amount: R(450.5), date: '2026-11-03', categoryId: cat(d, 'Groceries').id, paymentMethodId: pm(d, 'UPI').id, need: 'need', note: 'veg, "fresh"' });
  addTxn(d, { type: 'transfer', transferKind: 'savings', amount: R(5000), date: '2026-11-04', categoryId: cat(d, 'Marriage Fund').id, goalId: goal(d, 'Marriage Fund').id });
  return d;
};

describe('backup validation', () => {
  it('round-trips a real dataset', () => {
    const d = withData();
    const r = validateBackupText(JSON.stringify(buildBackup(d)));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(countsOf(r.backup.data)).toEqual(countsOf(d));
      expect(r.backup.data.transactions[1].amount).toBe(45050);
    }
  });
  it('rejects non-JSON, foreign files, wrong shapes and newer versions without throwing', () => {
    expect(validateBackupText('not json')).toMatchObject({ ok: false });
    expect(validateBackupText('{"hello":1}')).toMatchObject({ ok: false, errors: ['This file was not created by Rupee Routine.'] });
    expect(validateBackupText('[]')).toMatchObject({ ok: false });
    expect(validateBackupText('null')).toMatchObject({ ok: false });
    const newer = { ...buildBackup(seeded()), schemaVersion: 99 };
    expect(validateBackupText(JSON.stringify(newer))).toMatchObject({ ok: false });
    const broken = JSON.parse(JSON.stringify(buildBackup(seeded())));
    delete broken.data.goals;
    const r = validateBackupText(JSON.stringify(broken));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.errors[0]).toMatch(/damaged or incomplete/);
  });
  it('rejects tampered values: fractional/negative paise, bad dates, dangling categories', () => {
    const mk = (mut: (b: ReturnType<typeof buildBackup>) => void) => { const b = JSON.parse(JSON.stringify(buildBackup(withData()))); mut(b); return validateBackupText(JSON.stringify(b)); };
    expect(mk((b) => { b.data.transactions[0].amount = 10.5; }).ok).toBe(false);
    expect(mk((b) => { b.data.transactions[0].amount = -5; }).ok).toBe(false);
    expect(mk((b) => { b.data.transactions[0].date = '03/11/2026'; }).ok).toBe(false);
    expect(mk((b) => { b.data.transactions[0].categoryId = 'ghost'; }).ok).toBe(false);
    expect(mk((b) => { b.data.settings.monthStartDay = 40; }).ok).toBe(false);
    expect(mk((b) => { (b as { app: string }).app = 'other'; }).ok).toBe(false);
  });
  it('app id is stable', () => { expect(buildBackup(seeded()).app).toBe(APP_ID); });
});

describe('CSV / Excel mapping', () => {
  it('exports readable rows with rupees (not paise)', () => {
    const rows = toExportRows(withData());
    expect(rows).toHaveLength(3);
    expect(rows[1]).toMatchObject({ Date: '2026-11-03', Type: 'expense', Amount: 450.5, Category: 'Groceries', 'Payment Method': 'UPI', 'Need/Want': 'need' });
    expect(rows[2]).toMatchObject({ Type: 'transfer', 'Transfer Kind': 'savings', Goal: 'Marriage Fund' });
  });
  it('parses common date formats', () => {
    expect(parseDateLoose('2026-11-03')).toBe('2026-11-03');
    expect(parseDateLoose('03/11/2026')).toBe('2026-11-03');
    expect(parseDateLoose('3-11-2026')).toBe('2026-11-03');
    expect(parseDateLoose('03.11.2026')).toBe('2026-11-03');
    expect(parseDateLoose(46329)).toBe('2026-11-03'); // Excel serial
    expect(parseDateLoose('31/02/2026')).toBeNull();
    expect(parseDateLoose('garbage')).toBeNull();
  });
  it('imports rows, creates categories, skips duplicates and reports bad rows', () => {
    const d = withData();
    const plan = planImport([
      { Date: '2026-11-03', Type: 'expense', Amount: 450.5, Category: 'Groceries', Note: 'veg, "fresh"' }, // duplicate of existing
      { Date: '05/11/2026', Type: 'expense', Amount: '₹1,200', Category: 'Pets', Subcategory: 'Vet', 'Payment Method': 'upi', 'Need/Want': 'need', Note: 'checkup' },
      { Date: '06/11/2026', Type: 'expense', Amount: 300, Category: 'pets' }, // same new category, case-insensitive
      { Date: '2026-11-07', Type: 'income', Amount: 5000, Category: 'Bonus' },
      { Date: 'nope', Type: 'expense', Amount: 10, Category: 'Fuel' },
      { Date: '2026-11-08', Type: 'expense', Amount: -4, Category: 'Fuel' },
      { Date: '', Type: '', Amount: '', Category: '' }, // blank line ignored
    ], d);
    expect(plan.transactions).toHaveLength(3);
    expect(plan.duplicates).toBe(1);
    expect(plan.errors.map((e) => e.row)).toEqual([6, 7]);
    expect(plan.newCategories.map((c) => c.name).sort()).toEqual(['Pets', 'Vet']);
    const vet = plan.newCategories.find((c) => c.name === 'Vet')!;
    const pets = plan.newCategories.find((c) => c.name === 'Pets')!;
    expect(vet.parentId).toBe(pets.id);
    expect(plan.transactions[0]).toMatchObject({ amount: 120000, categoryId: vet.id, need: 'need', date: '2026-11-05' });
    expect(plan.transactions[0].paymentMethodId).toBe(pm(d, 'UPI').id);
    expect(plan.transactions[1].categoryId).toBe(pets.id);
    expect(plan.transactions[2].type).toBe('income');
  });
  it('import is idempotent: importing the export again adds nothing', () => {
    const d = withData();
    const rows = toExportRows(d) as unknown as Record<string, unknown>[];
    const plan = planImport(rows, d);
    expect(plan.transactions).toHaveLength(0);
    expect(plan.duplicates).toBe(3);
  });
});

describe('recurring entries', () => {
  const rec = (day: number, patch: Partial<Recurring> = {}): Recurring => ({ ...base(1, 'dev'), type: 'expense', amount: R(15000), categoryId: null, dayOfMonth: day, active: true, lastHandledPeriod: null, ...patch });
  it('is due on/after its day and not before', () => {
    const d = seeded();
    d.recurring.push(rec(5));
    expect(dueRecurring(d, '2026-11', '2026-11-04')).toHaveLength(0);
    expect(dueRecurring(d, '2026-11', '2026-11-05')).toHaveLength(1);
    expect(dueRecurring(d, '2026-11', '2026-11-20')[0].date).toBe('2026-11-05');
  });
  it('disappears once handled for that month and returns next month; paused items never show', () => {
    const d = seeded();
    d.recurring.push(rec(1, { lastHandledPeriod: '2026-11' }), rec(1, { active: false }));
    expect(dueRecurring(d, '2026-11', '2026-11-10')).toHaveLength(0);
    expect(dueRecurring(d, '2026-12', '2026-12-02')).toHaveLength(1);
  });
  it('respects a custom budget-month start day', () => {
    expect(dayOfPeriod('2026-11', 25, 28)).toBe('2026-11-28');
    expect(dayOfPeriod('2026-11', 25, 3)).toBe('2026-12-03');
    expect(dayOfPeriod('2026-02', 1, 28)).toBe('2026-02-28');
  });
});
