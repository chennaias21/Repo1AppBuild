import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, AlertTriangle, Info, Lightbulb, CheckCircle2 } from 'lucide-react';
import { monthLabel } from '../core/dates';
import { useApp } from './app';
import { back, go } from './router';
import type { Nudge } from '../core/insights';

export function MonthSwitch() {
  const { monthKey, shiftMonth, setMonthKey, nowKey } = useApp();
  return (
    <div className="month-switch" aria-label="Choose month">
      <button onClick={() => shiftMonth(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
      <button className="label" style={{ width: 'auto', borderRadius: 99, padding: '0 6px' }} onClick={() => setMonthKey(nowKey)} title="Jump to current month">{monthLabel(monthKey)}</button>
      <button onClick={() => shiftMonth(1)} aria-label="Next month"><ChevronRight size={18} /></button>
    </div>
  );
}

export function PageHeader({ title, months, right, backButton }: { title: string; months?: boolean; right?: ReactNode; backButton?: boolean }) {
  return (
    <div className="topbar">
      <div className="row">
        {backButton && <button className="back-btn" onClick={back} aria-label="Back"><ArrowLeft size={20} /></button>}
        <h1>{title}</h1>
      </div>
      <div className="row">{right}{months && <MonthSwitch />}</div>
    </div>
  );
}

const NUDGE_ICON = { alert: AlertTriangle, warn: AlertTriangle, info: Info, good: CheckCircle2 } as const;
export function NudgeCard({ n }: { n: Nudge }) {
  const { openSheet } = useApp();
  const Icon = n.level === 'info' ? Lightbulb : NUDGE_ICON[n.level];
  const a = n.action;
  const run = () => {
    if (!a) return;
    if (a.kind === 'goto') go(a.to);
    else if (a.kind === 'salary') openSheet({ kind: 'txn', init: { type: 'income', amount: a.amount, note: 'Salary' } });
    else openSheet({ kind: 'txn', init: { type: 'save', amount: a.amount, categoryId: a.categoryId ?? null } });
  };
  return (
    <div className={`nudge ${n.level}`}>
      <div className="ni"><Icon size={18} /></div>
      <div className="grow">
        <b>{n.title}</b>
        <p>{n.body}</p>
        {a && <button className="btn sm act" onClick={run}>{a.label}</button>}
      </div>
    </div>
  );
}
