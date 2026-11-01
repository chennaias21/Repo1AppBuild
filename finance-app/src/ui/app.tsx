import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Category, CategoryKind, Dataset, Goal, Group, ID, Paise, Recurring, Transaction } from '../core/types';
import { summarize, currentKey, type MonthSummary } from '../core/calc';
import { buildNudges, type Nudge } from '../core/insights';
import { addMonths, todayStr } from '../core/dates';
import { Sheet } from './components';
import { TxnSheet } from './txnSheet';
import { CategorySheet, GoalSheet, GroupSheet, RecurringSheet } from './sheets';

export interface TxnInit { type?: 'expense' | 'income' | 'save' | 'cardBill'; amount?: Paise; categoryId?: ID | null; note?: string; date?: string }
export type SheetState =
  | { kind: 'txn'; edit?: Transaction; init?: TxnInit }
  | { kind: 'category'; edit?: Category; defaults?: { groupId?: ID | null; kind?: CategoryKind } }
  | { kind: 'goal'; edit?: Goal }
  | { kind: 'group'; edit?: Group }
  | { kind: 'recurring'; edit?: Recurring };

interface ConfirmOpts { title: string; message: string; confirmLabel?: string; danger?: boolean }
interface Ctx {
  data: Dataset;
  today: string;
  nowKey: string;
  monthKey: string;
  setMonthKey: (k: string) => void;
  shiftMonth: (n: number) => void;
  cur: MonthSummary;
  prev: MonthSummary;
  nudges: Nudge[];
  toast: (message: string, undo?: () => void) => void;
  confirm: (o: ConfirmOpts) => Promise<boolean>;
  openSheet: (s: SheetState) => void;
  closeSheet: () => void;
}
const AppCtx = createContext<Ctx | null>(null);
export const useApp = (): Ctx => {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp outside provider');
  return c;
};

/** Re-renders when the calendar day changes (app left open overnight / resumed from background). */
function useToday(): string {
  const [today, setToday] = useState(todayStr());
  useEffect(() => {
    const tick = () => setToday((t) => { const n = todayStr(); return n === t ? t : n; });
    const id = setInterval(tick, 30000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, []);
  return today;
}

export function AppProvider({ data, children }: { data: Dataset; children: ReactNode }) {
  const today = useToday();
  const nowKey = currentKey(data.settings, today);
  const [monthKey, setMonthKey] = useState(nowKey);
  const lastNow = useRef(nowKey);
  useEffect(() => {
    // If the user was looking at the "current" month and a new month starts, follow it.
    if (lastNow.current !== nowKey) { setMonthKey((m) => (m === lastNow.current ? nowKey : m)); lastNow.current = nowKey; }
  }, [nowKey]);

  const cur = useMemo(() => summarize(data, monthKey, today), [data, monthKey, today]);
  const prev = useMemo(() => summarize(data, addMonths(monthKey, -1), today), [data, monthKey, today]);
  const nudges = useMemo(() => buildNudges(data, monthKey, today, cur, prev), [data, monthKey, today, cur, prev]);

  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [toastState, setToastState] = useState<{ id: number; message: string; undo?: () => void } | null>(null);
  const [confirmState, setConfirmState] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);

  const toast = useCallback((message: string, undo?: () => void) => {
    const id = Date.now();
    setToastState({ id, message, undo });
    setTimeout(() => setToastState((t) => (t && t.id === id ? null : t)), 5000);
  }, []);
  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setConfirmState({ ...o, resolve })), []);
  const openSheet = useCallback((s: SheetState) => setSheet(s), []);
  const closeSheet = useCallback(() => setSheet(null), []);
  const shiftMonth = useCallback((n: number) => setMonthKey((m) => addMonths(m, n)), []);

  const value: Ctx = { data, today, nowKey, monthKey, setMonthKey, shiftMonth, cur, prev, nudges, toast, confirm, openSheet, closeSheet };
  const key = sheet ? JSON.stringify(sheet).slice(0, 200) + (sheet.kind === 'txn' ? '' : '') : '';
  return (
    <AppCtx.Provider value={value}>
      {children}
      {sheet?.kind === 'txn' && <TxnSheet key={key} edit={sheet.edit} init={sheet.init} onClose={closeSheet} />}
      {sheet?.kind === 'category' && <CategorySheet key={key} edit={sheet.edit} defaults={sheet.defaults} onClose={closeSheet} />}
      {sheet?.kind === 'goal' && <GoalSheet key={key} edit={sheet.edit} onClose={closeSheet} />}
      {sheet?.kind === 'group' && <GroupSheet key={key} edit={sheet.edit} onClose={closeSheet} />}
      {sheet?.kind === 'recurring' && <RecurringSheet key={key} edit={sheet.edit} onClose={closeSheet} />}
      {confirmState && (
        <Sheet title={confirmState.title} onClose={() => { confirmState.resolve(false); setConfirmState(null); }}
          footer={<>
            <button className="btn" onClick={() => { confirmState.resolve(false); setConfirmState(null); }}>Cancel</button>
            <button className={`btn ${confirmState.danger ? 'danger' : 'primary'}`} onClick={() => { confirmState.resolve(true); setConfirmState(null); }}>{confirmState.confirmLabel ?? 'Confirm'}</button>
          </>}>
          <p style={{ whiteSpace: 'pre-line' }}>{confirmState.message}</p>
        </Sheet>
      )}
      {toastState && (
        <div className="toast" role="status">
          <span>{toastState.message}</span>
          {toastState.undo && <button onClick={() => { toastState.undo?.(); setToastState(null); }}>Undo</button>}
        </div>
      )}
    </AppCtx.Provider>
  );
}
