/**
 * SAMPLE data only. Applied once at first run and fully editable afterwards.
 * Nothing in the app logic depends on these names or numbers.
 */
import type { Budget, Category, Dataset, Goal, Group, PaymentMethod, Settings } from './types';
import { SCHEMA_VERSION } from './types';
import { base, goalCategory } from './factory';
import { periodKeyForDate } from './dates';
import { uid } from './id';

interface CatSeed { name: string; icon: string; pct: number; fixed?: boolean; need?: 'need' | 'want'; goal?: 'emergency' | 'marriage' }
interface GroupSeed { name: string; icon: string; kind: 'expense' | 'savings'; cats: CatSeed[] }

export const DEFAULT_STRUCTURE: GroupSeed[] = [
  { name: 'Savings & Investments', icon: '💰', kind: 'savings', cats: [
    { name: 'Emergency Fund', icon: '🛟', pct: 7, goal: 'emergency' },
    { name: 'Marriage Fund', icon: '💍', pct: 13, goal: 'marriage' },
    { name: 'Mutual Fund / SIP', icon: '📈', pct: 5 },
    { name: 'PPF / EPF Top-up', icon: '🏦', pct: 0 },
    { name: 'Gold', icon: '🪙', pct: 0 },
    { name: 'Personal Savings', icon: '🐷', pct: 5 },
  ] },
  { name: 'Fixed Expenses', icon: '🏠', kind: 'expense', cats: [
    { name: 'Rent', icon: '🏠', pct: 18, fixed: true, need: 'need' },
    { name: 'Electricity', icon: '💡', pct: 3, fixed: true, need: 'need' },
    { name: 'Mobile & Internet', icon: '📶', pct: 2, fixed: true, need: 'need' },
    { name: 'Subscriptions', icon: '📺', pct: 2, fixed: true, need: 'want' },
    { name: 'Transport Pass', icon: '🚌', pct: 3, fixed: true, need: 'need' },
  ] },
  { name: 'Household & Daily Living', icon: '🛒', kind: 'expense', cats: [
    { name: 'Groceries', icon: '🛒', pct: 7, need: 'need' },
    { name: 'Vegetables & Milk', icon: '🥦', pct: 3, need: 'need' },
    { name: 'Cooking Gas', icon: '🔥', pct: 1, need: 'need' },
    { name: 'Household Help', icon: '🧹', pct: 2, need: 'need' },
    { name: 'Toiletries', icon: '🧴', pct: 1, need: 'need' },
  ] },
  { name: 'Lifestyle & Personal', icon: '🎉', kind: 'expense', cats: [
    { name: 'Eating Out', icon: '🍽️', pct: 3, need: 'want' },
    { name: 'Shopping', icon: '🛍️', pct: 2, need: 'want' },
    { name: 'Entertainment', icon: '🎬', pct: 1, need: 'want' },
    { name: 'Travel & Outings', icon: '✈️', pct: 1, need: 'want' },
    { name: 'Personal Care', icon: '💇', pct: 1, need: 'need' },
    { name: 'Gifts', icon: '🎁', pct: 1, need: 'want' },
  ] },
  { name: 'Financial Commitments', icon: '📑', kind: 'expense', cats: [
    { name: 'Loan EMI', icon: '🏦', pct: 4, fixed: true, need: 'need' },
    { name: 'Insurance Premium', icon: '🛡️', pct: 2, fixed: true, need: 'need' },
    { name: 'Family Support', icon: '👪', pct: 2, fixed: true, need: 'need' },
  ] },
  { name: 'Health & Emergency', icon: '🩺', kind: 'expense', cats: [
    { name: 'Medical', icon: '🩺', pct: 2, need: 'need' },
    { name: 'Medicines', icon: '💊', pct: 1, need: 'need' },
    { name: 'Emergency Buffer', icon: '🚨', pct: 2, need: 'need' },
  ] },
  { name: 'Other', icon: '📦', kind: 'expense', cats: [
    { name: 'Fuel', icon: '⛽', pct: 3, need: 'need' },
    { name: 'Miscellaneous', icon: '📦', pct: 3 },
  ] },
];

export const DEFAULT_INCOME: { name: string; icon: string }[] = [
  { name: 'Salary', icon: '💼' },
  { name: 'Bonus', icon: '🎯' },
  { name: 'Reimbursement', icon: '🧾' },
  { name: 'Other Income', icon: '➕' },
];

