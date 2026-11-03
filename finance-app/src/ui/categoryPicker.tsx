import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import type { Category, CategoryKind, ID } from '../core/types';
import { addDays } from '../core/dates';
import { newRecord, save } from '../data/repo';
import { useApp } from './app';

/**
 * Shows EVERY group, category and subcategory for the chosen kind (nothing is hidden behind "more"),
 * with a "Frequently used" row on top, search, and inline "+ New" to add a category or subcategory on the spot.
 */
export function CategoryPicker({ kind, value, onPick }: { kind: CategoryKind; value: ID | null; onPick: (id: ID) => void }) {
  const { data, today, toast } = useApp();
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState<{ groupId: ID | null; parentId: ID | null } | null>(null);
  const [name, setName] = useState('');

  const cats = useMemo(() => data.categories.filter((c) => c.kind === kind), [data.categories, kind]);
  const roots = useMemo(() => cats.filter((c) => !c.parentId).sort((a, b) => a.sort - b.sort), [cats]);
  const subsOf = (id: ID) => cats.filter((c) => c.parentId === id).sort((a, b) => a.sort - b.sort);
  const byId = useMemo(() => new Map(data.categories.map((c) => [c.id, c])), [data.categories]);
  const selected = value ? byId.get(value) : undefined;
  const selectedRoot = selected ? selected.parentId ?? selected.id : null;

  const usage = useMemo(() => {
    const cutoff = addDays(today, -120);
    const m = new Map<ID, number>();
    for (const t of data.transactions) {
      if (t.date < cutoff || !t.categoryId) continue;
      const c = byId.get(t.categoryId);
      if (c && c.kind === kind) m.set(c.id, (m.get(c.id) ?? 0) + 1);
    }
    return m;
  }, [data.transactions, byId, today, kind]);
  const frequent = useMemo(() => [...cats].filter((c) => usage.get(c.id)).sort((a, b) => (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0)).slice(0, 6), [cats, usage]);

  const groups = useMemo(() => {
    if (kind === 'income') return [{ id: null as ID | null, name: 'Income', icon: '💼', cats: roots }];
    const list = [...data.groups].sort((a, b) => a.sort - b.sort).map((g) => ({ id: g.id as ID | null, name: g.name, icon: g.icon, cats: roots.filter((c) => c.groupId === g.id) }));
    const known = new Set(data.groups.map((g) => g.id));
    const loose = roots.filter((c) => !c.groupId || !known.has(c.groupId));
    if (loose.length) list.push({ id: null, name: 'No group', icon: '📂', cats: loose });
    // Hide groups that exist only for the other kind (e.g. an expense-only group while picking savings), but keep empty ones so you can add.
    const hasOther = (gid: ID | null) => gid !== null && data.categories.some((c) => c.groupId === gid && c.kind !== kind && !c.parentId);
    return list.filter((g) => g.cats.length > 0 || !hasOther(g.id) || kind === 'expense');
  }, [data.groups, data.categories, roots, kind]);

  const ql = q.trim().toLowerCase();
  const matches = (c: Category) => !ql || c.name.toLowerCase().includes(ql);

  const create = async () => {
    const nm = name.trim();
    if (!nm || !adding) return;
    const parent = adding.parentId ? byId.get(adding.parentId) : undefined;
    const sort = Math.max(0, ...data.categories.map((c) => c.sort)) + 1;
    const rec: Category = {
      ...newRecord(), name: nm, kind, groupId: kind === 'income' ? null : parent ? parent.groupId ?? null : adding.groupId, parentId: parent?.id ?? null,
      icon: parent?.icon ?? (kind === 'income' ? '💼' : kind === 'savings' ? '🐷' : '📦'), behavior: parent?.behavior ?? 'flexible', defaultNeed: parent?.defaultNeed ?? null, goalId: null, sort,
    } as Category;
    await save('categories', rec);
    toast(`Added ${parent ? parent.name + ' › ' : ''}${nm}`);
    setName(''); setAdding(null); setQ('');
    onPick(rec.id);
  };

  const Chip = ({ c, sub }: { c: Category; sub?: boolean }) => {
    const on = value === c.id;
    return (
      <button type="button" className={`chip ${on ? 'on' : ''} ${sub ? 'sub' : ''}`} onClick={() => onPick(c.id)} aria-pressed={on}>
        <span>{sub ? '↳' : c.icon}</span>{c.name}
      </button>
    );
  };
  const AddChip = ({ groupId, parentId, label }: { groupId: ID | null; parentId: ID | null; label: string }) => (
    <button type="button" className="chip add" onClick={() => { setAdding({ groupId, parentId }); setName(''); }}><Plus size={14} />{label}</button>
  );
  const isAdding = (groupId: ID | null, parentId: ID | null) => adding && adding.groupId === groupId && adding.parentId === parentId;
  const AddForm = ({ placeholder }: { placeholder: string }) => (
    <div className="row" style={{ marginTop: 8 }}>
      <input className="input" autoFocus placeholder={placeholder} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void create(); } }} aria-label={placeholder} />
      <button type="button" className="btn sm primary" onClick={create} disabled={!name.trim()}>Add</button>
      <button type="button" className="btn sm" onClick={() => setAdding(null)}>Cancel</button>
    </div>
  );

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: 15, color: 'var(--muted)' }} />
        <input className="input" style={{ paddingLeft: 36 }} placeholder={`Search ${kind === 'income' ? 'income types' : kind === 'savings' ? 'savings' : 'categories'}`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search categories" />
      </div>

      {!ql && frequent.length > 0 && (
        <div>
          <div className="lbl-s" style={{ marginBottom: 6 }}>Frequently used</div>
          <div className="chips">{frequent.map((c) => <Chip key={c.id} c={c} />)}</div>
        </div>
      )}

      {groups.map((g) => {
        const visible = g.cats.filter((c) => matches(c) || subsOf(c.id).some(matches));
        if (ql && visible.length === 0) return null;
        return (
          <div key={g.id ?? 'none'} data-group={g.name}>
            {kind !== 'income' && <div className="lbl-s" style={{ marginBottom: 6 }}>{g.icon} {g.name}</div>}
            <div className="chips">
              {visible.map((c) => {
                const subs = subsOf(c.id);
                return (
                  <span key={c.id} style={{ display: 'contents' }}>
                    <Chip c={c} />
                    {subs.filter((s) => !ql || matches(s) || matches(c)).map((s) => <Chip key={s.id} c={s} sub />)}
                    {!ql && selectedRoot === c.id && !isAdding(c.groupId ?? null, c.id) && <AddChip groupId={g.id} parentId={c.id} label={`Sub of ${c.name}`} />}
                  </span>
                );
              })}
              {!ql && !isAdding(g.id, null) && <AddChip groupId={g.id} parentId={null} label={kind === 'income' ? 'New income type' : 'New'} />}
            </div>
            {adding && adding.groupId === g.id && !adding.parentId && <AddForm placeholder={kind === 'income' ? 'New income type' : `New category in ${g.name}`} />}
            {adding?.parentId && visible.some((c) => c.id === adding.parentId) && <AddForm placeholder={`New subcategory of ${byId.get(adding.parentId)?.name ?? ''}`} />}
          </div>
        );
      })}
      {ql && groups.every((g) => g.cats.filter((c) => matches(c) || subsOf(c.id).some(matches)).length === 0) && (
        <div className="muted small">
          No match for “{q.trim()}”.{' '}
          <button type="button" className="link" style={{ color: 'var(--primary)', fontWeight: 700 }} onClick={async () => {
            const g = groups[0];
            const rec: Category = { ...newRecord(), name: q.trim(), kind, groupId: kind === 'income' ? null : g?.id ?? null, parentId: null, icon: '📦', behavior: 'flexible', defaultNeed: null, goalId: null, sort: Math.max(0, ...data.categories.map((c) => c.sort)) + 1 } as Category;
            await save('categories', rec); toast(`Added ${rec.name}`); setQ(''); onPick(rec.id);
          }}>Create “{q.trim()}”</button>
        </div>
      )}
    </div>
  );
}
