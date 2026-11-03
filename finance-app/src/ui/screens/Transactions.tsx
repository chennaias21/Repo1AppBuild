import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Transaction } from '../../core/types';
import { inPeriod, dayHeading } from '../../core/dates';
import { formatINR } from '../../core/money';
import { Empty, Segmented } from '../components';
import { PageHeader } from '../page';
import { updateSettings } from '../../data/repo';
import { useApp } from '../app';

type Filter = 'all' | 'expense' | 'income' | 'transfer';

export function Transactions() {
  const { data, cur, today, openSheet } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [scope, setScope] = useState<'month' | 'all'>('month');
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const catMap = useMemo(() => new Map(data.categories.map((c) => [c.id, c])), [data.categories]);
  const pmMap = useMemo(() => new Map(data.paymentMethods.map((p) => [p.id, p])), [data.paymentMethods]);
  const goalMap = useMemo(() => new Map(data.goals.map((g) => [g.id, g])), [data.goals]);

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return data.transactions
      .filter((t) => (scope === 'all' ? true : inPeriod(t.date, cur.period)))
      .filter((t) => filter === 'all' || t.type === filter)
      .filter((t) => {
        if (!catFilter) return true;
        const c = t.categoryId ? catMap.get(t.categoryId) : undefined;
        return !!c && (c.id === catFilter || c.parentId === catFilter);
      })
      .filter((t) => {
        if (!ql) return true;
        const c = t.categoryId ? catMap.get(t.categoryId) : undefined;
        return `${t.note ?? ''} ${c?.name ?? ''} ${t.amount / 100}`.toLowerCase().includes(ql);
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  }, [data.transactions, scope, filter, q, catFilter, cur.period, catMap]);

  const groups = useMemo(() => {
    const m = new Map<string, Transaction[]>();
    for (const t of rows) m.set(t.date, [...(m.get(t.date) ?? []), t]);
    return [...m.entries()];
  }, [rows]);

  const describe = (t: Transaction) => {
    const c = t.categoryId ? catMap.get(t.categoryId) : undefined;
    const parent = c?.parentId ? catMap.get(c.parentId) : undefined;
    if (t.type === 'transfer') {
      if (t.transferKind === 'cardBill') return { icon: '🧾', title: 'Card bill payment', sub: [pmMap.get(t.paymentMethodId ?? '')?.name, 'settles dues, not an expense', t.note].filter(Boolean).join(' · ') };
      const g = t.goalId ? goalMap.get(t.goalId) : undefined;
      return { icon: c?.icon ?? '🐷', title: `Saved → ${g?.name ?? c?.name ?? 'Savings'}`, sub: t.note || 'Savings transfer' };
    }
    return {
      icon: c?.icon ?? '❔', title: parent ? `${parent.name} › ${c!.name}` : c?.name ?? 'Uncategorised',
      sub: [pmMap.get(t.paymentMethodId ?? '')?.name, t.note].filter(Boolean).join(' · '),
    };
  };

  const totals = useMemo(() => {
    let inc = 0, exp = 0, sav = 0;
    for (const t of rows) {
      if (t.type === 'income') inc += t.amount;
      else if (t.type === 'expense') exp += t.amount;
      else if (t.transferKind === 'savings') sav += t.amount;
    }
    return { inc, exp, sav };
  }, [rows]);

  const cats = data.categories.filter((c) => !c.parentId).sort((a, b) => a.sort - b.sort);

  return (
    <>
      <PageHeader title="Transactions" months={scope === 'month'} right={(data.settings.uiScale ?? 1) !== 1 ? <button className="btn sm" onClick={() => updateSettings({ uiScale: 1 })}>Reset size</button> : undefined} />
      <div className="stack">
        <div className="card tight stack" style={{ gap: 10 }}>
          <div className="row">
            <div className="grow" style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 15, color: 'var(--muted)' }} />
              <input className="input" style={{ paddingLeft: 36 }} placeholder="Search note or category" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search transactions" />
            </div>
          </div>
          <Segmented value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, { value: 'expense', label: 'Expenses' }, { value: 'income', label: 'Income' }, { value: 'transfer', label: 'Transfers' }]} />
          <div className="row">
            <select className="select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Filter by category">
              <option value="">All categories</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            <Segmented value={scope} onChange={setScope} options={[{ value: 'month', label: 'This month' }, { value: 'all', label: 'All time' }]} />
          </div>
          <div className="row between small">
            <span><span className="muted">In</span> <b className="num" style={{ color: 'var(--green)' }}>{formatINR(totals.inc)}</b></span>
            <span><span className="muted">Spent</span> <b className="num">{formatINR(totals.exp)}</b></span>
            <span><span className="muted">Saved</span> <b className="num" style={{ color: 'var(--blue)' }}>{formatINR(totals.sav)}</b></span>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="card"><Empty emoji="🧾" title="No transactions here" text={q || filter !== 'all' || catFilter ? 'Try clearing the filters.' : 'Tap + to add your first one.'} /></div>
        ) : groups.map(([date, list]) => {
          const dayExp = list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          return (
            <div key={date}>
              <div className="day-head"><span>{dayHeading(date, today)}</span>{dayExp > 0 && <span className="num">{formatINR(dayExp)}</span>}</div>
              <div className="card tight"><div className="list">
                {list.map((t) => {
                  const d = describe(t);
                  return (
                    <button className="item" key={t.id} onClick={() => openSheet({ kind: 'txn', edit: t })}>
                      <div className="emoji">{d.icon}</div>
                      <div className="grow">
                        <div className="title truncate">{d.title}</div>
                        <div className="sub truncate">{d.sub}</div>
                      </div>
                      {t.type === 'expense' && pmMap.get(t.paymentMethodId ?? '')?.type === 'credit' && <span className="tag card">💳 Card</span>}
                      {t.type === 'expense' && t.need && <span className={`tag ${t.need}`}>{t.need === 'need' ? 'Need' : 'Want'}</span>}
                      <div className={`amt ${t.type === 'income' ? 'in' : t.type === 'transfer' ? 'xfer' : ''}`}>{t.type === 'income' ? '+' : t.type === 'transfer' ? '⇄ ' : '-'}{formatINR(t.amount)}</div>
                    </button>
                  );
                })}
              </div></div>
            </div>
          );
        })}
      </div>
    </>
  );
}