export const DEFAULT_PAYMENT_METHODS: { name: string; type: PaymentMethod['type'] }[] = [
  { name: 'Cash', type: 'cash' },
  { name: 'UPI', type: 'upi' },
  { name: 'Debit Card', type: 'debit' },
  { name: 'Credit Card', type: 'credit' },
];

export interface SeedOptions {
  salary: number; // paise
  userName?: string;
  monthStartDay?: number;
  useDefaultCategories: boolean;
  emergencyGoal: boolean;
  marriageGoal: boolean;
  today: string;
  now?: number;
  deviceId?: string;
}

export function buildSeed(o: SeedOptions): Dataset {
  const now = o.now ?? Date.now();
  const deviceId = o.deviceId ?? uid();
  const startDay = o.monthStartDay ?? 1;
  const monthKey = periodKeyForDate(o.today, startDay);
  const b = () => base(now, deviceId);

  const settings: Settings = {
    id: 'main', schemaVersion: SCHEMA_VERSION, deviceId, userName: o.userName ?? '', salary: o.salary, currency: 'INR',
    monthStartDay: startDay, theme: 'system', watchPct: 80, targetSavingsRate: 20, onboarded: true, lastBackupAt: null, updatedAt: now,
  };

  const groups: Group[] = DEFAULT_STRUCTURE.map((g, i) => ({ ...b(), name: g.name, icon: g.icon, sort: i }));
  const categories: Category[] = [];
  const budgets: Budget[] = [];
  const goals: Goal[] = [];
  const roundBudget = (pct: number) => Math.round((o.salary / 100) * (pct / 100) / 100) * 100 * 100; // nearest ₹100, in paise

  const savingsGroup = groups[0];
  let sort = 0;
  DEFAULT_STRUCTURE.forEach((gs, gi) => {
    gs.cats.forEach((cs) => {
      if (cs.goal) {
        const wanted = cs.goal === 'emergency' ? o.emergencyGoal : o.marriageGoal;
        if (!wanted) return;
        const goal: Goal = cs.goal === 'emergency'
          ? { ...b(), name: 'Emergency Fund', icon: '🛟', target: 150000 * 100, initialSaved: 0, targetDate: null, monthlyContribution: roundBudget(cs.pct), priority: 'high', description: 'Safety net for 3–6 months of expenses.', isEmergency: true }
          : { ...b(), name: 'Marriage Fund', icon: '💍', target: 2000000 * 100, initialSaved: 400000 * 100, targetDate: '2028-10', monthlyContribution: roundBudget(cs.pct), priority: 'high', description: 'Saving for the wedding.', isEmergency: false };
        goals.push(goal);
        categories.push(goalCategory(goal, savingsGroup.id, sort++, now, deviceId));
        return;
      }
      if (!o.useDefaultCategories) return;
      const cat: Category = {
        ...b(), name: cs.name, kind: gs.kind, groupId: groups[gi].id, parentId: null, icon: cs.icon,
        behavior: cs.fixed ? 'fixed' : 'flexible', defaultNeed: cs.need ?? null, goalId: null, sort: sort++,
      };
      categories.push(cat);
      if (cs.pct > 0) budgets.push({ ...b(), categoryId: cat.id, effectiveFrom: monthKey, amount: roundBudget(cs.pct) });
    });
  });
  DEFAULT_INCOME.forEach((ic) => {
    categories.push({ ...b(), name: ic.name, kind: 'income', groupId: null, parentId: null, icon: ic.icon, behavior: 'flexible', defaultNeed: null, goalId: null, sort: sort++ });
  });

  // Rounding can leave the plan a few hundred rupees off the salary. Settle the difference in the biggest budget
  // so the sample plan adds up to the salary exactly (never over-planned on first launch).
  if (budgets.length) {
    const planned = budgets.reduce((a, b) => a + b.amount, 0) + goals.reduce((a, g) => a + g.monthlyContribution, 0);
    const target = Math.floor(o.salary / 10000) * 10000;
    const diff = target - planned;
    // adjust a flexible category (never a fixed bill such as Rent, which people know exactly)
    const flexible = budgets.filter((b) => categories.find((c) => c.id === b.categoryId)?.behavior === 'flexible');
    const biggest = (flexible.length ? flexible : budgets).reduce((a, b) => (b.amount > a.amount ? b : a));
    if (diff !== 0 && biggest.amount + diff > 0) biggest.amount += diff;
  }

  const paymentMethods: PaymentMethod[] = DEFAULT_PAYMENT_METHODS.map((p, i) => ({ ...b(), name: p.name, type: p.type, sort: i }));

  return { settings, groups, categories, budgets, transactions: [], goals, paymentMethods, recurring: [] };
}
