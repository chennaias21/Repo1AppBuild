import { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, CreditCard, Plus, ShieldCheck, TrendingUp, Wallet, PiggyBank, ShoppingBag, Scale } from 'lucide-react';
import { allGoalProgress, healthScore, savingsRate, weekBars } from '../../core/calc';
import { categoryShares, emergencyCoverage, spentUpTo, topExpenses } from '../../core/analysis';
import { cardSummaries, cardTotals } from '../../core/cards';
import { dueRecurring } from '../../core/recurring';
import { dayLabel, monthLabel, parseDate } from '../../core/dates';
import { formatCompact, formatINR, pct } from '../../core/money';
import { confirmRecurring, skipRecurring } from '../../data/repo';
import { PALETTE, Bar, Donut, Empty, PlanBar, Ring, StackedBar, StatusPill } from '../components';
import { NudgeCard, PageHeader } from '../page';
import { useApp } from '../app';
import { go } from '../router';
import { cardTone, dueText } from './Cards';

const STATUS_TEXT = {
  onTrack: 'You are within your limits. Keep going.',
  watch: 'Some spending is close to its limit, or your pace is high.',
  over: 'You have gone over budget in at least one category.',
} as const;

function Delta({ now, before, goodWhenUp, label }: { now: number; before: number; goodWhenUp: boolean; label: string }) {
  if (before <= 0 && now <= 0) return <span className="muted small">{label}</span>;
  if (before <= 0) return <span className="muted small">New this month</span>;
  const d = now - before;
  const p = Math.round((d / before) * 100);
  if (p === 0) return <span className="muted small">Same as {label}</span>;
  const good = goodWhenUp ? d > 0 : d < 0;
  const Icon = d > 0 ? ArrowUpRight : ArrowDownRight;
  return <span className="small" style={{ color: good ? 'var(--green)' : 'var(--red)', fontWeight: 650, display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 4 }}><span className="row" style={{ gap: 2 }}><Icon size={14} />{Math.abs(p)}%</span><span className="muted" style={{ fontWeight: 500 }}>{label}</span></span>;
}

