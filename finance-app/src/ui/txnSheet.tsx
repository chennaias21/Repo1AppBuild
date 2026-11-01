import { useMemo, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { ID, Need, Transaction } from '../core/types';
import { addDays } from '../core/dates';
import { formatINR, paiseToInput, parseINR } from '../core/money';
import { newRecord, save, softDelete, restore } from '../data/repo';
import { Field, Segmented, Sheet } from './components';
import { useApp, type TxnInit } from './app';

type Mode = 'expense' | 'income' | 'save' | 'cardBill';
const modeOf = (t: Transaction): Mode => (t.type === 'expense' ? 'expense' : t.type === 'income' ? 'income' : t.transferKind === 'cardBill' ? 'cardBill' : 'save');

export function TxnSheet({ edit, init, onClose }: { edit?: Transaction; init?: TxnInit; onClose: () => void }) {
  const { data, today, toast } = useApp();
  const cats = data.categories;
  const catMap = useMemo(() => new Map(cats.map((c) => [c.id, c])), [cats]);
  const pms = [...data.paymentMethods].sort((a, b) => a.sort - b.sort);

  const [mode, setMode] = useState<Mode>(edit ? modeOf(edit) : init?.type ?? 'expense');
  const [amountStr, setAmountStr] = useState(edit ? paiseToInput(edit.amount) : init?.amount ? paiseToInput(init.amount) : '');
  const [catId, setCatId] = useState<ID | null>(edit ? edit.categoryId ?? null : init?.categoryId ?? null);
  const [date, setDate] = useState(edit?.date ?? init?.date ?? today);
  const lastPm = useMemo(() => [...data.transactions].filter((t) => t.type === 'expense' && t.paymentMethodId).sort((a, b) => b.createdAt - a.createdAt)[0]?.paymentMethodId ?? null, [data.transactions]);
  const [pmId, setPmId] = useState<ID | null>(edit ? edit.paymentMethodId ?? null : lastPm ?? pms[0]?.id ?? null);
  const [need, setNeed] = useState<Need | null>(edit?.need ?? null);
  const [needTouched, setNeedTouched] = useState(!!edit);
  const [note, setNote] = useState(edit?.note ?? init?.note ?? '');
  const [showAll, setShowAll] = useState(false);
  const [tried, setTried] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const kind = mode === 'expense' ? 'expense' : mode === 'income' ? 'income' : 'savings';
  const roots = useMemo(() => cats.filter((c) => c.kind === kind && !c.parentId).sort((a, b) => a.sort - b.sort), [cats, kind]);
  const usage = useMemo(() => {
    const cutoff = addDays(today, -120);
    const m = new Map<ID, number>();
    for (const t of data.transactions) {
      if (t.date < cutoff || !t.categoryId) continue;
      const c = catMap.get(t.categoryId);
      const rid = c?.parentId ?? c?.id;
      if (rid) m.set(rid, (m.get(rid) ?? 0) + 1);
    }
    return m;
  }, [data.transactions, catMap, today]);
  // Most-used first; before there is history, everyday (flexible) categories come before fixed bills.
  const ranked = useMemo(() => [...roots].sort((a, b) => (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0) || Number(a.behavior === 'fixed') - Number(b.behavior === 'fixed') || a.sort - b.sort), [roots, usage]);

  const selected = catId ? catMap.get(catId) : undefined;
  const rootId = selected ? selected.parentId ?? selected.id : null;
  const subs = useMemo(() => (rootId ? cats.filter((c) => c.parentId === rootId).sort((a, b) => a.sort - b.sort) : []), [cats, rootId]);
  const top = ranked.slice(0, 8);
  if (rootId && !top.some((c) => c.id === rootId)) { const r = catMap.get(rootId); if (r && r.kind === kind) top.push(r); }

  const pickRoot = (id: ID) => {
    setCatId(id);
    if (mode === 'expense' && !needTouched) setNeed(catMap.get(id)?.defaultNeed ?? null);
  };
  const changeMode = (m: Mode) => {
    setMode(m);
    const k = m === 'expense' ? 'expense' : m === 'income' ? 'income' : 'savings';
    if (selected && selected.kind !== k) setCatId(null);
    if (m === 'cardBill') { const cc = pms.find((p) => p.type === 'credit'); if (cc) setPmId(cc.id); }
  };

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
  const groups = data.groups;

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
          {roots.length === 0 ? <p className="muted small">No categories yet. Add one in Budget.</p> : (
            <div className="chips">
              {top.map((c) => chip(c.id, rootId === c.id, c.name, c.icon, () => pickRoot(c.id)))}
              {ranked.length > top.length && <button type="button" className="chip" onClick={() => setShowAll((s) => !s)}>{showAll ? 'Less ▴' : 'All ▾'}</button>}
            </div>
          )}
          {showAll && (
            <div className="stack" style={{ marginTop: 8 }}>
              {(mode === 'income' ? [null] : groups).map((g) => {
                const list = roots.filter((c) => (g ? c.groupId === g.id : true));
                if (!list.length) return null;
                return (
                  <div key={g?.id ?? 'x'}>
                    {g && <div className="lbl-s" style={{ marginBottom: 6 }}>{g.name}</div>}
                    <div className="chips">{list.map((c) => chip(c.id, rootId === c.id, c.name, c.icon, () => pickRoot(c.id)))}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Field>
      )}

      {subs.length > 0 && (
        <Field label="Subcategory (optional)">
          <div className="chips">
            {chip('none', catId === rootId, 'None', '•', () => setCatId(rootId))}
            {subs.map((c) => chip(c.id, catId === c.id, c.name, c.icon, () => setCatId(c.id)))}
          </div>
        </Field>
      )}

      {(mode === 'expense' || mode === 'cardBill') && pms.length > 0 && (
        <Field label={mode === 'cardBill' ? 'Which card' : 'Paid with'} help={mode === 'expense' && pms.find((p) => p.id === pmId)?.type === 'credit' ? 'Card spends count now. Pay the bill later with “Card bill”.' : undefined}>
          <div className="chips">
            {pms.filter((p) => mode !== 'cardBill' || p.type === 'credit' || pms.every((x) => x.type !== 'credit')).map((p) => chip(p.id, pmId === p.id, p.name, p.type === 'cash' ? '💵' : p.type === 'credit' ? '💳' : p.type === 'upi' ? '📲' : '🏧', () => setPmId(p.id)))}
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
