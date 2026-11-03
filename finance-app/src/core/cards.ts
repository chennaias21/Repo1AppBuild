/**
 * Credit-card liabilities. A card PURCHASE is an expense on the day it is made (it is counted in your monthly
 * expenses under its category). A card BILL PAYMENT is a transfer that settles what you owe: it reduces the
 * liability and is never counted as an expense again.
 */
import type { Dataset, ID, Paise, PaymentMethod } from './types';
import { addMonths, diffDays, pad } from './dates';
import { alive } from './calc';

export type CardStatus = 'clear' | 'paid' | 'upcoming' | 'dueSoon' | 'overdue';

export interface CardSummary {
  method: PaymentMethod;
  hasSchedule: boolean; // statement + due day known
  outstanding: Paise; // everything owed right now (statement + not-yet-billed); negative = credit balance
  unbilled: Paise; // purchases since the last statement
  statementBalance: Paise; // owed as at the last statement date
  dueRemaining: Paise; // part of the statement still unpaid
  statementDate: string | null;
  dueDate: string | null;
  daysToDue: number | null; // negative = overdue by N days
  status: CardStatus;
  limit: Paise | null;
  utilisation: number | null; // % of limit currently used
  spentTotal: Paise;
  paidTotal: Paise;
}

const clampDay = (d: number) => Math.min(Math.max(1, Math.floor(d)), 28);
const dateOf = (monthKey: string, day: number) => `${monthKey}-${pad(clampDay(day))}`;

/** Most recent statement date on or before `today`. */
export function lastStatementDate(today: string, billingDay: number): string {
  const key = today.slice(0, 7);
  const cand = dateOf(key, billingDay);
  return cand <= today ? cand : dateOf(addMonths(key, -1), billingDay);
}
/** Payment due date for a statement: the next `dueDay` after the statement date. */
export function dueDateFor(statementDate: string, billingDay: number, dueDay: number): string {
  const key = statementDate.slice(0, 7);
  return clampDay(dueDay) > clampDay(billingDay) ? dateOf(key, dueDay) : dateOf(addMonths(key, 1), dueDay);
}

export function cardSummary(data: Dataset, method: PaymentMethod, today: string): CardSummary {
  const txns = alive(data.transactions).filter((t) => t.paymentMethodId === method.id);
  const spends = txns.filter((t) => t.type === 'expense');
  const pays = txns.filter((t) => t.type === 'transfer' && t.transferKind === 'cardBill');
  const sum = (a: { amount: number }[]) => a.reduce((s, t) => s + t.amount, 0);
  const opening = method.openingOutstanding ?? 0;
  const spentTotal = sum(spends);
  const paidTotal = sum(pays);
  const outstanding = opening + spentTotal - paidTotal;
  const limit = method.creditLimit && method.creditLimit > 0 ? method.creditLimit : null;
  const utilisation = limit ? (Math.max(0, outstanding) / limit) * 100 : null;

  const hasSchedule = !!method.billingDay && !!method.dueDay;
  if (!hasSchedule) {
    return { method, hasSchedule, outstanding, unbilled: 0, statementBalance: Math.max(0, outstanding), dueRemaining: Math.max(0, outstanding), statementDate: null, dueDate: null, daysToDue: null,
      status: outstanding > 0 ? 'upcoming' : 'clear', limit, utilisation, spentTotal, paidTotal };
  }
  const statementDate = lastStatementDate(today, method.billingDay!);
  const dueDate = dueDateFor(statementDate, method.billingDay!, method.dueDay!);
  const unbilled = sum(spends.filter((t) => t.date > statementDate));
  const statementBalance = Math.max(0, outstanding - unbilled + sum(pays.filter((t) => t.date > statementDate)));
  const dueRemaining = Math.max(0, outstanding - unbilled);
  const daysToDue = diffDays(today, dueDate);
  let status: CardStatus;
  if (outstanding <= 0) status = 'clear';
  else if (dueRemaining <= 0) status = 'paid';
  else if (daysToDue < 0) status = 'overdue';
  else if (daysToDue <= 5) status = 'dueSoon';
  else status = 'upcoming';
  return { method, hasSchedule, outstanding, unbilled, statementBalance, dueRemaining, statementDate, dueDate, daysToDue, status, limit, utilisation, spentTotal, paidTotal };
}

export function cardSummaries(data: Dataset, today: string): CardSummary[] {
  return alive(data.paymentMethods).filter((p) => p.type === 'credit').sort((a, b) => a.sort - b.sort).map((p) => cardSummary(data, p, today));
}

export interface CardTotals { outstanding: Paise; dueRemaining: Paise; unbilled: Paise; nextDue: { date: string; card: string; amount: Paise } | null; overdue: number; dueSoon: number }
export function cardTotals(list: CardSummary[]): CardTotals {
  const due = list.filter((c) => c.dueRemaining > 0 && c.dueDate).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  return {
    outstanding: list.reduce((s, c) => s + Math.max(0, c.outstanding), 0),
    dueRemaining: list.reduce((s, c) => s + c.dueRemaining, 0),
    unbilled: list.reduce((s, c) => s + c.unbilled, 0),
    nextDue: due[0] ? { date: due[0].dueDate!, card: due[0].method.name, amount: due[0].dueRemaining } : null,
    overdue: list.filter((c) => c.status === 'overdue').length,
    dueSoon: list.filter((c) => c.status === 'dueSoon').length,
  };
}

export const CARD_STATUS_LABEL: Record<CardStatus, string> = { clear: 'No dues', paid: 'Bill paid', upcoming: 'Upcoming', dueSoon: 'Due soon', overdue: 'Overdue' };
export const cardIdSet = (list: CardSummary[]): Set<ID> => new Set(list.map((c) => c.method.id));
