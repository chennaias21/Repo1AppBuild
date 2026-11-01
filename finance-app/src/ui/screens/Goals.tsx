import { useMemo } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { allGoalProgress } from '../../core/calc';
import type { GoalStatus } from '../../core/types';
import { monthLabel } from '../../core/dates';
import { formatCompact, formatINR } from '../../core/money';
import { Bar, Empty, Ring } from '../components';
import { PageHeader } from '../page';
import { useApp } from '../app';

const STATUS: Record<GoalStatus, { label: string; cls: string }> = {
  complete: { label: 'Completed 🎉', cls: 'green' }, onTrack: { label: 'On track', cls: 'green' }, behind: { label: 'Slightly behind', cls: 'amber' },
  offTrack: { label: 'Off track', cls: 'red' }, overdue: { label: 'Past target date', cls: 'red' },
};

export function Goals() {
  const { data, nowKey, openSheet } = useApp();
  const goals = useMemo(() => allGoalProgress(data, nowKey), [data, nowKey]);
  const totalSaved = goals.reduce((s, g) => s + g.progress.saved, 0);
  const totalTarget = goals.reduce((s, g) => s + g.progress.target, 0);

  return (
    <>
      <PageHeader title="Goals" right={<button className="btn sm primary" onClick={() => openSheet({ kind: 'goal' })}><Plus size={16} /> New goal</button>} />
      <div className="stack">
        {goals.length === 0 ? (
          <div className="card"><Empty emoji="🎯" title="No goals yet" text="Emergency fund, travel, a vehicle, a home: add as many as you like.">
            <button className="btn primary" onClick={() => openSheet({ kind: 'goal' })}><Plus size={18} /> Add a goal</button></Empty></div>
        ) : (
          <>
            <div className="card">
              <div className="row between"><div><div className="muted small">Saved across all goals</div><div className="mid num">{formatINR(totalSaved)}</div></div>
                <div style={{ textAlign: 'right' }}><div className="muted small">Total target</div><div className="mid num">{formatCompact(totalTarget)}</div></div></div>
              <div style={{ marginTop: 10 }}><Bar pct={totalTarget ? (totalSaved / totalTarget) * 100 : 0} /></div>
            </div>
            <div className="grid cols">
              {goals.map(({ goal, progress: p }) => {
                const st = STATUS[p.status];
                const linked = data.categories.find((c) => c.goalId === goal.id);
                return (
                  <div className="card" key={goal.id}>
                    <div className="row between" style={{ alignItems: 'flex-start' }}>
                      <div className="row"><div className="emoji">{goal.icon}</div>
                        <div><h2>{goal.name}</h2><div className="row" style={{ gap: 6, marginTop: 3 }}><span className={`pill ${st.cls}`}>{st.label}</span><span className="tag">{goal.priority === 'high' ? 'High' : goal.priority === 'medium' ? 'Medium' : 'Low'}</span></div></div></div>
                      <button className="icon-btn" aria-label={`Edit ${goal.name}`} onClick={() => openSheet({ kind: 'goal', edit: goal })}><Pencil size={17} /></button>
                    </div>
                    <div className="row" style={{ marginTop: 16, gap: 16 }}>
                      <Ring pct={p.pct} size={84} stroke={10} color={p.status === 'offTrack' || p.status === 'overdue' ? 'var(--amber)' : 'var(--green)'}><span className="num" style={{ fontSize: 16 }}>{Math.round(p.pct)}%</span></Ring>
                      <div className="grow">
                        <div className="num"><b style={{ fontSize: 20 }}>{formatINR(p.saved)}</b> <span className="muted small">of {formatINR(p.target)}</span></div>
                        <div className="muted small">{formatINR(p.remaining)} to go{goal.targetDate ? ` · by ${monthLabel(goal.targetDate)}` : ''}</div>
                      </div>
                    </div>
                    <div className="divider" />
                    <div className="stack" style={{ gap: 0 }}>
                      <div className="kv"><span className="muted">Planned each month</span><b className="num">{formatINR(goal.monthlyContribution)}</b></div>
                      {p.requiredMonthly !== null && p.status !== 'complete' && <div className="kv"><span className="muted">Needed each month</span><b className="num">{formatINR(p.requiredMonthly)}</b></div>}
                      {p.projectedMonth && p.status !== 'complete' && <div className="kv"><span className="muted">At current plan, done by</span><b>{monthLabel(p.projectedMonth)}</b></div>}
                    </div>
                    {(p.status === 'offTrack' || p.status === 'behind' || p.status === 'overdue') && p.gapMonthly > 0 && (
                      <p className="help" style={{ marginTop: 8 }}>Short by {formatINR(p.gapMonthly)} a month. Options: save more, move the date{p.projectedMonth ? ` to ${monthLabel(p.projectedMonth)}` : ''}, or lower the target.</p>
                    )}
                    {goal.description && <p className="muted small" style={{ marginTop: 8 }}>{goal.description}</p>}
                    <button className="btn block" style={{ marginTop: 12 }} onClick={() => openSheet({ kind: 'txn', init: { type: 'save', categoryId: linked?.id ?? null } })}><Plus size={16} /> Add money</button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
