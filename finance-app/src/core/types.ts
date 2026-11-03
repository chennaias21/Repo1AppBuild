/**
 * Data model. Everything is plain JSON so it can be exported, restored and
 * (in future) synced. Money is ALWAYS stored as integer paise (₹1 = 100).
 * Every record has a UUID, timestamps and a soft-delete flag so that a future
 * cloud-sync / multi-device merge can be added without changing the schema.
 */
export type ID = string;
export type Paise = number;

export interface Base {
  id: ID;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  deviceId?: string;
}

export type CategoryKind = 'expense' | 'income' | 'savings';
export type Need = 'need' | 'want';
export type Behavior = 'fixed' | 'flexible';

export interface Group extends Base {
  name: string;
  icon: string;
  sort: number;
}

export interface Category extends Base {
  name: string;
  kind: CategoryKind;
  groupId?: ID | null; // income categories have no group
  parentId?: ID | null; // set => this is a subcategory
  icon: string;
  behavior: Behavior; // fixed (rent, EMI) vs flexible (food, shopping)
  defaultNeed?: Need | null;
  goalId?: ID | null; // savings category linked to a goal
  sort: number;
}

/** Budget for a category from month `effectiveFrom` ('YYYY-MM') onwards. */
export interface Budget extends Base {
  categoryId: ID;
  effectiveFrom: string;
  amount: Paise;
}

export type TxnType = 'expense' | 'income' | 'transfer';
export type TransferKind = 'savings' | 'cardBill';

export interface Transaction extends Base {
  type: TxnType;
  amount: Paise;
  date: string; // YYYY-MM-DD (local date)
  categoryId?: ID | null; // category or subcategory
  paymentMethodId?: ID | null;
  need?: Need | null;
  note?: string;
  transferKind?: TransferKind | null;
  goalId?: ID | null; // savings transfers credit this goal
}

export type PaymentType = 'cash' | 'upi' | 'debit' | 'credit' | 'other';
/** Names only. Never store card numbers, account numbers or UPI IDs. */
export interface PaymentMethod extends Base {
  name: string;
  type: PaymentType;
  sort: number;
  // Credit cards only (all optional; nothing sensitive is ever stored):
  billingDay?: number | null; // statement date, day of month (1-28)
  dueDay?: number | null; // payment due date, day of month (1-28)
  creditLimit?: Paise | null;
  openingOutstanding?: Paise | null; // amount already owed before you started using the app
}

export type Priority = 'high' | 'medium' | 'low';
export interface Goal extends Base {
  name: string;
  icon: string;
  target: Paise;
  initialSaved: Paise; // amount saved before/outside the app
  targetDate?: string | null; // 'YYYY-MM'
  monthlyContribution: Paise;
  priority: Priority;
  description?: string;
  isEmergency?: boolean;
}

export interface Recurring extends Base {
  type: TxnType;
  transferKind?: TransferKind | null;
  amount: Paise;
  categoryId?: ID | null;
  paymentMethodId?: ID | null;
  need?: Need | null;
  note?: string;
  dayOfMonth: number; // 1-28
  active: boolean;
  lastHandledPeriod?: string | null; // 'YYYY-MM' of the period already added/skipped
}

export type ThemePref = 'system' | 'light' | 'dark';
export interface Settings {
  id: 'main';
  schemaVersion: number;
  deviceId: string;
  userName: string;
  salary: Paise;
  currency: 'INR';
  monthStartDay: number; // 1 = calendar month
  theme: ThemePref;
  watchPct: number; // category "Watch Out" threshold, % (default 80)
  targetSavingsRate: number; // % of income considered a healthy savings rate
  onboarded: boolean;
  uiScale?: number; // display size, 0.85 - 1.3 (1 = normal)
  lastBackupAt?: number | null;
  updatedAt: number;
}

export type Status = 'onTrack' | 'watch' | 'over';
export type GoalStatus = 'complete' | 'onTrack' | 'behind' | 'offTrack' | 'overdue';

export interface Dataset {
  settings: Settings;
  groups: Group[];
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  goals: Goal[];
  paymentMethods: PaymentMethod[];
  recurring: Recurring[];
}

export const SCHEMA_VERSION = 1;
