import { useMemo } from 'react';
import { CreditCard, Plus, Wallet, PiggyBank, ShoppingBag, Scale } from 'lucide-react';
import { allGoalProgress, weekBars } from '../../core/calc';
import { dueRecurring } from '../../core/recurring';
import { dayLabel, monthLabel, parseDate } from '../../core/dates';
import { formatCompact, formatINR, pct } from '../../core/money';
import { confirmRecurring, skipRecurring } from '../../data/repo';
import { PALETTE, Bar, Donut, Ring, StatusPill, Empty } from '../components';
import { NudgeCard, PageHeader } from '../page';
import { useApp } from '../app';
import { go } from '../router';

const STATUS_TEXT = {
  onTrack: "You're within your limits. Keep going.",
  watch: 'Some categories are close to their limit, or your pace is high.',
  over: 'You have gone over budget in at least one category.',
} as const;

export function Home() {
  const { data, cur, today, nudges, monthKey, nowKey, openSheet, toast } = useApp();
  const goals = useMemo(() => allGoalProgress(data, nowKey), [data, nowKey]);
  const week = useMemo(() => weekBars(data.transactions, cur.period, today), [data.transactions, cur.period, today]);
  const weekMax = Math.max(1, ...week.map((d) => d.spent));
  const due = useMemo(() => (monthKey === nowKey ? dueRecurring(data, monthKey, today) : []), [data, monthKey, nowKey, today]);
  const timePct = pct(cur.elapsed, cur.period.days);
  const spendPct = pct(cur.spent, cur.spendBudget);
  const savePct = pct(cur.saved, cur.savingsPlanned);
  const tagged = cur.needSpent + cur.wantSpent;
  const hasTxns = data.transactions.length > 0;
  const catById = new Map(data.categories.map((c) => [c.id, c]));

  const groupSlices = cur.groupRows.filter((g) => g.spent > 0).sort((a, b) => b.spent - a.spent).map((g, i) => ({ value: g.spent, color: PALETTE[i % PALETTE.length], name: g.group.name }));
  const util = [...cur.expenseRows].filter((r) => r.budget > 0).sort((a, b) => b.pct - a.pct).slice(0, 6);

  return (
    <>
      <PageHeader title="Overview" months />

      <div className="stack">
        <div className="card hero">
          <div className="status-line">
            <StatusPill status={cur.status} />
            <span className="muted small">{dayLabel(cur.period.start)} – {dayLabel(cur.period.end)}</span>
          </div>
          {cur.isCurrent && cur.daily ? (
            <div style={{ marginTop: 14 }}>
              <div className="muted small">Safe to spend today</div>
              <div className="big num">{formatINR(cur.daily.safeLeft)}</div>
              <div className="muted small" style={{ marginTop: 4 }}>
                {cur.daily.pool <= 0 ? 'Your flexible budget is used up. Stick to essentials.' : `${formatINR(cur.daily.limit)} a day for the next ${cur.daysLeft} day${cur.daysLeft === 1 ? '' : 's'}${cur.daily.spentToday ? ` · ${formatINR(cur.daily.spentToday)} spent today` : ''}`}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 14 }}>
              <div className="muted small">{monthKey > nowKey ? 'Upcoming month' : `${monthLabel(monthKey)} summary`}</div>
              <div className="big num">{formatINR(cur.spent)} <span className="muted" style={{ fontSize: 16, fontWeight: 600 }}>spent</span></div>
            </div>
          )}
          <p style={{ marginTop: 10 }}>{STATUS_TEXT[cur.status]}</p>
          <div className="divider" />
          <div className="stack" style={{ gap: 12 }}>
            <div>
              <div className="row between small"><span>Spending <span className="muted">· planned {formatINR(cur.spendBudget)}</span></span><b className="num">{formatINR(cur.spent)}</b></div>
              <div style={{ marginTop: 6 }}><Bar pct={spendPct} status={cur.status === 'over' ? 'over' : spendPct >= 80 ? 'watch' : 'onTrack'} marker={cur.isCurrent ? timePct : undefined} /></div>
              {cur.isCurrent && <div className="help" style={{ marginTop: 4 }}>The marker shows how far through the month you are ({Math.round(timePct)}%).</div>}
            </div>
            <div>
              <div className="row between small"><span>Saving <span className="muted">· planned {formatINR(cur.savingsPlanned)}</span></span><b className="num">{formatINR(cur.saved)}</b></div>
              <div style={{ marginTop: 6 }}><Bar pct={savePct} status="onTrack" /></div>
            </div>
          </div>
        </div>

        <div className="tiles">
          <Tile icon={<Wallet size={14} />} label="Received" value={formatINR(cur.received)} sub={cur.received === 0 && data.settings.salary > 0 ? `Expected ${formatCompact(data.settings.salary)}` : undefined} />
          <Tile icon={<PiggyBank size={14} />} label="Saved" value={formatINR(cur.saved)} tone="green" />
          <Tile icon={<ShoppingBag size={14} />} label="Spent" value={formatINR(cur.spent)} />
          <Tile icon={<Scale size={14} />} label="Budget left" value={formatINR(cur.budgetRemaining)} tone={cur.budgetRemaining < 0 ? 'red' : undefined} />
        </div>

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
            <div className="card-head"><h2>For you</h2><button className="link" onClick={() => go('/insights')}>See all</button></div>
            <div className="stack" style={{ gap: 10 }}>{nudges.slice(0, 3).map((n) => <NudgeCard key={n.id} n={n} />)}</div>
          </div>
        )}

        {!hasTxns && (
          <div className="card"><Empty emoji="✍️" title="Add your first entry" text="Tap the + button to log an expense in a few seconds.">
            <button className="btn primary" onClick={() => openSheet({ kind: 'txn' })}><Plus size={18} /> Add expense</button></Empty></div>
        )}

        <div className="grid cols">
          <div className="card">
            <div className="card-head"><h2>Where your money went</h2></div>
            {groupSlices.length === 0 ? <p className="muted">No spending yet this month.</p> : (
              <div className="donut-wrap">
                <Donut slices={groupSlices} size={140} stroke={20}><div className="num" style={{ fontWeight: 750, fontSize: 15 }}>{formatCompact(cur.spent)}</div><div className="muted" style={{ fontSize: 11 }}>spent</div></Donut>
                <div className="legend">
                  {groupSlices.slice(0, 6).map((g, i) => <div key={g.name}><i style={{ background: PALETTE[i % PALETTE.length] }} /><span className="truncate">{g.name}</span><span className="num">{Math.round(pct(g.value, cur.spent))}%</span></div>)}
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head"><h2>Budget used</h2><button className="link" onClick={() => go('/budget')}>All</button></div>
            {util.length === 0 ? <p className="muted">Set budgets to see how much of each you have used.</p> : (
              <div className="stack" style={{ gap: 12 }}>
                {util.map((r) => (
                  <div key={r.category.id}>
                    <div className="row between small"><span>{r.category.icon} {r.category.name}</span><span className="num muted">{formatCompact(r.spent)} / {formatCompact(r.budget)}</span></div>
                    <div style={{ marginTop: 5 }}><Bar pct={r.pct} status={r.status} thin /></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head"><h2>Savings progress</h2><button className="link" onClick={() => go('/goals')}>Goals</button></div>
            {goals.length === 0 ? <p className="muted">Add a goal to track your progress.</p> : (
              <div className="ring-row">
                {goals.slice(0, 6).map(({ goal, progress }) => (
                  <div className="ring-item" key={goal.id}>
                    <Ring pct={progress.pct} size={68} stroke={8} color={progress.status === 'offTrack' || progress.status === 'overdue' ? 'var(--amber)' : 'var(--green)'}>{goal.icon}</Ring>
                    <span className="n truncate">{goal.name}</span>
                    <span className="muted num">{Math.round(progress.pct)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

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
          </div>

          <div className="card">
            <div className="card-head"><h2>Needs vs wants</h2></div>
            {tagged === 0 ? <p className="muted">Tag expenses as Need or Want to see your split.</p> : (
              <>
                <div className="split-bar"><i style={{ width: `${pct(cur.needSpent, tagged)}%`, background: 'var(--green)' }} /><i style={{ width: `${pct(cur.wantSpent, tagged)}%`, background: 'var(--amber)' }} /></div>
                <div className="row between small" style={{ marginTop: 10 }}>
                  <span><b style={{ color: 'var(--green)' }}>Needs</b> {Math.round(pct(cur.needSpent, tagged))}% · {formatCompact(cur.needSpent)}</span>
                  <span><b style={{ color: 'var(--amber)' }}>Wants</b> {Math.round(pct(cur.wantSpent, tagged))}% · {formatCompact(cur.wantSpent)}</span>
                </div>
              </>
            )}
          </div>

          <div className="card">
            <div className="card-head"><h2>Credit card</h2><CreditCard size={18} className="muted" /></div>
            <div className="mid num">{formatINR(cur.cardSpend)}</div>
            <div className="muted small" style={{ marginTop: 4 }}>spent on cards this month{cur.cardBillPaid > 0 ? ` · ${formatINR(cur.cardBillPaid)} bill paid` : ''}</div>
            {cur.cardSpend > cur.cardBillPaid && <p className="help" style={{ marginTop: 8 }}>Card spends already count as expenses. Paying the bill is only a transfer.</p>}
          </div>
        </div>
      </div>
    </>
  );
}

function Tile({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub?: string; tone?: 'green' | 'red' }) {
  return (
    <div className="tile">
      <div className="lbl">{icon}{label}</div>
      <div className="val num" style={tone ? { color: `var(--${tone})` } : undefined}>{value}</div>
      {sub && <div className="muted small">{sub}</div>}
    </div>
  );
}
