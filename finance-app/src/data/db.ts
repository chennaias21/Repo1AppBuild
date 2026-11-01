import Dexie, { type Table } from 'dexie';
import type { Budget, Category, Goal, Group, PaymentMethod, Recurring, Settings, Transaction } from '../core/types';

/**
 * Local-only IndexedDB. Each device/browser has its own database; nothing is
 * ever sent anywhere. Add new tables/indexes by adding a new `version(n)`.
 */
export class AppDB extends Dexie {
  settings!: Table<Settings, string>;
  groups!: Table<Group, string>;
  categories!: Table<Category, string>;
  budgets!: Table<Budget, string>;
  transactions!: Table<Transaction, string>;
  goals!: Table<Goal, string>;
  paymentMethods!: Table<PaymentMethod, string>;
  recurring!: Table<Recurring, string>;

  constructor(name = 'rupee-routine') {
    super(name);
    this.version(1).stores({
      settings: 'id',
      groups: 'id, sort',
      categories: 'id, kind, groupId, parentId',
      budgets: 'id, categoryId, effectiveFrom',
      transactions: 'id, date, type, categoryId',
      goals: 'id',
      paymentMethods: 'id',
      recurring: 'id',
    });
  }
}

export const db = new AppDB();
export const TABLES = ['groups', 'categories', 'budgets', 'transactions', 'goals', 'paymentMethods', 'recurring'] as const;
export type TableName = (typeof TABLES)[number];
