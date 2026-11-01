import { Pencil, Plus } from 'lucide-react';
import type { Category } from '../../core/types';
import type { CategoryRow } from '../../core/calc';
import { formatINR, pct } from '../../core/money';
import { Bar } from '../components';
import { PageHeader } from '../page';
import { useApp } from '../app';

export function Budget() {
  const { data, cur, openSheet } = useApp();
  const rows = new Map<string, CategoryRow>();
  for (const r of [...cur.expenseRows, ...cur.savingsRows]) rows.set(r.category.id, r);
  const groupIds = new Set(data.groups.map((g) => g.id));
  const sections = [
    ...[...data.groups].sort((a, b) => a.sort - b.sort).map((g) => ({ id: g.id as string | null, name: g.name, icon: g.icon, group: g, cats: [] as Category[] })),
    { id: null as string | null, name: 'No group', icon: '📂', group: null, cats: [] as Category[] },
  ];
  for (const c of data.categories) {
    if (c.parentId || c.kind === 'income') continue;
    const s = sections.find((x) => (c.groupId && groupIds.has(c.groupId) ? x.id === c.groupId : x.id === null))!;
    s.cats.push(c);
  }
  for (const s of sections) s.cats.sort((a, b) => a.sort - b.sort);
  const visible = sections.filter((s) => s.group || s.cats.length > 0);

  return (
    <>
      <PageHeader title="Budget" months right={<button className="btn sm primary" onClick={() => openSheet({ kind: 'category' })}><Plus size={16} /> Category</button>} />
      <div className="stack">
        <div className="card">
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12 }}>
            <Stat label="Monthly salary" value={formatINR(data.settings.salary)} />
            <Stat label="Planned spending" value={formatINR(cur.spendBudget)} />
            <Stat label="Planned savings" value={formatINR(cur.savingsPlanned)} />
            <Stat label={cur.unallocated < 0 ? 'Over-planned by' : 'Not yet planned'} value={formatINR(Math.abs(cur.unallocated))} tone={cur.unallocated < 0 ? 'red' : cur.unallocated >= 100000 ? 'amber' : 'green'} />
          </div>
          {cur.unallocated >= 100000 && <p className="help" style={{ marginTop: 10 }}>Give every rupee a job: assign the remaining amount to a budget or a goal.</p>}
          {cur.unallocated < 0 && <p className="err" style={{ marginTop: 10 }}>Your plan adds up to more than your salary. Reduce a budget or a goal contribution.</p>}
        </div>

        {visible.map((s) => {
          const planned = s.cats.reduce((a, c) => a + (rows.get(c.id)?.budget ?? 0), 0);
          const actual = s.cats.reduce((a, c) => a + (rows.get(c.id)?.spent ?? 0), 0);
          return (
            <div className="card" key={s.id ?? 'none'}>
              <div className="card-head">
                <div className="row"><span style={{ fontSize: 20 }}>{s.icon}</span><div><h2>{s.name}</h2><div className="muted small num">{formatINR(actual)} of {formatINR(planned)}</div></div></div>
                <div className="row" style={{ gap: 2 }}>
                  <button className="icon-btn" aria-label={`Add category to ${s.name}`} onClick={() => openSheet({ kind: 'category', defaults: { groupId: s.id, kind: /saving/i.test(s.name) ? 'savings' : 'expense' } })}><Plus size={18} /></button>
                  {s.group && <button className="icon-btn" aria-label={`Edit ${s.name}`} onClick={() => openSheet({ kind: 'group', edit: s.group! })}><Pencil size={16} /></button>}
                </div>
              </div>
              {s.cats.length === 0 ? <p className="muted small">No categories yet.</p> : (
                <div className="list">
                  {s.cats.map((c) => {
                    const r = rows.get(c.id)!;
                    const isSave = c.kind === 'savings';
                    return (
                      <button key={c.id} className="item" style={{ alignItems: 'flex-start' }} onClick={() => openSheet({ kind: 'category', edit: c })}>
                        <div className="emoji">{c.icon}</div>
                        <div className="grow">
                          <div className="row between">
                            <span className="title truncate">{c.name}{c.behavior === 'fixed' && !isSave && <span className="tag" style={{ marginLeft: 8 }}>Fixed</span>}</span>
                            <span className="num small"><b>{formatINR(r.spent)}</b> <span className="muted">/ {r.budget > 0 ? formatINR(r.budget) : 'no limit'}</span></span>
                          </div>
                          {r.budget > 0 && <div style={{ marginTop: 7 }}><Bar pct={isSave ? pct(r.spent, r.budget) : r.pct} status={isSave ? 'onTrack' : r.status} thin /></div>}
                          {!isSave && r.status === 'over' && <div className="err" style={{ marginTop: 4 }}>{formatINR(r.spent - r.budget)} over limit</div>}
                          {!isSave && r.status === 'watch' && <div className="small" style={{ marginTop: 4, color: 'var(--amber)' }}>{Math.round(r.pct)}% used · {formatINR(r.remaining)} left</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        <button className="btn block" onClick={() => openSheet({ kind: 'group' })}><Plus size={18} /> New group</button>
        {cur.uncategorisedSpent > 0 && <p className="help">Includes {formatINR(cur.uncategorisedSpent)} of spending without a category.</p>}
      </div>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'red' | 'amber' | 'green' }) {
  return <div><div className="muted small">{label}</div><div className="mid num" style={tone ? { color: `var(--${tone})` } : undefined}>{value}</div></div>;
}