export function Home() {
  const { data, cur, prev, today, nudges, monthKey, nowKey, openSheet, toast } = useApp();
  const goals = useMemo(() => allGoalProgress(data, monthKey), [data, monthKey]);
  const health = useMemo(() => healthScore(cur, goals, data.settings), [cur, goals, data.settings]);
  const week = useMemo(() => weekBars(data.transactions, cur.period, today), [data.transactions, cur.period, today]);
  const due = useMemo(() => (monthKey === nowKey ? dueRecurring(data, monthKey, today) : []), [data, monthKey, nowKey, today]);
  const cards = useMemo(() => cardSummaries(data, today), [data, today]);
  const cardsTotal = useMemo(() => cardTotals(cards), [cards]);
  const shares = useMemo(() => categoryShares(cur), [cur]);
  const top = useMemo(() => topExpenses(data, cur, 5), [data, cur]);
  const cover = useMemo(() => emergencyCoverage(data, today, monthKey), [data, today, monthKey]);
  const catById = useMemo(() => new Map(data.categories.map((c) => [c.id, c])), [data.categories]);

  const left = cur.received - cur.spent - cur.saved;
  const rate = savingsRate(cur);
  const weekMax = Math.max(1, ...week.map((d) => d.spent));
  const tagged = cur.needSpent + cur.wantSpent;
  const hasTxns = data.transactions.length > 0;
  const prevSpentSamePoint = cur.isCurrent ? spentUpTo(data, prev.period.key, cur.elapsed) : prev.spent;
  const spendUsed = pct(cur.spent, cur.spendBudget);
  const timePct = pct(cur.elapsed, cur.period.days);
  const scoreColor = health.score >= 80 ? 'var(--green)' : health.score >= 60 ? 'var(--primary)' : health.score >= 40 ? 'var(--amber)' : 'var(--red)';
  const showCards = cards.length > 0 || cur.cardSpend > 0;

  const donut = shares.slice(0, 5).map((s, i) => ({ value: s.spent, color: PALETTE[i % PALETTE.length], name: s.name }));
  const restSpent = shares.slice(5).reduce((a, s) => a + s.spent, 0);
  if (restSpent > 0) donut.push({ value: restSpent, color: PALETTE[7], name: 'Everything else' });

  const allocation = [
    ...cur.groupRows.filter((g) => g.budget > 0).map((g, i) => ({ value: g.budget, color: PALETTE[(i + 2) % PALETTE.length], label: g.group.name })),
    { value: cur.savingsPlanned, color: 'var(--green)', label: 'Savings' },
    { value: Math.max(0, cur.unallocated), color: 'var(--card2)', label: 'Not planned' },
  ];

  return (
    <>
      <PageHeader title="Overview" months />

      <div className="stack">
        {/* ---- 1. The answer at a glance ---- */}
        <div className="card hero">
          <div className="status-line">
            <StatusPill status={cur.status} />
            <span className="muted small">{dayLabel(cur.period.start)} – {dayLabel(cur.period.end)}</span>
          </div>
          <div className="hero-grid">
            <div>
              <div className="muted small">{left >= 0 ? 'Left this month' : 'Overspent this month by'}</div>
              <div className="big num" style={left < 0 ? { color: 'var(--red)' } : undefined}>{formatINR(Math.abs(left))}</div>
              <div className="help">Income − expenses − savings</div>
            </div>
            <button className="health-chip" onClick={() => go('/insights')} aria-label={`Financial health ${health.score} out of 100. Open insights`}>
              <Ring pct={health.score} size={78} stroke={9} color={scoreColor}><b className="num" style={{ fontSize: 22 }}>{health.score}</b></Ring>
              <span className="small" style={{ fontWeight: 700, color: scoreColor }}>{health.label}</span>
            </button>
          </div>
          <p style={{ marginTop: 10 }}>{STATUS_TEXT[cur.status]}</p>
          {cur.isCurrent && cur.daily && (
            <div className="safe-box">
              <div className="row between" style={{ alignItems: 'flex-end' }}>
                <div>
                  <div className="muted small">Safe to spend today</div>
                  <div className="mid num">{formatINR(cur.daily.safeLeft)}</div>
                </div>
                <div className="muted small" style={{ textAlign: 'right' }}>
                  {cur.daily.pool <= 0 ? 'Flexible budget used up' : `${formatINR(cur.daily.limit)}/day · ${cur.daysLeft} day${cur.daysLeft === 1 ? '' : 's'} left`}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ---- 2. Key numbers ---- */}
        <div className="tiles">
          <Tile icon={<Wallet size={14} />} label="Income" value={formatINR(cur.received)}
            foot={cur.received === 0 && data.settings.salary > 0 ? <span className="muted small">Expected {formatCompact(data.settings.salary)}</span> : <Delta now={cur.received} before={prev.received} goodWhenUp label="vs last month" />} />
          <Tile icon={<ShoppingBag size={14} />} label="Expenses" value={formatINR(cur.spent)} foot={<Delta now={cur.spent} before={prevSpentSamePoint} goodWhenUp={false} label="vs last month" />} />
          <Tile icon={<PiggyBank size={14} />} label="Savings" value={formatINR(cur.saved)} tone="green"
            foot={<span className="muted small">{rate === null ? 'No income yet' : `${Math.round(rate)}% of income · goal ${data.settings.targetSavingsRate}%`}</span>} />
          <Tile icon={<Scale size={14} />} label="Budget left" value={formatINR(cur.budgetRemaining)} tone={cur.budgetRemaining < 0 ? 'red' : undefined}
            foot={<span className="muted small">{cur.spendBudget > 0 ? `${Math.round(spendUsed)}% of ${formatCompact(cur.spendBudget)} used` : 'No budget set'}</span>} />
        </div>

        {/* ---- 3. Things that need attention ---- */}
        {due.length > 0 && (
          <div className="card">
            <div className="card-head"><h2>Due now</h2><span className="muted small">Recurring</span></div>
            <div className="list">
              {due.map(({ item, date }) => {
                const c = item.categoryId ? catById.get(item.categoryId) : undefined;
                return (
                  <div className="item" key={item.id}>
                    <div className="emoji">{c?.icon ?? '🔁'}</div>
                    <div className="grow"><div className="title truncate">{item.note || c?.name || 'Recurring'}</div><div className="sub">{c?.name} · {dayLabel(date)}</div></div>
                    <div className="amt">{formatINR(item.amount)}</div>
                    <button className="btn sm primary" onClick={async () => { await confirmRecurring(item, monthKey, data.settings.monthStartDay, c?.goalId ?? null); toast('Added'); }}>Add</button>
                    <button className="btn sm" onClick={() => skipRecurring(item, monthKey)}>Skip</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {nudges.length > 0 && (
          <div className="card">
            <div className="card-head"><h2>Alerts & suggestions</h2><button className="link" onClick={() => go('/insights')}>See all</button></div>
            <div className="stack" style={{ gap: 10 }}>{nudges.slice(0, 3).map((n) => <NudgeCard key={n.id} n={n} />)}</div>
          </div>
        )}

        {!hasTxns && (
          <div className="card"><Empty emoji="✍️" title="Add your first entry" text="Tap the + button to log an expense in a few seconds.">
            <button className="btn primary" onClick={() => openSheet({ kind: 'txn' })}><Plus size={18} /> Add expense</button></Empty></div>
        )}

        <div className="grid cols">
          {/* ---- 4. Budget ---- */}
          <div className="card">
            <div className="card-head"><h2>Your budget</h2><button className="link" onClick={() => go('/budget')}>Manage</button></div>
            <StackedBar segments={allocation} />
            <div className="row between small" style={{ marginTop: 8 }}>
              <span className="muted">Planned spending <b className="num" style={{ color: 'var(--text)' }}>{formatCompact(cur.spendBudget)}</b></span>
              <span className="muted">Savings <b className="num" style={{ color: 'var(--text)' }}>{formatCompact(cur.savingsPlanned)}</b></span>
              <span className="muted">Not planned <b className="num" style={{ color: cur.unallocated < 0 ? 'var(--red)' : 'var(--text)' }}>{cur.unallocated < 0 ? '-' : ''}{formatCompact(Math.abs(cur.unallocated))}</b></span>
            </div>
            <div className="divider" />
            <div className="row between small"><b>Spent vs planned</b><span className="num muted">{formatINR(cur.spent)} of {formatINR(cur.spendBudget)}</span></div>
            <div style={{ marginTop: 6 }}><Bar pct={spendUsed} status={cur.status === 'over' ? 'over' : spendUsed >= data.settings.watchPct ? 'watch' : 'onTrack'} marker={cur.isCurrent ? timePct : undefined} /></div>
            {cur.isCurrent && <div className="help" style={{ marginTop: 4 }}>The marker shows how far through the month you are ({Math.round(timePct)}%).</div>}
            {cur.groupRows.length > 0 && (
              <div className="stack" style={{ gap: 10, marginTop: 14 }}>
                {cur.groupRows.filter((g) => g.budget > 0).map((g) => (
                  <div key={g.group.id}>
                    <div className="row between small"><span className="truncate">{g.group.icon} {g.group.name}</span><span className="num muted">{formatCompact(g.spent)} / {formatCompact(g.budget)}</span></div>
                    <div style={{ marginTop: 4 }}><PlanBar planned={g.budget} actual={g.spent} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ---- 5. Where the money went ---- */}
          <div className="card">
            <div className="card-head"><h2>Where your money went</h2><button className="link" onClick={() => go('/insights')}>Details</button></div>
            {shares.length === 0 ? <p className="muted">No spending yet this month.</p> : (
              <>
                <div className="donut-wrap">
                  <Donut slices={donut} size={132} stroke={19}><div className="num" style={{ fontWeight: 750, fontSize: 15 }}>{formatCompact(cur.spent)}</div><div className="muted" style={{ fontSize: 11 }}>spent</div></Donut>
                  <div className="legend">
                    {donut.map((g) => <div key={g.name}><i style={{ background: g.color }} /><span className="truncate">{g.name}</span><span className="num">{Math.round(pct(g.value, cur.spent))}%</span></div>).slice(0, 6)}
                  </div>
                </div>
                {top.length > 0 && (
                  <>
                    <div className="divider" />
                    <div className="lbl-s" style={{ marginBottom: 2 }}>Biggest expenses</div>
                    <div className="list">
                      {top.map((t) => {
                        const c = t.categoryId ? catById.get(t.categoryId) : undefined;
                        return (
                          <button className="item" key={t.id} onClick={() => openSheet({ kind: 'txn', edit: t })}>
                            <div className="emoji" style={{ width: 34, height: 34, fontSize: 16 }}>{c?.icon ?? '❔'}</div>
                            <div className="grow"><div className="title truncate" style={{ fontSize: 14 }}>{t.note || c?.name || 'Expense'}</div><div className="sub">{c?.name ?? 'Uncategorised'} · {dayLabel(t.date)}</div></div>
                            <div className="amt">{formatINR(t.amount)}</div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* ---- 6. Goals ---- */}
          <div className="card">
            <div className="card-head"><h2>Savings goals</h2><button className="link" onClick={() => go('/goals')}>All goals</button></div>
            {goals.length === 0 ? <p className="muted">Add a goal to track your progress.</p> : (
              <>
                <div className="ring-row">
                  {goals.slice(0, 6).map(({ goal, progress }) => (
                    <div className="ring-item" key={goal.id}>
                      <Ring pct={progress.pct} size={68} stroke={8} color={progress.status === 'offTrack' || progress.status === 'overdue' ? 'var(--amber)' : 'var(--green)'}>{goal.icon}</Ring>
                      <span className="n truncate">{goal.name}</span>
                      <span className="muted num">{Math.round(progress.pct)}%</span>
                    </div>
                  ))}
                </div>
                {cover && (
                  <div className="row small" style={{ marginTop: 10, gap: 8 }}>
                    <ShieldCheck size={16} color={cover.months >= 3 ? 'var(--green)' : 'var(--amber)'} />
                    <span>Emergency fund covers <b>{cover.months.toFixed(1)} months</b> of expenses{cover.months < 3 ? ' (aim for 3 to 6)' : ''}.</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ---- 7. Credit cards (liability, shown separately from expenses) ---- */}
          {showCards && (
            <div className="card">
              <div className="card-head"><h2>Credit cards</h2><button className="link" onClick={() => go('/cards')}>Details</button></div>
              {cards.length === 0 ? (
                <>
                  <div className="mid num">{formatINR(cur.cardSpend)}</div>
                  <p className="muted small" style={{ marginTop: 4 }}>spent on cards this month. Add your card to track what you owe and due dates.</p>
                  <button className="btn sm" style={{ marginTop: 10 }} onClick={() => openSheet({ kind: 'payment', type: 'credit' })}><CreditCard size={15} /> Add card</button>
                </>
              ) : (
                <>
                  <div className="muted small">You owe in total</div>
                  <div className="mid num">{formatINR(cardsTotal.outstanding)}</div>
                  <div className="stack" style={{ gap: 8, marginTop: 10 }}>
                    {cards.slice(0, 3).map((c) => (
                      <div className="row between" key={c.method.id} style={{ gap: 8 }}>
                        <div className="grow"><div className="small truncate" style={{ fontWeight: 650 }}>{c.method.name}</div><div className="help">{dueText(c)}</div></div>
                        <span className={`pill ${cardTone(c.status)}`}>{formatCompact(Math.max(0, c.status === 'paid' ? c.outstanding : c.dueRemaining || c.outstanding))}</span>
                      </div>
                    ))}
                  </div>
                  <p className="help" style={{ marginTop: 8 }}>Card purchases ({formatINR(cur.cardSpend)} this month) are already inside Expenses. Paying the bill does not count again.</p>
                </>
              )}
            </div>
          )}

          {/* ---- 8. Habits ---- */}
          <div className="card">
            <div className="card-head"><h2>This week</h2><span className="muted small num">{formatINR(week.reduce((s, d) => s + d.spent, 0))}</span></div>
            <div className="week" aria-label="Spending by day this week">
              {week.map((d) => (
                <div key={d.date} className={`col ${d.isToday ? 'today' : ''}`} title={`${dayLabel(d.date)}: ${formatINR(d.spent)}`}>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}><div className="b" style={{ height: `${Math.max(4, (d.spent / weekMax) * 100)}%` }} /></div>
                  <small>{['S', 'M', 'T', 'W', 'T', 'F', 'S'][parseDate(d.date).getDay()]}</small>
                </div>
              ))}
            </div>
            <div className="divider" />
            <div className="row between small"><b>Needs vs wants</b>{tagged > 0 && <span className="muted">{Math.round(pct(cur.wantSpent, tagged))}% wants</span>}</div>
            {tagged === 0 ? <p className="muted small" style={{ marginTop: 4 }}>Tag expenses as Need or Want to see your split.</p> : (
              <>
                <div style={{ marginTop: 6 }}><StackedBar segments={[{ value: cur.needSpent, color: 'var(--green)', label: 'Needs' }, { value: cur.wantSpent, color: 'var(--amber)', label: 'Wants' }]} height={10} /></div>
                <div className="row between small" style={{ marginTop: 6 }}>
                  <span><b style={{ color: 'var(--green)' }}>Needs</b> {formatCompact(cur.needSpent)}</span>
                  <span><b style={{ color: 'var(--amber)' }}>Wants</b> {formatCompact(cur.wantSpent)}</span>
                </div>
              </>
            )}
            {cur.isCurrent && cur.elapsed > 0 && (
              <div className="row small" style={{ marginTop: 10, gap: 8 }}>
                <TrendingUp size={16} className="muted" />
                <span>Averaging <b className="num">{formatINR(Math.round(cur.spent / cur.elapsed / 100) * 100)}</b> a day. Projected month-end: <b className="num">{formatCompact(cur.projectedSpend)}</b>{cur.spendBudget > 0 ? ` of ${formatCompact(cur.spendBudget)}` : ''}.</span>
              </div>
            )}
          </div>
        </div>
        {monthKey !== nowKey && <p className="help" style={{ textAlign: 'center' }}>Showing {monthLabel(monthKey)}. Tap the month name to jump back to today.</p>}
      </div>
    </>
  );
}

function Tile({ icon, label, value, foot, tone }: { icon: React.ReactNode; label: string; value: string; foot?: React.ReactNode; tone?: 'green' | 'red' }) {
  return (
    <div className="tile">
      <div className="lbl">{icon}{label}</div>
      <div className="val num" style={tone ? { color: `var(--${tone})` } : undefined}>{value}</div>
      {foot && <div style={{ marginTop: 2 }}>{foot}</div>}
    </div>
  );
}
