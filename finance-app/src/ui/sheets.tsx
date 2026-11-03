import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Behavior, Category, CategoryKind, Goal, Group, ID, Need, PaymentMethod, PaymentType, Priority, Recurring, TxnType } from '../core/types';
import { budgetFor, goalProgress, goalSaved } from '../core/calc';
import { formatINR, paiseToInput, parseINR } from '../core/money';
import { monthLabel } from '../core/dates';
import { countTxnsForCategory, deleteCategory, deleteGoal, deleteGroup, newRecord, save, saveGoal, setBudget, softDelete, restore } from '../data/repo';
import { EmojiPicker, Field, Segmented, Sheet, Switch } from './components';
import { useApp } from './app';

/* =========================== Category =========================== */
export function CategorySheet({ edit, defaults, onClose }: { edit?: Category; defaults?: { groupId?: ID | null; kind?: CategoryKind }; onClose: () => void }) {
  const { data, monthKey, toast } = useApp();
  const goalLinked = !!edit?.goalId;
  const [name, setName] = useState(edit?.name ?? '');
  const [icon, setIcon] = useState(edit?.icon ?? '📦');
  const [kind, setKind] = useState<CategoryKind>(edit?.kind ?? defaults?.kind ?? 'expense');
  const [groupId, setGroupId] = useState<ID | null>(edit ? edit.groupId ?? null : defaults?.groupId ?? data.groups[0]?.id ?? null);
  const [budgetStr, setBudgetStr] = useState(edit ? paiseToInput(budgetFor(data.budgets, edit.id, monthKey)) : '');
  const [behavior, setBehavior] = useState<Behavior>(edit?.behavior ?? 'flexible');
  const [need, setNeed] = useState<Need | 'none'>(edit?.defaultNeed ?? 'none');
  const [tried, setTried] = useState(false);
  const [showIcons, setShowIcons] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [moveTo, setMoveTo] = useState<string>('');
  const [txnCount, setTxnCount] = useState(0);
  const [newSub, setNewSub] = useState('');
  const isSub = !!edit?.parentId;
  const children = useMemo(() => (edit ? data.categories.filter((c) => c.parentId === edit.id).sort((a, b) => a.sort - b.sort) : []), [data.categories, edit]);

  const nameErr = tried && !name.trim() ? 'Give it a name' : null;
  const budget = budgetStr.trim() === '' ? 0 : parseINR(budgetStr);

  const onSave = async () => {
    setTried(true);
    if (!name.trim() || budget === null) return;
    const sort = edit?.sort ?? Math.max(0, ...data.categories.map((c) => c.sort)) + 1;
    const rec: Category = {
      ...(edit ?? newRecord()), name: name.trim(), kind, groupId: kind === 'income' || isSub ? edit?.groupId ?? null : groupId, parentId: edit?.parentId ?? null,
      icon, behavior, defaultNeed: kind === 'expense' && need !== 'none' ? need : null, goalId: edit?.goalId ?? null, sort,
    };
    await save('categories', rec);
    if (edit && !isSub && edit.kind !== kind) for (const ch of children) await save('categories', { ...ch, kind });
    if (!goalLinked && !isSub && kind !== 'income') await setBudget(rec.id, monthKey, budget);
    toast(`${edit ? 'Updated' : 'Added'} ${rec.name}`);
    onClose();
  };

  const addSub = async () => {
    if (!edit || !newSub.trim()) return;
    await save('categories', { ...newRecord(), name: newSub.trim(), kind: edit.kind, groupId: edit.groupId ?? null, parentId: edit.id, icon: edit.icon, behavior: edit.behavior, defaultNeed: edit.defaultNeed ?? null, goalId: null, sort: children.length + 1 } as Category);
    setNewSub('');
  };

  const startDelete = async () => {
    if (!edit) return;
    setTxnCount(await countTxnsForCategory(edit.id));
    setDeleting(true);
  };

  if (deleting && edit) {
    const options = data.categories.filter((c) => c.kind === edit.kind && !c.parentId && c.id !== edit.id && c.id !== edit.parentId);
    return (
      <Sheet title={`Delete ${edit.name}?`} onClose={() => setDeleting(false)}
        footer={<>
          <button className="btn" onClick={() => setDeleting(false)}>Keep it</button>
          <button className="btn danger" onClick={async () => { await deleteCategory(edit.id, moveTo || null); toast(`${edit.name} deleted`); onClose(); }}>Delete</button>
        </>}>
        {txnCount > 0 ? (
          <>
            <div className="notice">{txnCount} transaction{txnCount === 1 ? '' : 's'} use{txnCount === 1 ? 's' : ''} this category. Choose where they should go. Nothing is lost from your totals.</div>
            <Field label="Move transactions to">
              <select className="select" value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
                <option value="">Uncategorised</option>
                {options.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </Field>
          </>
        ) : <p>This category has no transactions. Its budget and subcategories will be removed.</p>}
      </Sheet>
    );
  }

  return (
    <Sheet title={edit ? (isSub ? 'Edit subcategory' : 'Edit category') : 'New category'} onClose={onClose}
      footer={<>
        {edit && !goalLinked && <button className="btn danger" style={{ flex: '0 0 auto' }} onClick={startDelete} aria-label="Delete category"><Trash2 size={18} /></button>}
        <button className="btn primary" onClick={onSave}>Save</button>
      </>}>
      <div className="row">
        <button type="button" className="emoji" style={{ width: 52, height: 52, fontSize: 26 }} onClick={() => setShowIcons((s) => !s)} aria-label="Choose icon">{icon}</button>
        <div className="grow"><Field label="Name" error={nameErr}><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Groceries" autoFocus={!edit} /></Field></div>
      </div>
      {showIcons && <EmojiPicker value={icon} onChange={(e) => { setIcon(e); setShowIcons(false); }} />}

      {!isSub && !goalLinked && (
        <Field label="Type">
          <Segmented value={kind} onChange={setKind} options={[{ value: 'expense', label: 'Expense' }, { value: 'savings', label: 'Savings' }, { value: 'income', label: 'Income' }]} />
        </Field>
      )}
      {!isSub && kind !== 'income' && (
        <Field label="Group">
          <select className="select" value={groupId ?? ''} onChange={(e) => setGroupId(e.target.value || null)}>
            <option value="">No group</option>
            {data.groups.map((g) => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
          </select>
        </Field>
      )}
      {!isSub && kind !== 'income' && (goalLinked ? (
        <div className="notice">This is linked to a goal. Its monthly amount is the goal’s “monthly contribution” (change it in Goals).</div>
      ) : (
        <Field label={kind === 'savings' ? 'Planned saving per month (₹)' : 'Monthly budget (₹)'} error={budget === null ? 'Enter a valid amount' : null}
          help={`Applies from ${monthLabel(monthKey)} onwards. Earlier months keep their old budget.`}>
          <input className="input" inputMode="decimal" placeholder="0" value={budgetStr} onChange={(e) => setBudgetStr(e.target.value.replace(/[^\d.]/g, ''))} />
        </Field>
      ))}
      {kind === 'expense' && !isSub && (
        <>
          <Field label="How does it behave?" help={behavior === 'fixed' ? 'Fixed bills (rent, EMI) are set aside first and not counted in “safe to spend”.' : 'Flexible spending (food, shopping) shapes your daily safe-to-spend amount.'}>
            <Segmented value={behavior} onChange={setBehavior} options={[{ value: 'fixed', label: 'Fixed bill' }, { value: 'flexible', label: 'Flexible' }]} />
          </Field>
          <Field label="Usually a…">
            <Segmented value={need} onChange={setNeed} options={[{ value: 'need', label: 'Need' }, { value: 'want', label: 'Want' }, { value: 'none', label: 'Not set' }]} />
          </Field>
        </>
      )}
      {edit && !isSub && (
        <div className="stack" style={{ gap: 8 }}>
          <div className="lbl-s">Subcategories <span className="muted" style={{ fontWeight: 400 }}>(spending rolls up to this category’s budget)</span></div>
          {children.map((c) => <SubRow key={c.id} cat={c} />)}
          <div className="row">
            <input className="input" placeholder="Add subcategory…" value={newSub} onChange={(e) => setNewSub(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSub()} />
            <button className="btn sm" onClick={addSub} disabled={!newSub.trim()}><Plus size={16} /> Add</button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

function SubRow({ cat }: { cat: Category }) {
  const { toast } = useApp();
  const [v, setV] = useState(cat.name);
  useEffect(() => setV(cat.name), [cat.name]);
  return (
    <div className="row">
      <input className="input" value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v.trim() && v !== cat.name && save('categories', { ...cat, name: v.trim() })} />
      <button className="icon-btn" aria-label={`Delete ${cat.name}`} onClick={async () => { await softDelete('categories', cat.id); toast(`${cat.name} removed`, () => { void restore('categories', cat.id); }); }}><Trash2 size={18} /></button>
    </div>
  );
}

/* =========================== Group =========================== */
export function GroupSheet({ edit, onClose }: { edit?: Group; onClose: () => void }) {
  const { data, toast } = useApp();
  const [name, setName] = useState(edit?.name ?? '');
  const [icon, setIcon] = useState(edit?.icon ?? '📁');
  const [showIcons, setShowIcons] = useState(false);
  const [tried, setTried] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [moveTo, setMoveTo] = useState('');
  const count = edit ? data.categories.filter((c) => c.groupId === edit.id && !c.parentId).length : 0;

  const onSave = async () => {
    setTried(true);
    if (!name.trim()) return;
    await save('groups', { ...(edit ?? newRecord()), name: name.trim(), icon, sort: edit?.sort ?? Math.max(-1, ...data.groups.map((g) => g.sort)) + 1 } as Group);
    onClose();
  };
  if (deleting && edit) {
    return (
      <Sheet title={`Delete ${edit.name}?`} onClose={() => setDeleting(false)}
        footer={<><button className="btn" onClick={() => setDeleting(false)}>Keep it</button>
          <button className="btn danger" onClick={async () => { await deleteGroup(edit.id, moveTo || null); toast('Group deleted'); onClose(); }}>Delete</button></>}>
        {count > 0 ? (
          <>
            <div className="notice">This group has {count} categor{count === 1 ? 'y' : 'ies'}. They are not deleted; move them to another group.</div>
            <Field label="Move categories to">
              <select className="select" value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
                <option value="">No group</option>
                {data.groups.filter((g) => g.id !== edit.id).map((g) => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
              </select>
            </Field>
          </>
        ) : <p>This group is empty.</p>}
      </Sheet>
    );
  }
  return (
    <Sheet title={edit ? 'Edit group' : 'New group'} onClose={onClose}
      footer={<>{edit && <button className="btn danger" style={{ flex: '0 0 auto' }} onClick={() => setDeleting(true)} aria-label="Delete group"><Trash2 size={18} /></button>}<button className="btn primary" onClick={onSave}>Save</button></>}>
      <div className="row">
        <button type="button" className="emoji" style={{ width: 52, height: 52, fontSize: 26 }} onClick={() => setShowIcons((s) => !s)} aria-label="Choose icon">{icon}</button>
        <div className="grow"><Field label="Group name" error={tried && !name.trim() ? 'Give it a name' : null}><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="e.g. Kids & School" /></Field></div>
      </div>
      {showIcons && <EmojiPicker value={icon} onChange={(e) => { setIcon(e); setShowIcons(false); }} />}
    </Sheet>
  );
}

/* =========================== Goal =========================== */
export function GoalSheet({ edit, onClose }: { edit?: Goal; onClose: () => void }) {
  const { data, nowKey, toast, confirm } = useApp();
  const contributions = edit ? goalSaved({ ...edit, initialSaved: 0 }, data.transactions) : 0;
  const [name, setName] = useState(edit?.name ?? '');
  const [icon, setIcon] = useState(edit?.icon ?? '🎯');
  const [targetStr, setTargetStr] = useState(edit ? paiseToInput(edit.target) : '');
  const [savedStr, setSavedStr] = useState(edit ? paiseToInput(edit.initialSaved + contributions) : '');
  const [date, setDate] = useState(edit?.targetDate ?? '');
  const [monthlyStr, setMonthlyStr] = useState(edit ? paiseToInput(edit.monthlyContribution) : '');
  const [priority, setPriority] = useState<Priority>(edit?.priority ?? 'medium');
  const [desc, setDesc] = useState(edit?.description ?? '');
  const [emergency, setEmergency] = useState(!!edit?.isEmergency);
  const [showIcons, setShowIcons] = useState(false);
  const [tried, setTried] = useState(false);

  const target = parseINR(targetStr);
  const savedTotal = savedStr.trim() === '' ? 0 : parseINR(savedStr);
  const monthly = monthlyStr.trim() === '' ? 0 : parseINR(monthlyStr);
  const errs = {
    name: !name.trim() ? 'Give it a name' : null,
    target: !target || target <= 0 ? 'Enter the target amount' : null,
    saved: savedTotal === null ? 'Enter a valid amount' : savedTotal < contributions ? `Can’t be less than ${formatINR(contributions)} already saved through the app` : null,
    monthly: monthly === null ? 'Enter a valid amount' : null,
  };

  const preview = useMemo(() => {
    if (!target || savedTotal === null || monthly === null) return null;
    const g: Goal = { ...(edit ?? ({} as Goal)), name, icon, target, initialSaved: 0, targetDate: date || null, monthlyContribution: monthly, priority } as Goal;
    return goalProgress(g, savedTotal, nowKey);
  }, [target, savedTotal, monthly, date, nowKey, edit, name, icon, priority]);

  const onSave = async () => {
    setTried(true);
    if (Object.values(errs).some(Boolean) || !target || savedTotal === null || monthly === null) return;
    const g: Goal = {
      ...(edit ?? newRecord()), name: name.trim(), icon, target, initialSaved: savedTotal - contributions, targetDate: date || null, monthlyContribution: monthly,
      priority, description: desc.trim(), isEmergency: emergency,
    } as Goal;
    await saveGoal(g, !edit);
    toast(`${edit ? 'Updated' : 'Goal added:'} ${g.name}`);
    onClose();
  };

  const onDelete = async () => {
    if (!edit) return;
    const ok = await confirm({ title: `Delete ${edit.name}?`, message: 'The goal and its linked savings category are removed. Past savings transactions stay in your history.', confirmLabel: 'Delete', danger: true });
    if (ok) { await deleteGoal(edit.id); toast('Goal deleted'); onClose(); }
  };

  return (
    <Sheet title={edit ? 'Edit goal' : 'New goal'} onClose={onClose}
      footer={<>{edit && <button className="btn danger" style={{ flex: '0 0 auto' }} onClick={onDelete} aria-label="Delete goal"><Trash2 size={18} /></button>}<button className="btn primary" onClick={onSave}>Save goal</button></>}>
      <div className="row">
        <button type="button" className="emoji" style={{ width: 52, height: 52, fontSize: 26 }} onClick={() => setShowIcons((s) => !s)} aria-label="Choose icon">{icon}</button>
        <div className="grow"><Field label="Goal name" error={tried ? errs.name : null}><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Travel, Vehicle, Home" autoFocus={!edit} /></Field></div>
      </div>
      {showIcons && <EmojiPicker value={icon} onChange={(e) => { setIcon(e); setShowIcons(false); }} />}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
        <Field label="Target amount (₹)" error={tried ? errs.target : null}><input className="input" inputMode="decimal" value={targetStr} onChange={(e) => setTargetStr(e.target.value.replace(/[^\d.]/g, ''))} placeholder="2000000" /></Field>
        <Field label="Saved so far (₹)" error={tried ? errs.saved : null}><input className="input" inputMode="decimal" value={savedStr} onChange={(e) => setSavedStr(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" /></Field>
        <Field label="Target month (optional)"><input className="input" type="month" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Monthly contribution (₹)" error={tried ? errs.monthly : null}><input className="input" inputMode="decimal" value={monthlyStr} onChange={(e) => setMonthlyStr(e.target.value.replace(/[^\d.]/g, ''))} placeholder="10000" /></Field>
      </div>
      {preview && (
        <div className={`notice ${preview.status === 'onTrack' || preview.status === 'complete' ? 'ok' : preview.status === 'behind' ? '' : 'bad'}`}>
          {preview.status === 'complete' ? 'Goal reached 🎉' : preview.requiredMonthly !== null ? (
            <>You need <b>{formatINR(preview.requiredMonthly)}/month</b> for {preview.monthsLeft} month{preview.monthsLeft === 1 ? '' : 's'}.{' '}
              {preview.gapMonthly > 0 ? <>Your plan is {formatINR(monthly ?? 0)}: short by <b>{formatINR(preview.gapMonthly)}</b>{preview.projectedMonth ? `; at this pace you finish in ${monthLabel(preview.projectedMonth)}` : ''}.</> : 'Your plan covers it.'}</>
          ) : preview.projectedMonth ? <>At {formatINR(monthly ?? 0)}/month you’ll reach this in <b>{monthLabel(preview.projectedMonth)}</b>. Add a target month to see the required saving.</> : 'Add a monthly contribution to see when you’ll reach it.'}
        </div>
      )}
      <Field label="Priority"><Segmented value={priority} onChange={setPriority} options={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} /></Field>
      <Field label="Description (optional)"><textarea className="textarea" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Why does this matter to you?" /></Field>
      <div className="row between"><div><b>This is my Emergency Fund</b><div className="help">Used in your financial health score.</div></div><Switch on={emergency} onChange={setEmergency} label="Emergency fund" /></div>
    </Sheet>
  );
}

/* =========================== Recurring =========================== */
export function RecurringSheet({ edit, onClose }: { edit?: Recurring; onClose: () => void }) {
  const { data, toast } = useApp();
  type RMode = 'expense' | 'income' | 'save';
  const [mode, setMode] = useState<RMode>(edit ? (edit.type === 'transfer' ? 'save' : edit.type) : 'expense');
  const [amountStr, setAmountStr] = useState(edit ? paiseToInput(edit.amount) : '');
  const [catId, setCatId] = useState<string>(edit?.categoryId ?? '');
  const [pmId, setPmId] = useState<string>(edit?.paymentMethodId ?? '');
  const [day, setDay] = useState(String(edit?.dayOfMonth ?? 1));
  const [note, setNote] = useState(edit?.note ?? '');
  const [active, setActive] = useState(edit?.active ?? true);
  const [tried, setTried] = useState(false);
  const kind = mode === 'save' ? 'savings' : mode;
  const cats = data.categories.filter((c) => c.kind === kind && !c.parentId).sort((a, b) => a.sort - b.sort);
  const amount = parseINR(amountStr);
  const d = parseInt(day, 10);
  const onSave = async () => {
    setTried(true);
    if (!amount || amount <= 0 || !catId || !(d >= 1 && d <= 28)) return;
    const cat = data.categories.find((c) => c.id === catId);
    const rec: Recurring = {
      ...(edit ?? newRecord()), type: mode === 'save' ? 'transfer' : (mode as TxnType), transferKind: mode === 'save' ? 'savings' : null, amount, categoryId: catId,
      paymentMethodId: mode === 'expense' ? pmId || null : null, need: mode === 'expense' ? cat?.defaultNeed ?? null : null, note: note.trim(), dayOfMonth: d, active,
      lastHandledPeriod: edit?.lastHandledPeriod ?? null,
    } as Recurring;
    await save('recurring', rec);
    toast('Recurring item saved');
    onClose();
  };
  return (
    <Sheet title={edit ? 'Edit recurring' : 'New recurring'} onClose={onClose}
      footer={<>{edit && <button className="btn danger" style={{ flex: '0 0 auto' }} onClick={async () => { await softDelete('recurring', edit.id); toast('Removed'); onClose(); }} aria-label="Delete"><Trash2 size={18} /></button>}<button className="btn primary" onClick={onSave}>Save</button></>}>
      <Segmented value={mode} onChange={(m) => { setMode(m); setCatId(''); }} options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }, { value: 'save', label: 'Savings / SIP' }]} />
      <Field label="Amount (₹)" error={tried && !amount ? 'Enter an amount' : null}><input className="input" inputMode="decimal" value={amountStr} onChange={(e) => setAmountStr(e.target.value.replace(/[^\d.]/g, ''))} /></Field>
      <Field label="Category" error={tried && !catId ? 'Pick one' : null}>
        <select className="select" value={catId} onChange={(e) => setCatId(e.target.value)}>
          <option value="">Choose…</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </Field>
      {mode === 'expense' && (
        <Field label="Paid with">
          <select className="select" value={pmId} onChange={(e) => setPmId(e.target.value)}>
            <option value="">Not set</option>
            {data.paymentMethods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
      )}
      <Field label="Day of month (1–28)" error={tried && !(d >= 1 && d <= 28) ? 'Use a day between 1 and 28' : null} help="On/after this day the app will ask you to add it with one tap.">
        <input className="input" inputMode="numeric" value={day} onChange={(e) => setDay(e.target.value.replace(/\D/g, '').slice(0, 2))} />
      </Field>
      <Field label="Note (optional)"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Monthly rent" /></Field>
      <div className="row between"><b>Active</b><Switch on={active} onChange={setActive} label="Active" /></div>
    </Sheet>
  );
}

/* =========================== Payment method / credit card =========================== */
export function PaymentSheet({ edit, type: initType, onClose }: { edit?: PaymentMethod; type?: PaymentType; onClose: () => void }) {
  const { data, toast, confirm } = useApp();
  const [name, setName] = useState(edit?.name ?? '');
  const [type, setType] = useState<PaymentType>(edit?.type ?? initType ?? 'upi');
  const [billing, setBilling] = useState(edit?.billingDay ? String(edit.billingDay) : '');
  const [due, setDue] = useState(edit?.dueDay ? String(edit.dueDay) : '');
  const [limitStr, setLimitStr] = useState(edit?.creditLimit ? paiseToInput(edit.creditLimit) : '');
  const [openStr, setOpenStr] = useState(edit?.openingOutstanding ? paiseToInput(edit.openingOutstanding) : '');
  const [tried, setTried] = useState(false);
  const isCard = type === 'credit';
  const bd = billing === '' ? null : parseInt(billing, 10);
  const dd = due === '' ? null : parseInt(due, 10);
  const limit = limitStr.trim() === '' ? null : parseINR(limitStr);
  const opening = openStr.trim() === '' ? null : parseINR(openStr);
  const errs = {
    name: !name.trim() ? 'Give it a name' : null,
    billing: bd !== null && !(bd >= 1 && bd <= 28) ? 'Use a day from 1 to 28' : null,
    due: dd !== null && !(dd >= 1 && dd <= 28) ? 'Use a day from 1 to 28' : null,
    pair: isCard && ((bd === null) !== (dd === null)) ? 'Enter both the statement day and the due day, or leave both empty' : null,
    limit: limitStr.trim() !== '' && limit === null ? 'Enter a valid amount' : null,
    open: openStr.trim() !== '' && opening === null ? 'Enter a valid amount' : null,
  };
  const onSave = async () => {
    setTried(true);
    if (Object.values(errs).some(Boolean)) return;
    const rec: PaymentMethod = {
      ...(edit ?? newRecord()), name: name.trim(), type, sort: edit?.sort ?? data.paymentMethods.length,
      billingDay: isCard ? bd : null, dueDay: isCard ? dd : null, creditLimit: isCard ? limit : null, openingOutstanding: isCard ? opening : null,
    } as PaymentMethod;
    await save('paymentMethods', rec);
    toast(`${edit ? 'Updated' : 'Added'} ${rec.name}`);
    onClose();
  };
  const onDelete = async () => {
    if (!edit) return;
    const used = data.transactions.filter((t) => t.paymentMethodId === edit.id).length;
    const ok = await confirm({ title: `Delete ${edit.name}?`, message: used ? `${used} transaction${used === 1 ? ' uses' : 's use'} it. They stay in your history without a payment method.` : 'It is not used by any transaction.', confirmLabel: 'Delete', danger: true });
    if (ok) { await softDelete('paymentMethods', edit.id); toast(`${edit.name} removed`); onClose(); }
  };
  const TYPES: { value: PaymentType; label: string }[] = [{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }, { value: 'debit', label: 'Debit card' }, { value: 'credit', label: 'Credit card' }, { value: 'other', label: 'Other' }];
  return (
    <Sheet title={edit ? 'Edit payment method' : isCard ? 'Add credit card' : 'Add payment method'} onClose={onClose}
      footer={<>{edit && <button className="btn danger" style={{ flex: '0 0 auto' }} onClick={onDelete} aria-label="Delete"><Trash2 size={18} /></button>}<button className="btn primary" onClick={onSave}>Save</button></>}>
      <div className="notice ok small">Names only. Never enter card numbers, bank account numbers or UPI IDs. The app doesn’t need them.</div>
      <Field label="Name" error={tried ? errs.name : null}><input className="input" value={name} autoFocus={!edit} onChange={(e) => setName(e.target.value)} placeholder={isCard ? 'e.g. HDFC credit card' : 'e.g. Google Pay'} /></Field>
      <Field label="Type"><select className="select" value={type} onChange={(e) => setType(e.target.value as PaymentType)}>{TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></Field>
      {isCard && (
        <>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(150px,100%),1fr))' }}>
            <Field label="Statement day (1–28)" error={tried ? errs.billing ?? errs.pair : null} help="The day your bill is generated.">
              <input className="input" inputMode="numeric" value={billing} onChange={(e) => setBilling(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="e.g. 15" />
            </Field>
            <Field label="Payment due day (1–28)" error={tried ? errs.due : null} help="The last day to pay without charges.">
              <input className="input" inputMode="numeric" value={due} onChange={(e) => setDue(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="e.g. 5" />
            </Field>
          </div>
          <Field label="Credit limit (optional)" error={tried ? errs.limit : null} help="Shows how much of your limit you are using."><input className="input" inputMode="decimal" value={limitStr} onChange={(e) => setLimitStr(e.target.value.replace(/[^\d.]/g, ''))} placeholder="e.g. 100000" /></Field>
          <Field label="Already owed before using this app (optional)" error={tried ? errs.open : null} help="If you have an unpaid balance today, enter it so your total is correct."><input className="input" inputMode="decimal" value={openStr} onChange={(e) => setOpenStr(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" /></Field>
        </>
      )}
    </Sheet>
  );
}
