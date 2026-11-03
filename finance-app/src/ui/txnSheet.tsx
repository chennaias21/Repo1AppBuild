import { useMemo, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { ID, Need, Transaction } from '../core/types';
import { addDays } from '../core/dates';
import { formatINR, paiseToInput, parseINR } from '../core/money';
import { newRecord, save, softDelete, restore } from '../data/repo';
import { Field, Segmented, Sheet } from './components';
import { CategoryPicker } from './categoryPicker';
import { findDuplicate } from '../core/analysis';
import { cardSummaries } from '../core/cards';
import { useApp, type TxnInit } from './app';

type Mode = 'expense' | 'income' | 'save' | 'cardBill';
const modeOf = (t: Transaction): Mode => (t.type === 'expense' ? 'expense' : t.type === 'income' ? 'income' : t.transferKind === 'cardBill' ? 'cardBill' : 'save');

export function TxnSheet({ edit, init, onClose }: { edit?: Transaction; init?: TxnInit; onClose: () => void }) {
  const { data, today, toast, confirm, openSheet } = useApp();
  const cats = data.categories;
  const catMap = useMemo(() => new Map(cats.map((c) => [c.id, c])), [cats]);
  const pms = [...data.paymentMethods].sort((a, b) => a.sort - b.sort);

  const [mode, setMode] = useState<Mode>(edit ? modeOf(edit) : init?.type ?? 'expense');
  const [amountStr, setAmountStr] = useState(edit ? paiseToInput(edit.amount) : init?.amount ? paiseToInput(init.amount) : '');
  const [catId, setCatId] = useState<ID | null>(edit ? edit.categoryId ?? null : init?.categoryId ?? null);
  const [date, setDate] = useState(edit?.date ?? init?.date ?? today);
  const lastPm = useMemo(() => [...data.transactions].filter((t) => t.type === 'expense' && t.paymentMethodId).sort((a, b) => b.createdAt - a.createdAt)[0]?.paymentMethodId ?? null, [data.transactions]);
  const [pmId, setPmId] = useState<ID | null>(edit ? edit.paymentMethodId ?? null : init?.paymentMethodId ?? lastPm ?? pms[0]?.id ?? null);
  const [need, setNeed] = useState<Need | null>(edit?.need ?? null);
  const [needTouched, setNeedTouched] = useState(!!edit);
  const [note, setNote] = useState(edit?.note ?? init?.note ?? '');
  const [tried, setTried] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const kind = mode === 'expense' ? 'expense' : mode === 'income' ? 'income' : 'savings';
  const selected = catId ? catMap.get(catId) : undefined;
  const rootId = selected ? selected.parentId ?? selected.id : null;

  const pickCategory = (id: ID) => {
    setCatId(id);
    const c = catMap.get(id);
    const root = c?.parentId ? catMap.get(c.parentId) : c;
    if (mode === 'expense' && !needTouched) setNeed(c?.defaultNeed ?? root?.defaultNeed ?? null);
  };
  const changeMode = (m: Mode) => {
    setMode(m);
    const k = m === 'expense' ? 'expense' : m === 'income' ? 'income' : 'savings';
    if (selected && selected.kind !== k) setCatId(null);
    if (m === 'cardBill') {
      const cc = (pmId && pms.find((p) => p.id === pmId && p.type === 'credit')) || pms.find((p) => p.type === 'credit');
      if (cc) { setPmId(cc.id); const ci = cardInfo.get(cc.id); if (ci && !amountStr) setAmountStr(paiseToInput(ci.dueRemaining > 0 ? ci.dueRemaining : Math.max(0, ci.outstanding))); }
    }
  };

  const cardInfo = useMemo(() => new Map(cardSummaries(data, today).map((c) => [c.method.id, c])), [data, today]);
  const amount = parseINR(amountStr);
  const needsCat = mode !== 'cardBill';
  const valid = !!amount && amount > 0 && (!needsCat || !!catId);

  const submit = async (another: boolean) => {
    setTried(true);
    if (!valid || !amount) return;
    const goalId = mode === 'save' && rootId ? catMap.get(rootId)?.goalId ?? null : null;
    const rec: Transaction = {
      ...(edit ?? newRecord()),
      type: mode === 'expense' ? 'expense' : mode === 'income' ? 'income' : 'transfer',
      amount, date,
      categoryId: mode === 'cardBill' ? null : catId,
      paymentMethodId: mode === 'income' || mode === 'save' ? null : pmId,
      need: mode === 'expense' ? need : null,
      note: note.trim(),
      transferKind: mode === 'save' ? 'savings' : mode === 'cardBill' ? 'cardBill' : null,
      goalId,
    };
    const dup = findDuplicate(data.transactions, rec, edit?.id);
    if (dup && !(await confirm({ title: 'Possible duplicate', message: `You already have a ${formatINR(amount)} ${mode === 'cardBill' ? 'card bill payment' : mode === 'save' ? 'saving' : mode === 'income' ? 'income entry' : 'expense'}${selected ? ' in ' + selected.name : ''} on ${date}.\nAdd this one anyway?`, confirmLabel: 'Add anyway' }))) return;
    await save('transactions', rec);
    const label = mode === 'cardBill' ? 'Card bill' : selected?.name ?? '';
    toast(`${edit ? 'Updated' : 'Saved'} ${formatINR(amount)}${label ? ' · ' + label : ''}`);
    if (another && !edit) { setAmountStr(''); setNote(''); setTried(false); amountRef.current?.focus(); } else onClose();
  };

  const remove = async () => {
    if (!edit) return;
    await softDelete('transactions', edit.id);
    onClose();
    toast('Transaction deleted', () => { void restore('transactions', edit.id); });
  };

  const chip = (id: ID, active: boolean, label: string, icon: string, onClick: () => void) => (
    <button key={id} type="button" className={`chip ${active ? 'on' : ''}`} onClick={onClick}><span>{icon}</span>{label}</button>
  );

  return (
    <Sheet title={edit ? 'Edit transaction' : 'Add'} onClose={onClose}
      footer={<>
        {edit ? <button className="btn danger" style={{ flex: '0 0 auto' }} onClick={remove} aria-label="Delete"><Trash2 size={18} /></button> : null}
        {!edit && <button className="btn" onClick={() => submit(true)} disabled={!valid}>Save & add more</button>}
        <button className="btn primary" onClick={() => submit(false)} disabled={!valid}>Save</button>
      </>}>
      <Segmented value={mode} onChange={changeMode} options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }, { value: 'save', label: 'Save' }, { value: 'cardBill', label: 'Card bill' }]}
        cls={mode === 'expense' ? 'exp' : mode === 'income' ? 'inc' : 'sav'} />

      <div>
        <div className="amount-input">
          <span>₹</span>
          <input ref={amountRef} autoFocus inputMode="decimal" placeholder="0" aria-label="Amount" value={amountStr}
            onChange={(e) => { const v = e.target.value.replace(/[^\d.]/g, ''); if (/^\d*\.?\d{0,2}$/.test(v)) setAmountStr(v); }} />
        </div>
        <div className="help" style={{ marginTop: 4 }}>
          {amount ? formatINR(amount) : tried ? <span className="err">Enter an amount</span> : mode === 'save' ? 'Money moved to savings counts as saved, not spent.' : mode === 'cardBill' ? 'Paying a card bill is a transfer, not a new expense.' : ' '}
        </div>
      </div>

      {mode !== 'cardBill' && (
        <Field label={mode === 'income' ? 'Income type' : mode === 'save' ? 'Save to' : 'Category'} error={tried && !catId ? 'Pick one' : null}>
          <CategoryPicker kind={kind} value={catId} onPick={pickCategory} />
        </Field>
      )}

      {mode === 'cardBill' && !pms.some((p) => p.type === 'credit') && (
        <div className="notice">You haven’t added a credit card yet. <button type="button" className="link" style={{ color: 'var(--primary)', fontWeight: 700 }} onClick={() => { onClose(); openSheet({ kind: 'payment', type: 'credit' }); }}>Add a credit card</button> to track bills and due dates.</div>
      )}
      {(mode === 'expense' || mode === 'cardBill') && pms.length > 0 && (
        <Field label={mode === 'cardBill' ? 'Which card' : 'Paid with'} help={mode === 'expense' && pms.find((p) => p.id === pmId)?.type === 'credit' ? 'Counts as an expense now. Later, record the bill payment with “Card bill”. It will not be counted twice.' : mode === 'cardBill' && pmId && cardInfo.get(pmId) ? `You owe ${formatINR(Math.max(0, cardInfo.get(pmId)!.outstanding))} on this card. A bill payment settles dues and is not an expense.` : undefined}>
          <div className="chips">
            {pms.filter((p) => mode !== 'cardBill' || p.type === 'credit').map((p) => chip(p.id, pmId === p.id, p.name, p.type === 'cash' ? '💵' : p.type === 'credit' ? '💳' : p.type === 'upi' ? '📲' : '🏧', () => {
              setPmId(p.id);
              const ci = cardInfo.get(p.id);
              if (mode === 'cardBill' && ci && !amountStr) setAmountStr(paiseToInput(ci.dueRemaining > 0 ? ci.dueRemaining : Math.max(0, ci.outstanding)));
            }))}
          </div>
        </Field>
      )}

      {mode === 'expense' && (
        <Field label="Need or Want?">
          <Segmented value={(need ?? 'none') as 'need' | 'want' | 'none'} onChange={(v) => { setNeedTouched(true); setNeed(v === 'none' ? null : v); }}
            options={[{ value: 'need', label: 'Need' }, { value: 'want', label: 'Want' }, { value: 'none', label: 'Skip' }]} />
        </Field>
      )}

      <div className="row wrap" style={{ gap: 8 }}>
        <div className="field grow" style={{ minWidth: 150 }}>
          <label>Date</label>
          <input className="input" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </div>
        <div className="row" style={{ alignSelf: 'flex-end', gap: 6 }}>
          <button type="button" className={`chip ${date === today ? 'on' : ''}`} onClick={() => setDate(today)}>Today</button>
          <button type="button" className={`chip ${date === addDays(today, -1) ? 'on' : ''}`} onClick={() => setDate(addDays(today, -1))}>Yesterday</button>
        </div>
      </div>

      <Field label="Note (optional)">
        <input className="input" placeholder="e.g. Dinner with friends" value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} />
      </Field>
    </Sheet>
  );
}
