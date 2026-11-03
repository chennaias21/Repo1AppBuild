import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronRight, Download, FileSpreadsheet, FolderTree, HardDriveDownload, Palette, Plus, Repeat, ShieldCheck, Trash2, Upload, User, CreditCard, Pencil, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';
import { alive } from '../../core/calc';
import { buildBackup, countsOf, validateBackupText, type BackupFile } from '../../core/backup';
import { planImport, toExportRows, EXPORT_HEADERS, type ImportPlan } from '../../core/csv';
import { todayStr } from '../../core/dates';
import { formatINR, paiseToInput, parseINR } from '../../core/money';
import type { Category, PaymentType, ThemePref } from '../../core/types';
import { addTransactions, replaceAll, resetAll, save, updateSettings } from '../../data/repo';
import { readFileBuffer, readFileText, saveFile, isNative } from '../../data/files';
import { Field, Segmented, Sheet } from '../components';
import { PageHeader } from '../page';
import { useApp } from '../app';
import { go } from '../router';

const SUBS = ['profile', 'categories', 'payment', 'recurring', 'backup', 'data', 'about'] as const;

export function Settings({ sub }: { sub?: string }) {
  switch (sub) {
    case 'profile': return <Profile />;
    case 'categories': return <ManageCategories />;
    case 'payment': return <PaymentMethods />;
    case 'recurring': return <RecurringList />;
    case 'backup': return <BackupRestore />;
    case 'data': return <ImportExport />;
    case 'about': return <About />;
    default: return <Hub />;
  }
}
export const isSettingsSub = (s: string | undefined) => !!s && (SUBS as readonly string[]).includes(s);

