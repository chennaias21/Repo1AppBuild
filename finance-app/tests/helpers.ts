import type { Category, Dataset, Goal, Transaction } from '../src/core/types';
import { buildSeed } from '../src/core/seed';
import { base } from '../src/core/factory';

export const R = (rupees: number) => Math.round(rupees * 100);

/** Seeded dataset for 86,000 salary, "today" = 2026-11-10 (calendar month Nov 2026). */
export function seeded(today = '2026-11-10') {
  return buildSeed({ salary: R(86000), useDefaultCategories: true, emergencyGoal: true, marriageGoal: true, today, now: 1, deviceId: 'dev' });
}
export const cat = (d: Dataset, name: string): Category => {
  const c = d.categories.find((x) => x.name === name);
  if (!c) throw new Error('no category ' + name);
  return c;
};
export const goal = (d: Dataset, name: string): Goal => d.goals.find((g) => g.name === name)!;
export function addTxn(d: Dataset, t: Partial<Transaction> & Pick<Transaction, 'type' | 'amount' | 'date'>): Transaction {
  const tx: Transaction = { ...base(1, 'dev'), categoryId: null, paymentMethodId: null, need: null, note: '', transferKind: null, goalId: null, ...t };
  d.transactions.push(tx);
  return tx;
}
export const pm = (d: Dataset, name: string) => d.paymentMethods.find((p) => p.name === name)!;
