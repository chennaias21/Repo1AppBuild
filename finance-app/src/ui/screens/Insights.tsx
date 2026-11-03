import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import { allGoalProgress, savingsRate } from '../../core/calc';
import { categoryShares, emergencyCoverage, monthlyTrend, observe, spentUpTo, type Observation } from '../../core/analysis';
import { cardSummaries } from '../../core/cards';
import { addMonths, monthLabel } from '../../core/dates';
import { formatCompact, formatINR, pct } from '../../core/money';
import { PALETTE, Bar, ChartLegend, Donut, Empty, PlanBar, Ring, TrendChart } from '../components';
import { PageHeader } from '../page';
import { useApp } from '../app';
import { go } from '../router';
import { cardTone, dueText } from './Cards';
import { CARD_STATUS_LABEL } from '../../core/cards';

export function Insights() {
  const { data, cur, prev, monthKey, nowKey, today, openSheet } = useApp();
  const goals = useMemo(() => allGoalProgress(data, monthKey), [data, monthKey]);
  const obs = useMemo(() => observe(data, monthKey, today, cur, prev), [data, monthKey, today, cur, prev]);
  const { health, comparison: cmp } = obs;
  const trend = useMemo(() => monthlyTrend(data, monthKey, today, 6), [data, monthKey, today]);
  const shares = useMemo(() => categoryShares(cur), [cur]);
  const cover = useMemo(() => emergencyCoverage(data, today, monthKey), [data, today, monthKey]);
  const cards = useMemo(() => cardSummaries(data, today).filter((c) => c.outstanding > 0 || c.spentTotal > 0), [data, today]);
  const prevPoint = useMemo(() => (cur.isCurrent ? spentUpTo(data, prev.period.key, cur.elapsed) : prev.spent), [data, prev, cur]);

  const rate = savingsRate(cur);
  const target = data.settings.targetSavingsRate;
  const empty = cur.received === 0 && cur.spent === 0 && cur.saved === 0;
  const left = cur.received - cur.spent - cur.saved;
  const scoreColor = health.score >= 80 ? 'var(--green)' : health.score >= 60 ? 'var(--primary)' : health.score >= 40 ? 'var(--amber)' : 'var(--red)';
  const over = cur.expenseRows.filter((r) => r.status === 'over');
  const rows = shares.slice(0, 8);
  const prevByCat = new Map(prev.expenseRows.map((r) => [r.category.id, r.spent]));
  const trendPts = trend.map((t) => ({ label: monthLabel(t.key, false).slice(0, 3), income: t.received, spent: t.spent, saved: t.saved, current: t.key === monthKey }));
  const filled = trend.filter((t) => t.spent > 0 || t.received > 0);
  const avgSpend = filled.length ? Math.round(filled.reduce((a, t) => a + t.spent, 0) / filled.length) : 0;
  const donut = shares.slice(0, 6).map((s, i) => ({ value: s.spent, color: PALETTE[i % PALETTE.length] }));

  const act = (o: Observation) => {
    const a = o.action;
    if (!a) return;
    if (a.kind === 'goto') go(a.to);
    else if (a.kind === 'salary') openSheet({ kind: 'txn', init: { type: 'income', amount: a.amount, note: 'Salary' } });
    else openSheet({ kind: 'txn', init: { type: 'save', amount: a.amount, categoryId: a.categoryId ?? null } });
  };

  return (
    <>
      <PageHeader title="Insights" months />
      <div className="stack">
        {/* ---------- 1. Summary ---------- */}
        <div className="card">
          <div className="card-head"><h2>{monthLabel(monthKey)} at a glance</h2></div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            <Stat label="Income" value={cur.received} color="var(--blue)" />
            <Stat label="Expenses" value={cur.spent} color="var(--orange)" />
            <Stat label="Savings" value={cur.saved} color="var(--green)" />
          </div>
          <div className="divider" />
          <div className="row between small"><b>{left >= 0 ? 'Left over after expenses and savings' : 'Overspent by'}</b><b className="num" style={{ color: left < 0 ? 'var(--red)' : undefined }}>{formatINR(Math.abs(left))}</b></div>
          <div style={{ marginTop: 12 }}>
            <div className="row between small"><b>Savings rate</b><span className="num">{rate === null ? 'No income yet' : `${Math.round(rate)}%`} <span className="muted">· target {target}%</span></span></div>
            <div style={{ marginTop: 6 }}><Bar pct={rate === null ? 0 : (rate / Math.max(target, 1)) * 100} status={rate !== null && rate >= target ? 'onTrack' : rate !== null && rate >= target * 0.5 ? 'watch' : 'over'} marker={100} /></div>
            <div className="help" style={{ marginTop: 4 }}>The marker is your target. Savings rate = what you saved ÷ what you received.</div>
          </div>
        </div>

        {/* ---------- 2. Health + verdict ---------- */}
        <div className="grid cols">
          <div className="card">
            <div className="card-head"><h2>Financial health</h2></div>
            <div className="row" style={{ gap: 18 }}>
              <Ring pct={health.score} size={104} stroke={12} color={scoreColor}><b className="num" style={{ fontSize: 28, display: 'block', lineHeight: 1 }}>{health.score}</b><span className="muted" style={{ fontSize: 11, fontWeight: 600 }}>/ 100</span></Ring>
              <div className="grow"><div className="mid" style={{ color: scoreColor }}>{health.label}</div>
                <p className="muted small" style={{ marginTop: 4 }}>{empty ? 'Add a few entries for a meaningful score.' : 'Based on saving, budgeting, goals, needs vs wants and your emergency fund.'}</p></div>
            </div>
            <div className="stack" style={{ gap: 10, marginTop: 14 }}>
              {health.parts.map((p) => (
                <div key={p.key}>
                  <div className="row between small"><span>{p.label}</span><span className="num muted">{Math.round(p.score)} / {p.max}</span></div>
                  <div style={{ marginTop: 4 }}><Bar pct={(p.score / p.max) * 100} status={p.score / p.max >= 0.8 ? 'onTrack' : p.score / p.max >= 0.5 ? 'watch' : 'over'} thin /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h2>What your numbers say</h2></div>
            {empty ? <Empty emoji="📊" title="Nothing to analyse yet" text="Add income and expenses and your observations will appear here." /> : (
              <div className="stack" style={{ gap: 16 }}>
                <ObsList title="Going well" icon={<CheckCircle2 size={16} />} tone="green" items={obs.good} empty="Keep logging. Wins will show up here." />
                <ObsList title="Needs attention" icon={<AlertTriangle size={16} />} tone="amber" items={obs.improve} empty="Nothing needs attention right now." />
              </div>
            )}
          </div>
        </div>

        {/* ---------- 3. What to do next ---------- */}
        <div className="card">
          <div className="card-head"><h2>What to do next</h2><Lightbulb size={18} className="muted" /></div>
          <div className="stack" style={{ gap: 10 }}>
            {obs.next.map((o, i) => (
              <div className="nudge info" key={o.id}>
                <div className="ni" style={{ fontWeight: 800 }}>{i + 1}</div>
                <div className="grow"><b style={{ fontWeight: 600 }}>{o.text}</b>{o.action && <button className="btn sm act" onClick={() => act(o)}>{o.action.label}</button>}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- 4. Budget vs actual ---------- */}
        <div className="card">
          <div className="card-head"><h2>Budget vs actual</h2><button className="link" onClick={() => go('/budget')}>Edit budget</button></div>
          {cur.spendBudget === 0 ? <p className="muted">Set budgets to compare planned and actual spending.</p> : (
            <>
              <div className="row between"><div><div className="muted small">Spent</div><div className="mid num">{formatINR(cur.spent)}</div></div>
                <div style={{ textAlign: 'right' }}><div className="muted small">Planned</div><div className="mid num">{formatINR(cur.spendBudget)}</div></div></div>
              <div style={{ marginTop: 8 }}><Bar pct={pct(cur.spent, cur.spendBudget)} status={cur.spent > cur.spendBudget ? 'over' : pct(cur.spent, cur.spendBudget) >= data.settings.watchPct ? 'watch' : 'onTrack'} /></div>
              <div className="small" style={{ marginTop: 6, color: cur.budgetRemaining < 0 ? 'var(--red)' : 'var(--green)', fontWeight: 650 }}>{cur.budgetRemaining >= 0 ? `${formatINR(cur.budgetRemaining)} left in your budget` : `${formatINR(-cur.budgetRemaining)} over budget`}</div>
              <div className="stack" style={{ gap: 12, marginTop: 14 }}>
                {cur.groupRows.filter((g) => g.budget > 0 || g.spent > 0).map((g) => (
                  <div key={g.group.id}>
                    <div className="row between small"><span className="truncate">{g.group.icon} {g.group.name}</span><span className="num"><b>{formatINR(g.spent)}</b> <span className="muted">of {formatINR(g.budget)}</span></span></div>
                    <div style={{ marginTop: 4 }}><PlanBar planned={g.budget} actual={g.spent} /></div>
                  </div>
                ))}
              </div>
              {over.length > 0 && (
                <>
                  <div className="divider" />
                  <b className="small">Over budget</b>
                  <div className="list" style={{ marginTop: 4 }}>
                    {over.sort((a, b) => (b.spent - b.budget) - (a.spent - a.budget)).map((r) => (
                      <div className="item" key={r.category.id}><div className="emoji">{r.category.icon}</div><div className="grow"><div className="title">{r.category.name}</div><div className="sub num">{formatINR(r.spent)} vs {formatINR(r.budget)} limit</div></div><b className="up num">+{formatINR(r.spent - r.budget)}</b></div>
                    ))}
                  </div>
                </>
              )}
              <p className="help" style={{ marginTop: 8 }}>Unused budget: <b>{formatINR(cur.unusedBudget)}</b>{cur.isCurrent ? ' still available this month.' : ' left over.'}</p>
            </>
          )}
        </div>

        {/* ---------- 5. Category analysis ---------- */}
        <div className="card">
          <div className="card-head"><h2>Where your money goes</h2><span className="muted small">{formatINR(cur.spent)}</span></div>
          {shares.length === 0 ? <p className="muted">No expenses this month.</p> : (
            <>
              <div className="donut-wrap" style={{ marginBottom: 6 }}>
                <Donut slices={donut} size={120} stroke={18}><div className="num" style={{ fontWeight: 750, fontSize: 14 }}>{formatCompact(cur.spent)}</div></Donut>
                <p className="muted small grow" style={{ minWidth: 160 }}>
                  <b style={{ color: 'var(--text)' }}>{shares[0].name}</b> is your biggest cost at {Math.round(shares[0].share)}% of spending{shares[1] ? `, then ${shares[1].name} (${Math.round(shares[1].share)}%)` : ''}.
                </p>
              </div>
              <div className="list">
                {rows.map((r, i) => {
                  const before = r.id ? prevByCat.get(r.id) ?? 0 : 0;
                  const d = r.spent - before;
                  return (
                    <div className="item" key={r.id ?? 'none'} style={{ alignItems: 'flex-start' }}>
                      <i style={{ width: 10, height: 10, borderRadius: 3, background: PALETTE[i % PALETTE.length], marginTop: 8, flex: 'none', visibility: i < 6 ? 'visible' : 'hidden' }} />
                      <div className="grow">
                        <div className="row between"><span className="title truncate">{r.icon} {r.name}</span><span className="num"><b>{formatINR(r.spent)}</b> <span className="muted small">{Math.round(r.share)}%</span></span></div>
                        <div className="small muted row between" style={{ marginTop: 2 }}>
                          <span>{r.budget > 0 ? `${Math.round(pct(r.spent, r.budget))}% of ${formatCompact(r.budget)} budget` : 'No budget'}</span>
                          {d !== 0 ? <span style={{ color: d > 0 ? 'var(--red)' : 'var(--green)' }}>{d > 0 ? '▲' : '▼'} {formatCompact(Math.abs(d))} vs last month</span> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {shares.length > rows.length && <p className="help">+ {shares.length - rows.length} smaller categories</p>}
            </>
          )}
        </div>

        {/* ---------- 6. Trends ---------- */}
        <div className="card">
          <div className="card-head"><h2>Last 6 months</h2></div>
          {filled.length < 2 ? <p className="muted">Trends appear after your second month of entries.</p> : (
            <>
              <ChartLegend />
              <div style={{ marginTop: 8 }}><TrendChart points={trendPts} /></div>
              <div className="divider" />
              <div className="grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                <div><div className="muted small">Average monthly spend</div><div className="mid num">{formatCompact(avgSpend)}</div></div>
                <div><div className="muted small">This month vs {cur.isCurrent ? 'same point last month' : 'last month'}</div>
                  <div className="mid num" style={{ color: cur.spent > prevPoint ? 'var(--red)' : 'var(--green)' }}>{prevPoint > 0 ? `${cur.spent >= prevPoint ? '+' : '-'}${Math.round(Math.abs(cur.spent / prevPoint - 1) * 100)}%` : '–'}</div></div>
              </div>
              <div className="lbl-s" style={{ margin: '14px 0 6px' }}>Savings rate by month</div>
              <div className="row" style={{ gap: 6, alignItems: 'flex-end' }}>
                {trend.map((t) => (
                  <div key={t.key} style={{ flex: 1, textAlign: 'center' }}>
                    <div className="num small" style={{ fontWeight: 700, color: t.rate !== null && t.rate >= target ? 'var(--green)' : t.rate === null ? 'var(--muted)' : 'var(--text)' }}>{t.rate === null ? '–' : `${Math.round(t.rate)}%`}</div>
                    <div className="muted" style={{ fontSize: 10.5 }}>{monthLabel(t.key, false).slice(0, 3)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ---------- 7. Savings & goals ---------- */}
        <div className="card">
          <div className="card-head"><h2>Savings & goals</h2><button className="link" onClick={() => go('/goals')}>Open goals</button></div>
          <div className="row between small"><span>Planned saving this month</span><span className="num"><b>{formatINR(cur.saved)}</b> <span className="muted">of {formatINR(cur.savingsPlanned)}</span></span></div>
          <div style={{ marginTop: 6 }}><Bar pct={pct(cur.saved, cur.savingsPlanned)} status="onTrack" /></div>
          {goals.length > 0 && (
            <div className="stack" style={{ gap: 12, marginTop: 14 }}>
              {goals.map(({ goal, progress: p }) => (
                <div key={goal.id}>
                  <div className="row between small"><span className="truncate">{goal.icon} {goal.name}</span>
                    <span className={`pill ${p.status === 'complete' || p.status === 'onTrack' ? 'green' : p.status === 'behind' ? 'amber' : 'red'}`}>{p.status === 'complete' ? 'Done' : p.status === 'onTrack' ? 'On track' : p.status === 'behind' ? 'Behind' : p.status === 'overdue' ? 'Overdue' : 'Off track'}</span></div>
                  <div style={{ marginTop: 5 }}><Bar pct={p.pct} status={p.status === 'offTrack' || p.status === 'overdue' ? 'watch' : 'onTrack'} thin /></div>
                  <div className="help num" style={{ marginTop: 3 }}>{formatINR(p.saved)} of {formatINR(p.target)} ({Math.round(p.pct)}%){p.requiredMonthly !== null && p.status !== 'complete' ? ` · needs ${formatINR(p.requiredMonthly)}/month` : ''}</div>
                </div>
              ))}
            </div>
          )}
          {cover && <p className="help" style={{ marginTop: 10 }}>Your emergency fund covers about <b>{cover.months.toFixed(1)} months</b> of average spending ({formatCompact(cover.avgSpend)}/month).</p>}
        </div>

        {/* ---------- 8. Credit card liabilities ---------- */}
        {cards.length > 0 && (
          <div className="card">
            <div className="card-head"><h2>Credit card liabilities</h2><button className="link" onClick={() => go('/cards')}>Details</button></div>
            <div className="list">
              {cards.map((c) => (
                <div className="item" key={c.method.id}>
                  <div className="emoji">💳</div>
                  <div className="grow"><div className="title truncate">{c.method.name}</div><div className="sub">{dueText(c)}</div></div>
                  <div style={{ textAlign: 'right' }}><div className="amt">{formatINR(Math.max(0, c.outstanding))}</div><span className={`pill ${cardTone(c.status)}`} style={{ padding: '2px 8px', fontSize: 11 }}>{CARD_STATUS_LABEL[c.status]}</span></div>
                </div>
              ))}
            </div>
            <p className="help">Money you owe, shown apart from expenses. This month’s card purchases ({formatINR(cur.cardSpend)}) are already counted in Expenses. Bill payments are not.</p>
          </div>
        )}

        {/* ---------- 9. Month comparison ---------- */}
        <div className="card">
          <div className="card-head"><h2>Compared with {monthLabel(addMonths(monthKey, -1), false)}</h2></div>
          <table className="table">
            <thead><tr><th></th><th>{monthLabel(monthKey, false)}</th><th>{monthLabel(addMonths(monthKey, -1), false)}</th></tr></thead>
            <tbody>
              <tr><td>Income</td><td>{formatINR(cmp.received.cur)}</td><td>{formatINR(cmp.received.prev)}</td></tr>
              <tr><td>Expenses</td><td>{formatINR(cmp.spent.cur)}</td><td>{formatINR(cmp.spent.prev)}</td></tr>
              <tr><td>Saved</td><td>{formatINR(cmp.saved.cur)}</td><td>{formatINR(cmp.saved.prev)}</td></tr>
              <tr><td>Savings rate</td><td>{cmp.rate.cur === null ? '–' : `${Math.round(cmp.rate.cur)}%`}</td><td>{cmp.rate.prev === null ? '–' : `${Math.round(cmp.rate.prev)}%`}</td></tr>
            </tbody>
          </table>
          {monthKey !== nowKey && <p className="help" style={{ marginTop: 6 }}>Past month. Figures are final.</p>}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ borderLeft: `3px solid ${color}`, paddingLeft: 10, minWidth: 0 }}>
      <div className="muted small">{label}</div>
      <div className="num" style={{ fontSize: 'clamp(15px, 4.6vw, 20px)', fontWeight: 720, letterSpacing: '-0.02em', overflowWrap: 'anywhere' }}>{formatINR(value)}</div>
    </div>
  );
}

function ObsList({ title, icon, tone, items, empty }: { title: string; icon: React.ReactNode; tone: 'green' | 'amber'; items: Observation[]; empty: string }) {
  return (
    <div>
      <div className="row small" style={{ gap: 6, color: `var(--${tone})`, fontWeight: 700 }}>{icon}{title}</div>
      {items.length === 0 ? <p className="muted small" style={{ marginTop: 4 }}>{empty}</p> : (
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, display: 'grid', gap: 6 }}>
          {items.map((o) => <li key={o.id} style={{ fontSize: 14 }}>{o.text}</li>)}
        </ul>
      )}
    </div>
  );
}