/* ---------------- Hub ---------------- */
function Hub() {
  const { data } = useApp();
  const s = data.settings;
  const Row = ({ to, icon, title, sub, danger }: { to: string; icon: ReactNode; title: string; sub: string; danger?: boolean }) => (
    <button className="item" onClick={() => go(`/settings/${to}`)}>
      <div className="emoji" style={danger ? { color: 'var(--red)' } : undefined}>{icon}</div>
      <div className="grow"><div className="title">{title}</div><div className="sub">{sub}</div></div><ChevronRight size={18} className="muted" />
    </button>
  );
  return (
    <>
      <PageHeader title="Settings" />
      <div className="stack">
        <div className="card">
          <div className="card-head"><h2>Appearance</h2><Palette size={18} className="muted" /></div>
          <Segmented<ThemePref> value={s.theme} onChange={(theme) => updateSettings({ theme })} options={[{ value: 'system', label: 'Auto' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
          <DisplaySize />
        </div>
        <div className="card tight"><div className="list">
          <Row to="profile" icon={<User size={20} />} title="Salary & preferences" sub={`${formatINR(s.salary)} / month · budget month starts on day ${s.monthStartDay}`} />
          <Row to="categories" icon={<FolderTree size={20} />} title="Categories & groups" sub={`${alive(data.categories).filter((c) => !c.parentId).length} categories · ${data.groups.length} groups`} />
          <button className="item" onClick={() => go('/cards')}><div className="emoji">💳</div><div className="grow"><div className="title">Credit cards</div><div className="sub">Outstanding, due dates and payments</div></div><ChevronRight size={18} className="muted" /></button>
          <Row to="payment" icon={<CreditCard size={20} />} title="Payment methods" sub={data.paymentMethods.map((p) => p.name).join(', ') || 'None yet'} />
          <Row to="recurring" icon={<Repeat size={20} />} title="Recurring entries" sub={`${data.recurring.length} set up (rent, EMI, SIP...)`} />
        </div></div>
        <div className="card tight"><div className="list">
          <Row to="backup" icon={<HardDriveDownload size={20} />} title="Backup & restore" sub={s.lastBackupAt ? `Last backup ${new Date(s.lastBackupAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'No backup yet'} />
          <Row to="data" icon={<FileSpreadsheet size={20} />} title="Import / export transactions" sub="CSV and Excel" />
          <Row to="about" icon={<ShieldCheck size={20} />} title="Privacy, about & reset" sub="Your data never leaves this device" />
        </div></div>
      </div>
    </>
  );
}

/* ---------------- Display size ---------------- */
export const SCALES = [{ value: '0.9', label: 'Small' }, { value: '1', label: 'Normal' }, { value: '1.12', label: 'Large' }, { value: '1.25', label: 'Extra large' }];
export function DisplaySize({ compact }: { compact?: boolean }) {
  const { data } = useApp();
  const scale = data.settings.uiScale ?? 1;
  const key = SCALES.reduce((best, o) => (Math.abs(+o.value - scale) < Math.abs(+best.value - scale) ? o : best)).value;
  return (
    <div className="stack" style={{ gap: 8, marginTop: compact ? 0 : 14 }}>
      {!compact && <div className="row between"><b className="small">Display size</b>{scale !== 1 && <button className="btn sm" onClick={() => updateSettings({ uiScale: 1 })}>Reset to normal</button>}</div>}
      <Segmented value={key} onChange={(v) => updateSettings({ uiScale: +v })} options={SCALES} />
      {!compact && <p className="help">Makes everything bigger or smaller on every screen. Pinch-zoom is turned off so pages never get stuck zoomed.</p>}
    </div>
  );
}

/* ---------------- Profile ---------------- */
function Profile() {
  const { data, toast } = useApp();
  const s = data.settings;
  const [name, setName] = useState(s.userName);
  const [salary, setSalary] = useState(paiseToInput(s.salary));
  const [startDay, setStartDay] = useState(String(s.monthStartDay));
  const [watch, setWatch] = useState(String(s.watchPct));
  const [rate, setRate] = useState(String(s.targetSavingsRate));
  const sal = salary.trim() === '' ? 0 : parseINR(salary);
  const sd = parseInt(startDay, 10);
  const w = parseInt(watch, 10);
  const r = parseInt(rate, 10);
  const ok = sal !== null && sd >= 1 && sd <= 28 && w >= 50 && w <= 99 && r >= 1 && r <= 90;
  return (
    <>
      <PageHeader title="Salary & preferences" backButton />
      <div className="card stack">
        <Field label="Your name (optional)"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Monthly salary (₹, in-hand)" error={sal === null ? 'Enter a valid amount' : null}><input className="input" inputMode="decimal" value={salary} onChange={(e) => setSalary(e.target.value.replace(/[^\d.]/g, ''))} /></Field>
        <Field label="Budget month starts on day" error={!(sd >= 1 && sd <= 28) ? 'Use 1 to 28' : null} help="1 = calendar month (1st to last day). Use e.g. 25 if your salary arrives on the 25th.">
          <input className="input" inputMode="numeric" value={startDay} onChange={(e) => setStartDay(e.target.value.replace(/\D/g, '').slice(0, 2))} />
        </Field>
        <Field label="“Watch Out” alert at (% of a budget)" error={!(w >= 50 && w <= 99) ? 'Use 50 to 99' : null}><input className="input" inputMode="numeric" value={watch} onChange={(e) => setWatch(e.target.value.replace(/\D/g, '').slice(0, 2))} /></Field>
        <Field label="Healthy savings rate (% of income)" error={!(r >= 1 && r <= 90) ? 'Use 1 to 90' : null} help="Used in your financial health score."><input className="input" inputMode="numeric" value={rate} onChange={(e) => setRate(e.target.value.replace(/\D/g, '').slice(0, 2))} /></Field>
        <button className="btn primary" disabled={!ok} onClick={async () => { await updateSettings({ userName: name.trim(), salary: sal ?? 0, monthStartDay: sd, watchPct: w, targetSavingsRate: r }); toast('Saved'); }}>Save changes</button>
      </div>
    </>
  );
}

/* ---------------- Categories & groups ---------------- */
function ManageCategories() {
  const { data, openSheet } = useApp();
  const groups = [...data.groups].sort((a, b) => a.sort - b.sort);
  const roots = data.categories.filter((c) => !c.parentId);
  const swap = async <T extends { id: string; sort: number; createdAt: number; updatedAt: number }>(table: 'groups' | 'categories', list: T[], i: number, dir: -1 | 1) => {
    const a = list[i], b = list[i + dir];
    if (!a || !b) return;
    await save(table, { ...a, sort: b.sort === a.sort ? b.sort + dir : b.sort });
    await save(table, { ...b, sort: a.sort === b.sort ? a.sort - dir : a.sort });
  };
  const catsOf = (gid: string | null) => roots.filter((c) => c.kind !== 'income' && (c.groupId ?? null) === gid).sort((a, b) => a.sort - b.sort);
  const known = new Set(groups.map((g) => g.id));
  const loose = roots.filter((c) => c.kind !== 'income' && (!c.groupId || !known.has(c.groupId))).sort((a, b) => a.sort - b.sort);
  const income = roots.filter((c) => c.kind === 'income').sort((a, b) => a.sort - b.sort);

  const CatRow = ({ c, list, i }: { c: Category; list: Category[]; i: number }) => (
    <div className="item">
      <button className="row grow" style={{ textAlign: 'left' }} onClick={() => openSheet({ kind: 'category', edit: c })}>
        <div className="emoji">{c.icon}</div>
        <div className="grow"><div className="title">{c.name}</div><div className="sub">{c.kind === 'savings' ? 'Savings' : c.kind === 'income' ? 'Income' : c.behavior === 'fixed' ? 'Fixed expense' : 'Flexible expense'}{c.goalId ? ' · linked to goal' : ''}</div></div>
      </button>
      <button className="icon-btn" aria-label={`Move ${c.name} up`} disabled={i === 0} onClick={() => swap('categories', list, i, -1)}><ArrowUp size={16} /></button>
      <button className="icon-btn" aria-label={`Move ${c.name} down`} disabled={i === list.length - 1} onClick={() => swap('categories', list, i, 1)}><ArrowDown size={16} /></button>
    </div>
  );

  return (
    <>
      <PageHeader title="Categories & groups" backButton right={<button className="btn sm primary" onClick={() => openSheet({ kind: 'category' })}><Plus size={16} /> Category</button>} />
      <p className="muted small" style={{ margin: '-6px 4px 12px' }}>Tap a category to rename it, change its group, set its budget or add subcategories.</p>
      <div className="stack">
        {groups.map((g, gi) => {
          const list = catsOf(g.id);
          return (
            <div className="card" key={g.id}>
              <div className="card-head">
                <div className="row"><span style={{ fontSize: 20 }}>{g.icon}</span><h2>{g.name}</h2></div>
                <div className="row" style={{ gap: 0 }}>
                  <button className="icon-btn" aria-label="Move group up" disabled={gi === 0} onClick={() => swap('groups', groups, gi, -1)}><ArrowUp size={16} /></button>
                  <button className="icon-btn" aria-label="Move group down" disabled={gi === groups.length - 1} onClick={() => swap('groups', groups, gi, 1)}><ArrowDown size={16} /></button>
                  <button className="icon-btn" aria-label={`Edit ${g.name}`} onClick={() => openSheet({ kind: 'group', edit: g })}><Pencil size={16} /></button>
                  <button className="icon-btn" aria-label={`Add category to ${g.name}`} onClick={() => openSheet({ kind: 'category', defaults: { groupId: g.id, kind: /saving/i.test(g.name) ? 'savings' : 'expense' } })}><Plus size={18} /></button>
                </div>
              </div>
              {list.length === 0 ? <p className="muted small">Empty group.</p> : <div className="list">{list.map((c, i) => <CatRow key={c.id} c={c} list={list} i={i} />)}</div>}
            </div>
          );
        })}
        {loose.length > 0 && <div className="card"><div className="card-head"><h2>📂 No group</h2></div><div className="list">{loose.map((c, i) => <CatRow key={c.id} c={c} list={loose} i={i} />)}</div></div>}
        <div className="card">
          <div className="card-head"><h2>💼 Income categories</h2><button className="icon-btn" aria-label="Add income category" onClick={() => openSheet({ kind: 'category', defaults: { kind: 'income' } })}><Plus size={18} /></button></div>
          <div className="list">{income.map((c, i) => <CatRow key={c.id} c={c} list={income} i={i} />)}</div>
        </div>
        <button className="btn block" onClick={() => openSheet({ kind: 'group' })}><Plus size={18} /> New group</button>
      </div>
    </>
  );
}

/* ---------------- Payment methods ---------------- */
function PaymentMethods() {
  const { data, openSheet } = useApp();
  const list = [...data.paymentMethods].sort((a, b) => a.sort - b.sort);
  const LABEL: Record<PaymentType, string> = { cash: 'Cash', upi: 'UPI', debit: 'Debit card', credit: 'Credit card', other: 'Other' };
  const ICON: Record<PaymentType, string> = { cash: '💵', upi: '📲', debit: '🏧', credit: '💳', other: '🔖' };
  return (
    <>
      <PageHeader title="Payment methods" backButton right={<button className="btn sm primary" onClick={() => openSheet({ kind: 'payment' })}><Plus size={16} /> Add</button>} />
      <div className="stack">
        <div className="notice ok">Use names only, like “HDFC credit card”. Never enter card numbers, bank account numbers or UPI IDs. The app never asks for them.</div>
        <div className="card tight">
          {list.length === 0 ? <p className="muted" style={{ padding: 12 }}>None yet.</p> : (
            <div className="list">
              {list.map((p) => (
                <button key={p.id} className="item" onClick={() => openSheet({ kind: 'payment', edit: p })}>
                  <div className="emoji">{ICON[p.type]}</div>
                  <div className="grow"><div className="title">{p.name}</div><div className="sub">{LABEL[p.type]}{p.type === 'credit' ? (p.billingDay && p.dueDay ? ` · statement ${p.billingDay}th, due ${p.dueDay}th` : ' · tap to set statement and due days') : ''}</div></div>
                  <ChevronRight size={18} className="muted" />
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="btn block" onClick={() => openSheet({ kind: 'payment', type: 'credit' })}><CreditCard size={18} /> Add a credit card</button>
      </div>
    </>
  );
}

/* ---------------- Recurring ---------------- */
function RecurringList() {
  const { data, openSheet } = useApp();
  const catMap = new Map(data.categories.map((c) => [c.id, c]));
  return (
    <>
      <PageHeader title="Recurring entries" backButton right={<button className="btn sm primary" onClick={() => openSheet({ kind: 'recurring' })}><Plus size={16} /> New</button>} />
      <p className="muted small" style={{ margin: '-6px 4px 12px' }}>Rent, EMI, SIPs, subscriptions. On the due date the app shows them on Home so you can add each with one tap. Nothing is added automatically.</p>
      <div className="card tight">
        {data.recurring.length === 0 ? <p className="muted" style={{ padding: 12 }}>Nothing set up yet.</p> : (
          <div className="list">
            {data.recurring.map((r) => {
              const c = r.categoryId ? catMap.get(r.categoryId) : undefined;
              return (
                <button key={r.id} className="item" onClick={() => openSheet({ kind: 'recurring', edit: r })}>
                  <div className="emoji">{c?.icon ?? '🔁'}</div>
                  <div className="grow"><div className="title">{r.note || c?.name || 'Recurring'}</div><div className="sub">Day {r.dayOfMonth} · {c?.name}{r.active ? '' : ' · paused'}</div></div>
                  <div className="amt">{formatINR(r.amount)}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

/* ---------------- Backup & restore ---------------- */
function BackupRestore() {
  const { data, toast } = useApp();
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [errors, setErrors] = useState<string[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cur = countsOf(data);

  const doBackup = async () => {
    setBusy(true);
    try {
      const file = buildBackup(data);
      const stamp = todayStr();
      const r = await saveFile(`RupeeRoutine-backup-${stamp}.json`, JSON.stringify(file, null, 1), 'application/json');
      if (r !== 'cancelled') { await updateSettings({ lastBackupAt: Date.now() }); toast(isNative() ? 'Backup ready. Choose where to save it.' : 'Backup downloaded'); }
    } finally { setBusy(false); }
  };

  const onPick = async (f: File | undefined) => {
    if (!f) return;
    setErrors(null);
    const text = await readFileText(f);
    const res = validateBackupText(text);
    if (res.ok) setPending(res.backup); else setErrors(res.errors);
    if (fileRef.current) fileRef.current.value = '';
  };

  const doRestore = async () => {
    if (!pending) return;
    const d = pending.data;
    // Keep THIS device's id: every device has its own separate database.
    await replaceAll({ ...d, settings: { ...d.settings, deviceId: data.settings.deviceId, onboarded: true } });
    setPending(null);
    toast('Data restored');
  };

  const fc = pending ? countsOf(pending.data) : null;
  return (
    <>
      <PageHeader title="Backup & restore" backButton />
      <div className="stack">
        <div className="card stack">
          <div><h2>Back up your data</h2><p className="muted small" style={{ marginTop: 4 }}>One file with everything: transactions, budgets, categories, goals and settings. {isNative() ? 'You’ll choose where to save it (Drive, Files, WhatsApp…).' : 'It downloads to your Downloads folder.'}</p></div>
          <div className="row between small"><span className="muted">Right now</span><span>{cur.transactions} transactions · {cur.categories} categories · {cur.goals} goals</span></div>
          <button className="btn primary" onClick={doBackup} disabled={busy}><Download size={18} /> Back up now</button>
        </div>
        <div className="card stack">
          <div><h2>Restore from a backup</h2><p className="muted small" style={{ marginTop: 4 }}>Use this to move your data to another device. The file is checked first, and you’ll be asked before anything is replaced.</p></div>
          <input ref={fileRef} type="file" accept=".json,application/json" className="sr" id="restore-file" onChange={(e) => onPick(e.target.files?.[0])} />
          <button className="btn" onClick={() => fileRef.current?.click()}><Upload size={18} /> Choose backup file</button>
          {errors && <div className="notice bad"><b>Can’t restore this file.</b><ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul><p style={{ marginTop: 6 }}>Nothing was changed.</p></div>}
        </div>
        <p className="help">Tip: Web and Android keep separate data. To move data between them, back up on one and restore on the other.</p>
      </div>

      {pending && fc && (
        <Sheet title="Replace your data?" onClose={() => setPending(null)}
          footer={<><button className="btn" onClick={() => setPending(null)}>Cancel</button><button className="btn danger" onClick={doRestore}>Replace my data</button></>}>
          <div className="notice bad"><AlertTriangle size={16} style={{ verticalAlign: -3 }} /> <b>This will overwrite everything on this device.</b> Your current data will be lost unless you have a backup.</div>
          <div>
            <div className="kv"><span className="muted"></span><b>This device now</b><b>Backup file</b></div>
            <div className="kv"><span>Transactions</span><span>{cur.transactions}</span><b>{fc.transactions}</b></div>
            <div className="kv"><span>Categories</span><span>{cur.categories}</span><b>{fc.categories}</b></div>
            <div className="kv"><span>Goals</span><span>{cur.goals}</span><b>{fc.goals}</b></div>
            <div className="kv"><span>Budgets</span><span>{cur.budgets}</span><b>{fc.budgets}</b></div>
            <div className="kv"><span>Backup made</span><span /><b>{new Date(pending.exportedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</b></div>
          </div>
          <button className="btn" onClick={doBackup}><Download size={16} /> Save a backup of my current data first</button>
        </Sheet>
      )}
    </>
  );
}

/* ---------------- Import / export ---------------- */
function ImportExport() {
  const { data, toast } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const stamp = todayStr();

  const exportCsv = async () => {
    const rows = toExportRows(data);
    const csv = '﻿' + Papa.unparse({ fields: [...EXPORT_HEADERS], data: rows.map((r) => EXPORT_HEADERS.map((h) => r[h])) });
    await saveFile(`RupeeRoutine-transactions-${stamp}.csv`, csv, 'text/csv');
    toast(`Exported ${rows.length} transactions`);
  };
  const exportXlsx = async () => {
    const XLSX = await import('xlsx');
    const rows = toExportRows(data);
    const ws = XLSX.utils.json_to_sheet(rows, { header: [...EXPORT_HEADERS] });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    await saveFile(`RupeeRoutine-transactions-${stamp}.xlsx`, new Uint8Array(out), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    toast(`Exported ${rows.length} transactions`);
  };
  const template = async () => {
    const csv = '﻿' + Papa.unparse({ fields: [...EXPORT_HEADERS], data: [['2026-11-03', 'expense', 450, 'Groceries', '', 'UPI', 'need', 'Weekly vegetables', '', ''], ['2026-11-01', 'income', 86000, 'Salary', '', '', '', 'November salary', '', '']] });
    await saveFile('RupeeRoutine-import-template.csv', csv, 'text/csv');
  };

  const onPick = async (f: File | undefined) => {
    if (!f) return;
    setErr(null); setPlan(null);
    try {
      let rows: Record<string, unknown>[];
      if (/\.(xlsx|xls)$/i.test(f.name)) {
        const XLSX = await import('xlsx');
        const wb = XLSX.read(await readFileBuffer(f), { type: 'array', cellDates: true });
        rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: '' });
      } else {
        const raw = (await readFileText(f)).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'); // BOM + mixed line endings
        const parsed = Papa.parse<Record<string, unknown>>(raw, { header: true, skipEmptyLines: true });
        rows = parsed.data;
      }
      if (rows.length === 0) { setErr('The file has no rows.'); return; }
      setPlan(planImport(rows, data));
    } catch { setErr('Could not read this file. Use a CSV or Excel (.xlsx) file.'); }
    if (fileRef.current) fileRef.current.value = '';
  };

  const apply = async () => {
    if (!plan) return;
    await addTransactions(plan.transactions, plan.newCategories);
    toast(`Imported ${plan.transactions.length} transactions`);
    setPlan(null);
  };

  return (
    <>
      <PageHeader title="Import / export" backButton />
      <div className="stack">
        <div className="card stack">
          <div><h2>Export transactions</h2><p className="muted small" style={{ marginTop: 4 }}>Opens in Excel or Google Sheets. For a full backup of budgets, goals and settings use Backup & restore.</p></div>
          <div className="row wrap"><button className="btn" onClick={exportCsv}><Download size={18} /> CSV</button><button className="btn" onClick={exportXlsx}><FileSpreadsheet size={18} /> Excel (.xlsx)</button></div>
        </div>
        <div className="card stack">
          <div><h2>Import transactions</h2>
            <p className="muted small" style={{ marginTop: 4 }}>Columns: <b>Date, Type, Amount, Category</b> (and optionally Subcategory, Payment Method, Need/Want, Note). Dates like 2026-11-03 or 03/11/2026. Rows already in the app are skipped, and new categories are created automatically.</p></div>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,text/csv" className="sr" onChange={(e) => onPick(e.target.files?.[0])} />
          <div className="row wrap"><button className="btn" onClick={() => fileRef.current?.click()}><Upload size={18} /> Choose file</button><button className="btn" onClick={template}>Get template</button></div>
          {err && <div className="notice bad">{err}</div>}
        </div>
      </div>
      {plan && (
        <Sheet title="Review import" onClose={() => setPlan(null)}
          footer={<><button className="btn" onClick={() => setPlan(null)}>Cancel</button><button className="btn primary" onClick={apply} disabled={plan.transactions.length === 0}>Import {plan.transactions.length}</button></>}>
          <div>
            <div className="kv"><span>Ready to import</span><b>{plan.transactions.length}</b></div>
            <div className="kv"><span>Already in the app (skipped)</span><b>{plan.duplicates}</b></div>
            <div className="kv"><span>Rows with problems (skipped)</span><b style={plan.errors.length ? { color: 'var(--red)' } : undefined}>{plan.errors.length}</b></div>
            <div className="kv"><span>New categories to create</span><b>{plan.newCategories.length}</b></div>
          </div>
          {plan.newCategories.length > 0 && <div className="help">New: {plan.newCategories.slice(0, 8).map((c) => c.name).join(', ')}{plan.newCategories.length > 8 ? '…' : ''}</div>}
          {plan.errors.length > 0 && <div className="notice bad">{plan.errors.slice(0, 5).map((e) => <div key={e.row}>Row {e.row}: {e.message}</div>)}{plan.errors.length > 5 && <div>…and {plan.errors.length - 5} more</div>}</div>}
        </Sheet>
      )}
    </>
  );
}

/* ---------------- About / privacy / reset ---------------- */
function About() {
  const { data, confirm } = useApp();
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState('');
  const counts = useMemo(() => countsOf(data), [data]);
  return (
    <>
      <PageHeader title="Privacy, about & reset" backButton />
      <div className="stack">
        <div className="card stack">
          <div className="row"><div className="logo">₹</div><div><h2>Rupee Routine</h2><div className="muted small">Money Made Simple · Version 1.0.0</div></div></div>
          <p>Track your money. Plan your budget. Build your savings.</p>
          <div className="divider" style={{ margin: 0 }} />
          <div className="stack" style={{ gap: 8 }}>
            <b>Your privacy</b>
            <p className="muted small">• Everything is stored only on this device. There is no account, no login and no cloud.</p>
            <p className="muted small">• The app has no servers and sends nothing anywhere. It works fully offline.</p>
            <p className="muted small">• It never asks for bank account numbers, card numbers or UPI IDs.</p>
            <p className="muted small">• Web and Android each keep their own data. Move data yourself with Backup & restore.</p>
          </div>
        </div>
        <div className="card stack">
          <h2 style={{ color: 'var(--red)' }}>Delete all data</h2>
          <p className="muted small">Removes all {counts.transactions} transactions, budgets, categories, goals and settings from this device. This cannot be undone. Make a backup first if you might need it.</p>
          <button className="btn danger" onClick={async () => { if (await confirm({ title: 'Delete everything?', message: 'You will be asked to type DELETE on the next step.', confirmLabel: 'Continue', danger: true })) setOpen(true); }}><Trash2 size={18} /> Delete all my data</button>
        </div>
      </div>
      {open && (
        <Sheet title="Type DELETE to confirm" onClose={() => setOpen(false)}
          footer={<><button className="btn" onClick={() => setOpen(false)}>Cancel</button><button className="btn danger" disabled={word.trim().toUpperCase() !== 'DELETE'} onClick={async () => { await resetAll(); setOpen(false); go('/home'); }}>Delete everything</button></>}>
          <div className="notice bad">All data on this device will be permanently erased and the app returns to first-time setup.</div>
          <input className="input" placeholder="DELETE" value={word} onChange={(e) => setWord(e.target.value)} autoFocus aria-label="Type DELETE" />
        </Sheet>
      )}
    </>
  );
}
