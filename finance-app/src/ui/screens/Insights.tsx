import { useMemo } from 'react';
import { allGoalProgress, compare, healthScore } from '../../core/calc';
import { monthLabel, addMonths } from '../../core/dates';
import { formatINR } from '../../core/money';
import { Bar, Empty, Ring } from '../components';
import { NudgeCard, PageHeader } from '../page';
import { useApp } from '../app';

const delta = (cur: number, prev: number, goodWhenUp: boolean) => {
  const d = cur - prev;
  if (d === 0) return <span className="muted">–</span>;
  const good = goodWhenUp ? d > 0 : d < 0;
  return <span className={good ? 'down' : 'up'}>{d > 0 ? '▲' : '▼'} {formatINR(Math.abs(d))}</span>;
};

export function Insights() {
  const { data, cur, prev, nudges, monthKey, nowKey } = useApp();
  const goals = useMemo(() => allGoalProgress(data, nowKey), [data, nowKey]);
  const health = useMemo(() => healthScore(cur, goals, data.settings), [cur, goals, data.settings]);
  const cmp = useMemo(() => compare(cur, prev), [cur, prev]);
  const over = cur.expenseRows.filter((r) => r.status === 'over');
  const scoreColor = health.score >= 80 ? 'var(--green)' : health.score >= 60 ? 'var(--primary)' : health.score >= 40 ? 'var(--amber)' : 'var(--red)';
  const empty = cur.received === 0 && cur.spent === 0 && cur.saved === 0;
  const tips = health.parts.filter((p) => p.tip);
  const fmtRate = (r: number | null) => (r === null ? '–' : `${Math.round(r)}%`);

  return (
    <>
      <PageHeader title="Insights" months />
      <div className="stack">
        <div className="card">
          <div className="card-head"><h2>Financial health</h2><span className="muted small">{monthLabel(monthKey)}</span></div>
          <div className="row" style={{ gap: 18, alignItems: 'center' }}>
            <Ring pct={health.score} size={112} stroke={12} color={scoreColor}><b className="num" style={{ fontSize: 30, display: 'block', lineHeight: 1 }}>{health.score}</b><span className="muted" style={{ fontSize: 11, fontWeight: 600 }}>/ 100</span></Ring>
            <div className="grow"><div className="mid" style={{ color: scoreColor }}>{health.label}</div>
              <p className="muted small" style={{ marginTop: 4 }}>{empty ? 'Add some entries for a meaningful score.' : tips.length === 0 ? 'Nothing to fix. Great month!' : `${tips.length} thing${tips.length === 1 ? '' : 's'} could improve below.`}</p></div>
          </div>
          <div className="divider" />
          <div className="stack" style={{ gap: 12 }}>
            {health.parts.map((p) => (
              <div key={p.key}>
                <div className="row between small"><b>{p.label}</b><span className="num muted">{Math.round(p.score)} / {p.max}</span></div>
                <div style={{ marginTop: 5 }}><Bar pct={(p.score / p.max) * 100} status={p.score / p.max >= 0.8 ? 'onTrack' : p.score / p.max >= 0.5 ? 'watch' : 'over'} thin /></div>
                {p.tip && <div className="help" style={{ marginTop: 4 }}>💡 {p.tip}</div>}
              </div>
            ))}
          </div>
        </div>

        {nudges.length > 0 && (
          <div className="card">
            <div className="card-head"><h2>Suggestions</h2></div>
            <div className="stack" style={{ gap: 10 }}>{nudges.map((n) => <NudgeCard key={n.id} n={n} />)}</div>
          </div>
        )}

        <div className="card">
          <div className="card-head"><h2>Monthly review</h2><span className="muted small">vs {monthLabel(addMonths(monthKey, -1), false)}</span></div>
          {empty && prev.spent === 0 && prev.received === 0 ? <Empty emoji="📅" title="Nothing to review yet" text="Once you have a full month of entries, you’ll see how it compares with the last." /> : (
            <>
              <table className="table">
                <thead><tr><th></th><th>{monthLabel(monthKey, false)}</th><th>{monthLabel(addMonths(monthKey, -1), false)}</th><th>Change</th></tr></thead>
                <tbody>
                  <tr><td>Income</td><td>{formatINR(cmp.received.cur)}</td><td>{formatINR(cmp.received.prev)}</td><td>{delta(cmp.received.cur, cmp.received.prev, true)}</td></tr>
                  <tr><td>Saved & invested</td><td>{formatINR(cmp.saved.cur)}</td><td>{formatINR(cmp.saved.prev)}</td><td>{delta(cmp.saved.cur, cmp.saved.prev, true)}</td></tr>
                  <tr><td>Expenses</td><td>{formatINR(cmp.spent.cur)}</td><td>{formatINR(cmp.spent.prev)}</td><td>{delta(cmp.spent.cur, cmp.spent.prev, false)}</td></tr>
                  <tr><td>Savings rate</td><td>{fmtRate(cmp.rate.cur)}</td><td>{fmtRate(cmp.rate.prev)}</td><td>{cmp.rate.cur !== null && cmp.rate.prev !== null ? <span className={cmp.rate.cur >= cmp.rate.prev ? 'down' : 'up'}>{cmp.rate.cur >= cmp.rate.prev ? '▲' : '▼'} {Math.abs(Math.round(cmp.rate.cur - cmp.rate.prev))} pts</span> : '–'}</td></tr>
                </tbody>
              </table>

              <div className="divider" />
              <div className="row between"><b>Unused budget</b><b className="num" style={{ color: 'var(--green)' }}>{formatINR(cur.unusedBudget)}</b></div>
              <p className="help">{cur.isCurrent ? 'Still available this month. Consider moving some to a goal.' : 'Left over from planned spending. Next time, move it to a goal.'}</p>

              {over.length > 0 && (
                <>
                  <div className="divider" />
                  <b>Overspent categories</b>
                  <div className="list" style={{ marginTop: 6 }}>
                    {over.map((r) => <div className="item" key={r.category.id}><div className="emoji">{r.category.icon}</div><div className="grow"><div className="title">{r.category.name}</div><div className="sub">{formatINR(r.spent)} vs {formatINR(r.budget)} limit</div></div><b className="up num">+{formatINR(r.spent - r.budget)}</b></div>)}
                  </div>
                </>
              )}

              {cmp.categories.length > 0 && (
                <>
                  <div className="divider" />
                  <b>Biggest changes by category</b>
                  <div className="list" style={{ marginTop: 6 }}>
                    {cmp.categories.slice(0, 5).map((c) => (
                      <div className="item" key={c.id}><div className="grow"><div className="title">{c.name}</div><div className="sub num">{formatINR(c.cur)} now · {formatINR(c.prev)} before</div></div>
                        <b className={`num ${c.delta > 0 ? 'up' : 'down'}`}>{c.delta > 0 ? '+' : '-'}{formatINR(Math.abs(c.delta))}</b></div>
                    ))}
                  </div>
                </>
              )}

              {goals.length > 0 && (
                <>
                  <div className="divider" />
                  <b>Goal progress</b>
                  <div className="stack" style={{ gap: 10, marginTop: 8 }}>
                    {goals.map(({ goal, progress }) => (
                      <div key={goal.id}>
                        <div className="row between small"><span>{goal.icon} {goal.name}</span><span className="num muted">{Math.round(progress.pct)}%</span></div>
                        <div style={{ marginTop: 4 }}><Bar pct={progress.pct} status={progress.status === 'offTrack' || progress.status === 'overdue' ? 'watch' : 'onTrack'} thin /></div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
